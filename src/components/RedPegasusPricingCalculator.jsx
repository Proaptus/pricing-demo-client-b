import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileJson, Printer, LogOut, Package } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts';

// Shared utilities
import formatGBP from './pricing/shared/formatGBP';
import ValidationAlert from './pricing/shared/ValidationAlert';
import { validateInputs, getValidationWarnings } from './pricing/shared/validation';

// GCS utilities
import {
  initializeGCS,
  loadProjectsFromGCS,
  loadRoleWeightsFromGCS,
  saveProjectsToGCS,
  saveRoleWeightsToGCS
} from '../services/gcsStorage';

// Analysis components
import MarginAnalysis from './pricing/MarginAnalysis';
import ScenarioLibrary from './pricing/ScenarioLibrary';
import ReportVariantSelector from './pricing/ReportVariantSelector';
import RedPegasusInternalReport from './pricing/RedPegasusInternalReport';
import RedPegasusQuoteReport from './pricing/RedPegasusQuoteReport';

// Help modal components
import HelpModal from './pricing/HelpModal';
import InfoIcon from './pricing/InfoIcon';
import { helpContent } from './pricing/helpContent';

/**
 * Red Pegasus Pricing Model
 *
 * A deliverables-based pricing model that allocates revenue based on value-days:
 * - Each deliverable has: name, owner (party), role, days, acceptance criteria
 * - Value-days = days × role weight
 * - Revenue is allocated proportionally by value-days
 * - Parties (RPG, Proaptus, etc.) receive their share based on total value-days
 *
 * Data persists directly in Google Cloud Storage - no server required
 * Based on Cornerstone architecture but with different calculation model
 */

/**
 * Generate a unique project ID
 */
function generateProjectId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Calculate the Red Pegasus pricing model with role-weighted day rates
 *
 * Model: Revenue allocation based on deliverable days × role weights
 * - Each role has a weight that multiplies the base day rate
 * - Account manager party gets 10% uplift on their final share
 * - Formula: deliverable_revenue = days × (base_rate × role_weight)
 */
function calculateRedPegasusModel(inputs) {
  const { clientRate, soldDays, deliverables, accountManagerParty, roleWeights = {} } = inputs;

  // Calculate total revenue
  const totalRevenue = clientRate * soldDays;

  // Calculate revenue for each deliverable based on role weights
  const deliverablesWithRevenue = deliverables.map(d => {
    const days = d.days || 0;
    const roleWeight = Number(roleWeights[d.role]) || 1.0;
    const effectiveRate = clientRate * roleWeight;
    const revenue = days * effectiveRate;
    return { ...d, days, roleWeight, effectiveRate, revenue };
  });

  // Calculate total weighted revenue (before uplift)
  const totalWeightedRevenue = deliverablesWithRevenue.reduce((sum, d) => sum + d.revenue, 0);

  // Calculate party allocations from deliverables
  const partyAllocations = {};
  deliverablesWithRevenue.forEach(d => {
    if (!partyAllocations[d.owner]) {
      partyAllocations[d.owner] = {
        days: 0,
        revenue: 0,
        deliverables: []
      };
    }
    partyAllocations[d.owner].days += d.days;
    partyAllocations[d.owner].revenue += d.revenue;
    partyAllocations[d.owner].deliverables.push(d);
  });

  // Apply 10% uplift to account manager party's revenue
  Object.keys(partyAllocations).forEach(party => {
    const allocation = partyAllocations[party];
    const upliftFactor = party === accountManagerParty ? 1.1 : 1.0;
    allocation.upliftFactor = upliftFactor;
    allocation.adjustedRevenue = allocation.revenue * upliftFactor;
  });

  // Calculate total adjusted revenue and percentages
  const totalAdjustedRevenue = Object.values(partyAllocations).reduce((sum, a) => sum + a.adjustedRevenue, 0);

  // Normalize to actual total revenue
  Object.keys(partyAllocations).forEach(party => {
    const allocation = partyAllocations[party];
    const normalizedShare = totalAdjustedRevenue > 0 ? allocation.adjustedRevenue / totalAdjustedRevenue : 0;
    allocation.percentage = normalizedShare * 100;
    allocation.share = allocation.percentage; // For compatibility
    allocation.finalRevenue = normalizedShare * totalRevenue;
  });

  // Calculate total days from deliverables
  const totalDays = deliverablesWithRevenue.reduce((sum, d) => sum + d.days, 0);

  // Prepare data for charts
  const partyChartData = Object.entries(partyAllocations).map(([party, data]) => ({
    name: party,
    value: data.finalRevenue,
    percentage: data.share
  }));

  // Prepare role distribution data
  const roleData = {};
  Object.keys(roleWeights).forEach(role => {
    roleData[role] = { days: 0, revenue: 0, weight: Number(roleWeights[role]) };
  });
  deliverablesWithRevenue.forEach(d => {
    if (d.role && roleData[d.role] !== undefined) {
      roleData[d.role].days += d.days;
      roleData[d.role].revenue += d.revenue;
    }
  });

  return {
    // Inputs
    clientRate,
    soldDays,
    totalRevenue,
    totalDays,
    accountManagerParty,
    roleWeights,

    // Calculations
    deliverables: deliverablesWithRevenue,
    totalWeightedRevenue,
    partyAllocations,

    // Chart data
    partyChartData,
    roleData,

    // For MarginAnalysis component
    rpg: partyAllocations['RPG'] || { days: 0, percentage: 0, revenue: 0, finalRevenue: 0 },
    proaptus: partyAllocations['Proaptus'] || { days: 0, percentage: 0, revenue: 0, finalRevenue: 0 },
    joint: partyAllocations['Joint'] || { days: 0, percentage: 0, revenue: 0, finalRevenue: 0 },
    total: { days: totalDays, revenue: totalRevenue }
  };
}

const RedPegasusPricingCalculator = ({ onLogout }) => {
  // Server connectivity state
  const [serverConnected, setServerConnected] = useState(true);
  const [serverError, setServerError] = useState(null);

  // Load current project and library from API
  const [currentProject, setCurrentProject] = useState(null);
  const [projectLibrary, setProjectLibrary] = useState({});
  const [roleWeights, setRoleWeights] = useState({});
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // State for inputs (will be initialized after loading)
  const [inputs, setInputs] = useState({
    clientRate: 950,
    soldDays: 45,
    deliverables: [],
    accountManagerParty: 'RPG',
    roleWeights: {}
  });

  // State for project metadata
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectBackground, setProjectBackground] = useState('');
  const [clientName, setClientName] = useState('');
  const [overview, setOverview] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [accountManager, setAccountManager] = useState('');
  const [accountManagerParty, setAccountManagerParty] = useState('RPG');
  const [status, setStatus] = useState('Active');

  // State for UI
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const [showProjectBackground, setShowProjectBackground] = useState(true);
  const [isEditingDeliverables, setIsEditingDeliverables] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [isEditingRoleWeights, setIsEditingRoleWeights] = useState(false);
  const [isEditingProjectInfo, setIsEditingProjectInfo] = useState(false);
  const [isEditingProjectRevenue, setIsEditingProjectRevenue] = useState(false);
  const [reportVariant, setReportVariant] = useState('INTERNAL');
  const [activeHelpKey, setActiveHelpKey] = useState(null);

  // Role weights metadata
  const [roleWeightsMetadata, setRoleWeightsMetadata] = useState({
    lastChanged: {
      date: '',
      reason: '',
      comment: ''
    }
  });

  // Role weights edit form state
  const [roleWeightsEditData, setRoleWeightsEditData] = useState({});
  const [roleWeightsChangeReason, setRoleWeightsChangeReason] = useState('');
  const [roleWeightsChangeComment, setRoleWeightsChangeComment] = useState('');

  const reportRef = useRef();

  // Load projects from GCS on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Initialize GCS with service account credentials
      const credentialsResponse = await fetch('/gcs-credentials.json');
      if (!credentialsResponse.ok) {
        throw new Error('GCS credentials not found');
      }
      const credentials = await credentialsResponse.json();
      await initializeGCS(credentials);

      // Load role weights from GCS
      const weightsData = await loadRoleWeightsFromGCS();
      if (weightsData.current) {
        setRoleWeights(weightsData.current);
        setRoleWeightsMetadata(weightsData);
      } else {
        setRoleWeights(weightsData);
      }

      // Load projects from GCS
      const projects = await loadProjectsFromGCS();
      setProjectLibrary(projects);
      setServerConnected(true);
      setServerError(null);

      // Load the first project from the library, or show empty state
      const projectIds = Object.keys(projects);
      if (projectIds.length === 0) {
        // Empty state - no projects
        setCurrentProject(null);
        setInputs({
          clientRate: 950,
          soldDays: 45,
          deliverables: [],
          accountManagerParty: 'RPG',
          roleWeights: weightsData.current || weightsData
        });
      } else {
        const firstProject = projects[projectIds[0]];
        setCurrentProject(firstProject);

        // Initialize all state from loaded project
        setProjectName(firstProject.name);
        setProjectDescription(firstProject.description || '');
        setProjectBackground(firstProject.background || '');
        setClientName(firstProject.clientName || '');
        setOverview(firstProject.overview || '');
        setStartDate(firstProject.startDate || '');
        setEndDate(firstProject.endDate || '');
        setProjectCode(firstProject.projectCode || '');
        setAccountManager(firstProject.accountManager || '');
        setAccountManagerParty(firstProject.accountManagerParty || 'RPG');
        setStatus(firstProject.status || 'Active');
        setInputs({
          clientRate: firstProject.clientRate,
          soldDays: firstProject.soldDays,
          deliverables: firstProject.deliverables,
          accountManagerParty: firstProject.accountManagerParty,
          roleWeights: weightsData.current || weightsData
        });
      }
    } catch (error) {
      // GCS connection failed
      setServerConnected(false);
      setServerError(error.message);
      setProjectLibrary({});
      setCurrentProject(null);
      console.error('Failed to connect to GCS:', error);
    }
    setIsLoading(false);
  };

  // Autosave effect - saves current project whenever it changes
  useEffect(() => {
    if (!autosaveEnabled || isLoading || !currentProject) return;

    const projectData = {
      id: currentProject.id,
      name: projectName,
      description: projectDescription,
      background: projectBackground,
      clientName,
      overview,
      startDate,
      endDate,
      projectCode,
      accountManager,
      accountManagerParty,
      status,
      clientRate: inputs.clientRate,
      soldDays: inputs.soldDays,
      deliverables: inputs.deliverables,
      lastModified: new Date().toISOString()
    };

    // Debounce the save to avoid too many GCS writes
    const timeoutId = setTimeout(async () => {
      try {
        console.log('🔄 Autosaving project to GCS:', projectData.id, projectData.name);

        // Get current library and update it
        const updatedLibrary = {
          ...projectLibrary,
          [projectData.id]: projectData
        };

        // Save to GCS
        await saveProjectsToGCS(updatedLibrary);

        // Update local state
        setProjectLibrary(updatedLibrary);

        console.log('✅ Project autosaved to GCS:', projectData.name);
      } catch (error) {
        console.error('❌ Autosave to GCS failed:', error);
      }
    }, 1000); // Wait 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [
    autosaveEnabled,
    isLoading,
    currentProject?.id,
    projectName,
    projectDescription,
    projectBackground,
    clientName,
    overview,
    startDate,
    endDate,
    projectCode,
    accountManager,
    accountManagerParty,
    status,
    inputs.clientRate,
    inputs.soldDays,
    inputs.deliverables
  ]);

  // NOTE: Role weights do NOT autosave - they require explicit save with change reason
  // This is by design to track when weights are changed and why

  // Calculate the model
  const model = useMemo(() => calculateRedPegasusModel(inputs), [inputs]);

  // Validation
  const validation = useMemo(() => validateInputs(inputs, inputs.deliverables), [inputs]);
  const warnings = useMemo(() => getValidationWarnings(inputs, model.partyAllocations || {}, inputs.deliverables), [inputs, model]);

  // Export data
  const exportData = () => {
    const exportPayload = {
      timestamp: new Date().toISOString(),
      project: currentProject.name,
      projectName,
      projectDescription,
      projectBackground,
      inputs,
      model,
      validation
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `red_pegasus_project_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
  });

  // Save project - UPDATE current project, don't create new one
  const saveProject = async () => {
    if (!currentProject) {
      alert('No project loaded. Please create or select a project first.');
      return;
    }

    // Clean deliverables to avoid circular references
    const cleanDeliverables = inputs.deliverables.map(d => ({
      id: d.id,
      name: d.name,
      owner: d.owner,
      role: d.role,
      days: d.days,
      acceptanceCriteria: d.acceptanceCriteria
    }));

    // Update current project data
    const updatedProject = {
      id: currentProject.id,
      name: projectName,
      description: projectDescription,
      background: projectBackground,
      clientName,
      overview,
      startDate,
      endDate,
      projectCode,
      accountManager,
      accountManagerParty,
      status,
      clientRate: inputs.clientRate,
      soldDays: inputs.soldDays,
      deliverables: cleanDeliverables,
      lastModified: new Date().toISOString()
    };

    try {
      // Update in library first
      const updatedLibrary = {
        ...projectLibrary,
        [updatedProject.id]: updatedProject
      };

      // Save to GCS
      await saveProjectsToGCS(updatedLibrary);

      // Update local state
      setCurrentProject(updatedProject);
      setProjectLibrary(updatedLibrary);

      console.log('✅ Project saved:', updatedProject.name);
      alert('✅ Project saved successfully!');
    } catch (error) {
      console.error('❌ Save failed:', error);
      alert('Failed to save project. Please try again.');
    }
  };

  // Start editing role weights
  const startEditingRoleWeights = () => {
    setRoleWeightsEditData({ ...inputs.roleWeights });
    setRoleWeightsChangeReason('');
    setRoleWeightsChangeComment('');
    setIsEditingRoleWeights(true);
  };

  // Cancel editing role weights
  const cancelEditingRoleWeights = () => {
    setIsEditingRoleWeights(false);
    setRoleWeightsEditData({});
    setRoleWeightsChangeReason('');
    setRoleWeightsChangeComment('');
  };

  // Save role weights changes
  const saveRoleWeightsChanges = async () => {
    if (!roleWeightsChangeReason) {
      alert('Please select a reason for this change');
      return;
    }

    try {
      console.log('🔄 Saving role weights with reason:', roleWeightsChangeReason);

      // Save to GCS with metadata in correct structure
      const metadata = {
        current: roleWeightsEditData,
        lastChanged: {
          date: new Date().toISOString(),
          reason: roleWeightsChangeReason,
          comment: roleWeightsChangeComment
        }
      };
      await saveRoleWeightsToGCS(metadata);

      // Update local state
      setRoleWeights(roleWeightsEditData);
      setRoleWeightsMetadata(metadata);

      // Update inputs
      setInputs(prev => ({
        ...prev,
        roleWeights: roleWeightsEditData
      }));

      console.log('✅ Role weights saved:', roleWeightsChangeReason);
      alert('✅ Role weights updated successfully!');
      setIsEditingRoleWeights(false);
      setRoleWeightsChangeReason('');
      setRoleWeightsChangeComment('');
    } catch (error) {
      console.error('❌ Failed to save role weights:', error);
      alert('Failed to save role weights. Please try again.');
    }
  };

  // Load project from library
  const loadProject = (project) => {
    // Set as current project
    setCurrentProject(project);

    // Load all project metadata
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setProjectBackground(project.background || '');
    setClientName(project.clientName || '');
    setOverview(project.overview || '');
    setStartDate(project.startDate || '');
    setEndDate(project.endDate || '');
    setProjectCode(project.projectCode || '');
    setAccountManager(project.accountManager || '');
    setAccountManagerParty(project.accountManagerParty || 'RPG');
    setStatus(project.status || 'Active');

    // Load inputs
    setInputs({
      clientRate: project.clientRate,
      soldDays: project.soldDays,
      deliverables: project.deliverables,
      accountManagerParty: project.accountManagerParty || 'RPG',
      roleWeights: roleWeights
    });

    setShowLibrary(false);
    setIsEditingDeliverables(false);
  };

  // Delete project
  const deleteProject = async (id) => {
    try {
      // Calculate updated library first
      const updatedLibrary = { ...projectLibrary };
      delete updatedLibrary[id];

      // Save updated library to GCS
      await saveProjectsToGCS(updatedLibrary);

      // Update state
      setProjectLibrary(updatedLibrary);

      // If we deleted the current project, switch to another or show empty state
      if (currentProject && currentProject.id === id) {
        const remaining = Object.values(updatedLibrary);
        if (remaining.length > 0) {
          loadProject(remaining[0]);
        } else {
          // No projects left - show empty state
          setCurrentProject(null);
        }
      }

      console.log('✅ Project deleted:', id);
    } catch (error) {
      console.error('❌ Delete failed:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  // Create new project
  const createNewProject = async (newProjectName) => {
    try {
      // Generate unique ID locally
      const id = generateProjectId();

      // Create new project with empty deliverables
      const newProject = {
        id,
        name: newProjectName,
        description: '',
        background: '',
        clientName: '',
        overview: '',
        startDate: '',
        endDate: '',
        projectCode: '',
        accountManager: '',
        accountManagerParty: 'RPG',
        status: 'Active',
        clientRate: 950,
        soldDays: 45,
        deliverables: [],
        lastModified: new Date().toISOString()
      };

      // Update library and save to GCS
      const updatedLibrary = {
        ...projectLibrary,
        [id]: newProject
      };
      await saveProjectsToGCS(updatedLibrary);

      // Update local state
      setProjectLibrary(prev => ({
        ...prev,
        [id]: newProject
      }));

      // Load the new project
      loadProject(newProject);

      console.log('✅ New project created:', newProject.name);
      setShowNewProjectModal(false);
    } catch (error) {
      console.error('❌ Failed to create project:', error);
      alert('Failed to create new project. Please try again.');
    }
  };

  // Update deliverable
  const updateDeliverable = (id, field, value) => {
    setInputs(prev => ({
      ...prev,
      deliverables: prev.deliverables.map(d =>
        d.id === id ? { ...d, [field]: value } : d
      )
    }));
  };

  // Delete deliverable
  const deleteDeliverable = (id) => {
    setInputs(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter(d => d.id !== id)
    }));
  };

  const rpgAllocation = model.partyAllocations['RPG'] || { finalRevenue: 0, percentage: 0 };
  const proaptusAllocation = model.partyAllocations['Proaptus'] || { finalRevenue: 0, percentage: 0 };
  const clientRateValue = inputs.clientRate || 0;
  const formattedClientDayRate = formatGBP(
    clientRateValue,
    Number.isInteger(clientRateValue) ? 0 : 2
  );

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 md:mb-8 bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between gap-2 md:gap-4 mb-4">
            {/* Logo and Title Section */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 min-w-0">
              {/* Logos Container */}
              <img
                src="https://firebasestorage.googleapis.com/v0/b/proaptus-website.firebasestorage.app/o/LOGO_RGB%20(1).svg?alt=media&token=72b5eb8b-c509-40af-b8d1-84861040be37"
                alt="Proaptus Logo"
                className="w-16 md:w-24 h-auto flex-shrink-0"
              />
              <div className="w-px h-8 md:h-12 bg-slate-200 flex-shrink-0"></div>
              <img
                src="https://www.redpegasus.co.uk/hs-fs/hubfs/Red%20Pegausus%20Logo%20-%20Full%20-%20Light-1.png?width=436&name=Red%20Pegausus%20Logo%20-%20Full%20-%20Light-1.png"
                alt="Red Pegasus Logo"
                className="w-16 md:w-24 h-auto brightness-[0.6] hue-rotate-[340deg] saturate-[3] flex-shrink-0"
                style={{ filter: 'brightness(0) saturate(100%) invert(23%) sepia(90%) saturate(3500%) hue-rotate(345deg) brightness(95%) contrast(105%)' }}
              />
            </div>
            {/* Logout Button - Right aligned */}
            <div className="flex-shrink-0">
              <button
                onClick={onLogout}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm md:text-base"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          {/* Title Section */}
          <div className="border-t border-slate-200 pt-3 md:pt-4">
            <h1 className="text-lg md:text-2xl font-bold text-slate-900 mb-1 break-words">
              Proaptus & Red Pegasus Joint Pricing Model
            </h1>
            <p className="text-xs md:text-sm text-slate-600">
              Deliverables-Based Revenue Allocation
            </p>
          </div>
        </header>

        {/* Server Connection Error */}
        {!serverConnected && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Server connection lost</h2>
            <p className="text-red-700 mb-4">
              Unable to connect to the Red Pegasus API server. Please ensure the server is running on port 3557.
            </p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Validation Alert */}
        {currentProject && (
          <ValidationAlert
            validation={validation}
            warnings={warnings}
          />
        )}

        {/* Action Buttons - Top */}
        <div className="bg-white rounded-lg shadow mb-6 p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button
                onClick={saveProject}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
              >
                <FileJson className="w-4 h-4" />
                <span className="hidden sm:inline">Save Project</span>
                <span className="sm:hidden">Save</span>
              </button>
              <button
                onClick={() => setShowLibrary(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm md:text-base"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Project Library</span>
                <span className="sm:hidden">Library</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-3 md:px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm md:text-base"
              >
                <FileJson className="w-4 h-4" />
                <span className="hidden sm:inline">Export JSON</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button
                onClick={() => setShowReportSelector(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm md:text-base"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print Report</span>
                <span className="sm:hidden">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Project Selector - Live Projects from Library */}
        {serverConnected && (
          <section className="bg-white rounded-lg shadow p-4 md:p-6 mb-6" data-component="project-selector">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">Your Projects</h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1">{Object.keys(projectLibrary).length} project{Object.keys(projectLibrary).length !== 1 ? 's' : ''} available</p>
              </div>
              {Object.keys(projectLibrary).length > 0 && (
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm md:text-base flex-shrink-0 whitespace-nowrap"
                >
                  <span className="hidden sm:inline">+ New Project</span>
                  <span className="sm:hidden">+ New</span>
                </button>
              )}
            </div>

            {Object.keys(projectLibrary).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-slate-600 mb-4">No projects found</p>
                <p className="text-sm text-slate-500 mb-6">Create your first project to get started</p>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create New Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(projectLibrary).map(([key, project]) => (
                  <button
                    key={key}
                    onClick={() => {
                      // Load the selected project
                      loadProject(project);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                      currentProject && currentProject.id === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{project.name}</h3>
                        {project.clientName && (
                          <p className="text-xs text-slate-600 mt-1">Client: {project.clientName}</p>
                        )}
                      </div>
                      {currentProject && currentProject.id === key && (
                        <span className="inline-block ml-2 px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded whitespace-nowrap">Active</span>
                      )}
                    </div>
                    {project.projectCode && (
                      <p className="text-xs text-slate-500 mb-2">Code: {project.projectCode}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                      <div>
                        <span className="text-slate-500">Days:</span>
                        <p className="font-semibold text-slate-700">{project.soldDays || 0}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Deliverables:</span>
                        <p className="font-semibold text-slate-700">{(project.deliverables || []).length}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{project.clientRate ? formatGBP(project.clientRate) : '—'}</span>
                        <span className="text-slate-400">/day</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(project.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Main Content - Only show when project is loaded */}
        {currentProject && (
          <>
            {/* Project Information */}
            <section className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-semibold text-slate-900">Project Information</h2>
              <InfoIcon onClick={() => setActiveHelpKey('projectInformation')} />
            </div>
            <button
              onClick={() => setIsEditingProjectInfo(!isEditingProjectInfo)}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded transition-colors flex-shrink-0 whitespace-nowrap ${
                isEditingProjectInfo
                  ? 'text-slate-700 border border-slate-300 hover:bg-slate-50'
                  : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              {isEditingProjectInfo ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="space-y-4">
            {/* Row 1: Title & Client */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="project-title" className="block text-sm font-medium text-slate-700 mb-2">Project Title</label>
                <input
                  id="project-title"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={!isEditingProjectInfo}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                  placeholder="e.g., Simpson Travel KB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={!isEditingProjectInfo}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                  placeholder="e.g., Simpson Travel"
                />
              </div>
            </div>

            {/* Row 2: Overview (Full Width) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Overview</label>
              <textarea
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                disabled={!isEditingProjectInfo}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                placeholder="Brief description of the project objectives and scope..."
              />
            </div>

            {/* Row 3: Start Date & End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!isEditingProjectInfo}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!isEditingProjectInfo}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Row 4: Project Code & Account Manager */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Code</label>
                <input
                  type="text"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  disabled={!isEditingProjectInfo}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                  placeholder="e.g., ST-KB-2025-Q1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Manager</label>
                <input
                  type="text"
                  value={accountManager}
                  onChange={(e) => setAccountManager(e.target.value)}
                  disabled={!isEditingProjectInfo}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                  placeholder="e.g., Colin (RPG)"
                />
              </div>
            </div>

            {/* Row 5: Status & Account Manager Party */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!isEditingProjectInfo}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                >
                  <option value="Active">Active</option>
                  <option value="Planning">Planning</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Manager Party (10% Uplift)</label>
                <select
                  value={accountManagerParty}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAccountManagerParty(value);
                    setInputs(prev => ({ ...prev, accountManagerParty: value }));
                  }}
                  disabled={!isEditingProjectInfo}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                >
                  <option value="RPG">RPG</option>
                  <option value="Proaptus">Proaptus</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Party receives 10% revenue uplift for account management
                </p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-500 text-xs font-medium">Total Value</p>
                  <p className="text-slate-900 font-semibold text-base md:text-lg">{formatGBP(model.totalRevenue)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-500 text-xs font-medium">Allocated Days</p>
                  <p className="text-slate-900 font-semibold text-base md:text-lg">{inputs.soldDays} days</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-500 text-xs font-medium">Deliverables</p>
                  <p className="text-slate-900 font-semibold text-base md:text-lg">{inputs.deliverables.length}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Project Revenue */}
        <section className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">Project Revenue</h2>
            <button
              onClick={() => setIsEditingProjectRevenue(!isEditingProjectRevenue)}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded transition-colors flex-shrink-0 whitespace-nowrap ${
                isEditingProjectRevenue
                  ? 'text-slate-700 border border-slate-300 hover:bg-slate-50'
                  : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              {isEditingProjectRevenue ? 'Done' : 'Edit'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client-day-rate" className="block text-sm font-medium text-slate-700 mb-2">
                Client Day Rate (£)
              </label>
              <input
                id="client-day-rate"
                type="number"
                value={inputs.clientRate}
                onChange={(e) => setInputs(prev => ({ ...prev, clientRate: parseFloat(e.target.value) || 0 }))}
                disabled={!isEditingProjectRevenue}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="total-sold-days" className="block text-sm font-medium text-slate-700 mb-2">
                Total Sold Days
              </label>
              <input
                id="total-sold-days"
                type="number"
                value={inputs.soldDays}
                onChange={(e) => setInputs(prev => ({ ...prev, soldDays: parseFloat(e.target.value) || 0 }))}
                disabled={!isEditingProjectRevenue}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Role Weights Configuration */}
        <section className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">Role Weights (Day Rate Multipliers)</h2>
                <InfoIcon onClick={() => setActiveHelpKey('roleWeights')} />
              </div>
              {roleWeightsMetadata?.lastChanged?.date && (
                <p className="text-xs text-slate-500">
                  Last changed: {new Date(roleWeightsMetadata.lastChanged.date).toLocaleDateString()} ({roleWeightsMetadata.lastChanged.reason})
                  {roleWeightsMetadata.lastChanged.comment && ` - ${roleWeightsMetadata.lastChanged.comment}`}
                </p>
              )}
            </div>
            <button
              onClick={isEditingRoleWeights ? cancelEditingRoleWeights : startEditingRoleWeights}
              className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                isEditingRoleWeights
                  ? 'text-slate-700 border border-slate-300 hover:bg-slate-50'
                  : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              {isEditingRoleWeights ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {!isEditingRoleWeights ? (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Click "Edit" above to modify multipliers. These are applied to the base client day rate of {formatGBP(inputs.clientRate)} to calculate effective day rates.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(inputs.roleWeights).map(([role, weight]) => (
                  <div key={role} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                      {role}
                    </label>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-lg font-semibold text-slate-900">
                        {Number(weight).toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({formatGBP(inputs.clientRate * Number(weight))})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Edit modal
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
              <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 md:p-6 border-b border-slate-200">
                  <h3 className="text-base md:text-lg font-semibold text-slate-900">Edit Role Weights</h3>
                  <p className="text-xs md:text-sm text-slate-600 mt-1">Modify the multipliers and provide a reason for the change</p>
                </div>

                <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                  {/* Role weights editing grid */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">Role Weights</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(roleWeightsEditData).map(([role, weight]) => (
                        <div key={role}>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            {role}
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={weight}
                              onChange={(e) => setRoleWeightsEditData(prev => ({
                                ...prev,
                                [role]: parseFloat(e.target.value) || 1.0
                              }))}
                              className="w-20 px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              step="0.05"
                              min="0.5"
                              max="2.0"
                            />
                            <span className="text-xs text-slate-500">
                              = {formatGBP(inputs.clientRate * weight)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Change reason */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Change *</label>
                    <select
                      value={roleWeightsChangeReason}
                      onChange={(e) => setRoleWeightsChangeReason(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select a reason --</option>
                      <option value="Agreed">Agreed (Client/Team agreement)</option>
                      <option value="Testing">Testing (Experimental adjustment)</option>
                      <option value="Correction">Correction (Fix previous error)</option>
                      <option value="Adjustment">Adjustment (Market/rate change)</option>
                      <option value="Client Request">Client Request</option>
                    </select>
                  </div>

                  {/* Change comment */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Additional Notes (optional)</label>
                    <textarea
                      value={roleWeightsChangeComment}
                      onChange={(e) => setRoleWeightsChangeComment(e.target.value)}
                      placeholder="e.g., Senior architect premium rate increase..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows="3"
                    />
                  </div>
                </div>

                {/* Modal buttons */}
                <div className="p-4 md:p-6 border-t border-slate-200 flex justify-end gap-2 md:gap-3">
                  <button
                    onClick={cancelEditingRoleWeights}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRoleWeightsChanges}
                    disabled={!roleWeightsChangeReason}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    Done Editing & Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Deliverables */}
        <section className="bg-white rounded-lg shadow p-4 md:p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Deliverables & Revenue Overview
              <InfoIcon onClick={() => setActiveHelpKey('deliverables')} />
            </h2>
            <button
              onClick={() => setIsEditingDeliverables(!isEditingDeliverables)}
              className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                isEditingDeliverables
                  ? 'text-slate-700 border border-slate-300 hover:bg-slate-50'
                  : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              {isEditingDeliverables ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900">{formatGBP(model.totalRevenue)}</p>
              <p className="text-sm text-slate-500 mt-2">
                {inputs.soldDays} days sold @ {formattedClientDayRate} per day
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">RPG Allocation</p>
              <p className="text-3xl font-bold text-slate-900">{formatGBP(rpgAllocation.finalRevenue || 0)}</p>
              <p className="text-sm text-slate-500 mt-2">
                {(Number.isFinite(rpgAllocation.percentage) ? rpgAllocation.percentage : 0).toFixed(1)}% of revenue
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-1">Proaptus Allocation</p>
              <p className="text-3xl font-bold text-slate-900">{formatGBP(proaptusAllocation.finalRevenue || 0)}</p>
              <p className="text-sm text-slate-500 mt-2">
                {(Number.isFinite(proaptusAllocation.percentage) ? proaptusAllocation.percentage : 0).toFixed(1)}% of revenue
              </p>
            </div>
          </div>

          {(() => {
            // Calculate total price across ALL deliverables for percentage calculation
            const allDeliverablesTotalPrice = inputs.deliverables.reduce((sum, d) => {
              const deliverableDays = Number.isFinite(d.days) ? d.days : 0;
              const roleWeight = Number(inputs.roleWeights[d.role]) || 1.0;
              const effectiveDayRate = inputs.clientRate * roleWeight;
              return sum + (deliverableDays * effectiveDayRate);
            }, 0);

            return ['RPG', 'Proaptus'].map((party) => {
              const partyDeliverables = inputs.deliverables.filter(d => d.owner === party);
              const partyDaysTotal = partyDeliverables.reduce((sum, d) => sum + (d.days || 0), 0);
              const partyFinalRevenue = model.partyAllocations[party]?.finalRevenue || 0;
              const partyPercentage = Number.isFinite(model.partyAllocations[party]?.percentage)
                ? model.partyAllocations[party].percentage
                : 0;
              // Calculate the actual total price for all deliverables for this party
              const partyTotalPrice = partyDeliverables.reduce((sum, d) => {
                const deliverableDays = Number.isFinite(d.days) ? d.days : 0;
                const roleWeight = Number(inputs.roleWeights[d.role]) || 1.0;
                const effectiveDayRate = inputs.clientRate * roleWeight;
                return sum + (deliverableDays * effectiveDayRate);
              }, 0);
              const pricePercentage = allDeliverablesTotalPrice > 0 ? (partyTotalPrice / allDeliverablesTotalPrice) * 100 : 0;

            return (
              <div key={party} className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                  <h3 className="font-semibold text-slate-900 text-base md:text-lg">{party}</h3>
                  {isEditingDeliverables && (
                    <button
                      onClick={() => {
                        const maxId = Math.max(...inputs.deliverables.map(d => d.id || 0), 0);
                        setInputs(prev => ({
                          ...prev,
                          deliverables: [...prev.deliverables, {
                            id: maxId + 1,
                            name: 'New Deliverable',
                            owner: party,
                            role: 'Development',
                            days: 0,
                            acceptanceCriteria: ''
                          }]
                        }));
                      }}
                      className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      + Add Deliverable
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-300">
                        <th className="text-left py-3 px-4 text-sm font-bold text-slate-900 align-middle">ID</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-slate-900 align-middle">Deliverable Name</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-slate-900 align-middle">Role</th>
                        <th className="text-right py-3 px-4 text-sm font-bold text-slate-900 align-middle">Days</th>
                        <th className="text-right py-3 px-4 text-sm font-bold text-slate-900 align-middle">Day Rate</th>
                        <th className="text-right py-3 px-4 text-sm font-bold text-slate-900 align-middle">Total Price</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-slate-900 align-middle">Acceptance Criteria</th>
                        {isEditingDeliverables && (
                          <th className="text-center py-3 px-4 text-sm font-bold text-slate-900 align-middle">Action</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {partyDeliverables.length === 0 ? (
                        <tr>
                          <td colSpan={isEditingDeliverables ? 8 : 7} className="py-4 px-4 text-center text-slate-500 align-middle">
                            No deliverables assigned to {party}.{isEditingDeliverables ? ' Click "+ Add Deliverable" to create one.' : ''}
                          </td>
                        </tr>
                      ) : (
                        partyDeliverables.map((d, index) => {
                          const deliverableDays = Number.isFinite(d.days) ? d.days : 0;
                          const roleWeight = Number(inputs.roleWeights[d.role]) || 1.0;
                          const effectiveDayRate = inputs.clientRate * roleWeight;
                          const totalPrice = deliverableDays * effectiveDayRate;
                          const deliverableId = `${party === 'RPG' ? 'RPG' : 'PRO'}-D${String(index + 1).padStart(2, '0')}`;

                          return (
                            <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 align-middle">
                              <td className="py-3 px-4 align-middle">
                                <span className="font-mono text-xs text-slate-600">{deliverableId}</span>
                              </td>
                              <td className="py-3 px-4 align-middle">
                                {isEditingDeliverables ? (
                                  <input
                                    type="text"
                                    value={d.name}
                                    onChange={(e) => updateDeliverable(d.id, 'name', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span className="font-medium text-slate-800">{d.name}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 align-middle">
                                {isEditingDeliverables ? (
                                  <select
                                    value={d.role || 'Development'}
                                    onChange={(e) => updateDeliverable(d.id, 'role', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {Object.keys(inputs.roleWeights).map(role => (
                                      <option key={role} value={role}>{role}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-slate-700">{d.role}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right align-middle">
                                {isEditingDeliverables ? (
                                  <input
                                    type="number"
                                    value={d.days}
                                    onChange={(e) => updateDeliverable(d.id, 'days', parseFloat(e.target.value) || 0)}
                                    step="0.25"
                                    min="0"
                                    className="w-24 px-3 py-2 border border-slate-300 rounded text-slate-900 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span className="font-mono tabular-nums text-slate-700">{deliverableDays.toFixed(2)}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 align-middle">
                                {formatGBP(effectiveDayRate)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 align-middle">
                                {formatGBP(totalPrice)}
                              </td>
                              <td className="py-3 px-4 align-middle">
                                {isEditingDeliverables ? (
                                  <textarea
                                    value={d.acceptanceCriteria || ''}
                                    onChange={(e) => updateDeliverable(d.id, 'acceptanceCriteria', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter acceptance criteria"
                                  />
                                ) : (
                                  <div className="text-xs text-slate-600 whitespace-pre-line max-w-md">
                                    {d.acceptanceCriteria || 'No acceptance criteria provided.'}
                                  </div>
                                )}
                              </td>
                              {isEditingDeliverables && (
                                <td className="py-3 px-4 text-center align-middle">
                                  <button
                                    onClick={() => deleteDeliverable(d.id)}
                                    className="px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors text-xs font-semibold"
                                  >
                                    Delete
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                      {partyDeliverables.length > 0 && (
                        <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold">
                          <td className="py-3 px-4 align-middle"></td>
                          <td className="py-3 px-4 align-middle text-slate-900 text-sm">TOTAL</td>
                          <td className="py-3 px-4 align-middle text-slate-600 text-sm">{partyDeliverables.length} deliverables</td>
                          <td className="py-3 px-4 text-right align-middle font-mono tabular-nums text-slate-900 text-sm">{partyDaysTotal.toFixed(2)}</td>
                          <td className="py-3 px-4 align-middle"></td>
                          <td className="py-3 px-4 text-right align-middle font-mono tabular-nums font-bold text-slate-900 text-sm">{formatGBP(partyTotalPrice)}</td>
                          <td className="py-3 px-4 align-middle text-slate-600 text-sm">{pricePercentage.toFixed(1)}% of price</td>
                          {isEditingDeliverables && (
                            <td className="py-3 px-4 align-middle"></td>
                          )}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
            );
          });
          })()}

        </section>

        {/* Margin Analysis (if needed for internal reporting) - can be toggled */}
        {false && <MarginAnalysis model={model} formatGBP={formatGBP} />}

        {/* Profit Split Analysis */}
        <section className="bg-white rounded-lg shadow p-4 md:p-6 mb-6" data-component="profit-split-analysis">
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">Profit Split Analysis</h2>
            <InfoIcon onClick={() => setActiveHelpKey('profitSplitAnalysis')} />
          </div>
          <p className="text-xs md:text-sm text-slate-600 mb-4">
            Revenue allocation based on internal weighting with {inputs.accountManagerParty} receiving a 10% uplift for account management responsibilities. 
            Price represents calculated value before normalization; Revenue shows final allocation after uplift and normalization.
          </p>
          
          {/* Enhanced Cards */}
          <div className="grid gap-4 md:gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
            {Object.entries(model.partyAllocations)
              .filter(([_, data]) => data.finalRevenue > 0)
              .map(([party, data]) => {
                const pricePercentage = model.totalWeightedRevenue > 0 
                  ? (data.revenue / model.totalWeightedRevenue) * 100 
                  : 0;
                const revenuePercentage = Number.isFinite(data.percentage) ? data.percentage : 0;
                const effectiveBlendedRate = data.days > 0 ? data.finalRevenue / data.days : 0;
                const difference = revenuePercentage - pricePercentage;
                const hasUplift = data.upliftFactor > 1.0;
                
                return (
                  <div key={party} className="bg-gradient-to-br from-slate-50 to-white rounded-lg border-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4 md:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 md:mb-4 pb-3 md:pb-4 border-b border-slate-200">
                      <h3 className="text-lg md:text-xl font-bold text-slate-900">{party}</h3>
                      {hasUplift && (
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 md:px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                          +10% Uplift
                        </span>
                      )}
                    </div>
                    
                    {/* Final Revenue */}
                    <div className="mb-3 md:mb-4">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Final Revenue</span>
                        <span className="text-xl md:text-2xl font-bold text-slate-900 break-words text-right ml-2">{formatGBP(data.finalRevenue)}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {revenuePercentage.toFixed(1)}% of total revenue
                      </div>
                    </div>
                    
                    {/* Price vs Revenue Comparison */}
                    <div className="mb-3 md:mb-4 p-2 md:p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Price vs Revenue Split</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs text-slate-600 flex-shrink-0">Price (Before Norm)</span>
                          <span className="text-xs font-mono tabular-nums text-slate-700 text-right break-words">
                            {formatGBP(data.revenue)} ({pricePercentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 flex-shrink-0">Revenue (After Norm)</span>
                          <span className="text-xs font-mono tabular-nums font-semibold text-slate-900 text-right break-words">
                            {formatGBP(data.finalRevenue)} ({revenuePercentage.toFixed(1)}%)
                          </span>
                        </div>
                        {Math.abs(difference) > 0.1 && (
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200 gap-2">
                            <span className="text-xs text-slate-600">Difference</span>
                            <span className={`text-xs font-semibold ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {difference > 0 ? '+' : ''}{difference.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Effective Blended Rate */}
                    <div className="mb-3 md:mb-4 p-2 md:p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-baseline mb-1 gap-2">
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex-shrink-0">Effective Blended Rate</span>
                        <span className="text-lg md:text-xl font-bold text-blue-900 text-right break-words">
                          {formatGBP(effectiveBlendedRate, 0)}/day
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        {data.days.toFixed(1)} days allocated
                      </div>
                    </div>
                    
                    {/* Days Summary */}
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600">Days Allocated</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          {data.days.toFixed(2)} days
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Margin Analysis - Visual Dashboard */}
          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-200">
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg border-2 border-slate-200 shadow-sm p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold text-slate-900 mb-2">Gross Margin Analysis</h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 md:p-4 rounded-r-lg mb-4 md:mb-6">
                <p className="text-xs md:text-sm text-slate-700 font-medium mb-1">
                  <span className="font-bold text-blue-700">Assumption:</span> Resource costs are 50% of the price (before normalization)
                </p>
                <p className="text-xs text-slate-600 break-words">
                  Cost = 50% × Price • Margin = Revenue - Cost • Margin % = (Margin ÷ Revenue) × 100
                </p>
              </div>
              
              {/* Margin Analysis Cards Grid */}
              <div className="grid gap-4 md:gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
                {Object.entries(model.partyAllocations)
                  .filter(([_, data]) => data.finalRevenue > 0)
                  .map(([party, data], index) => {
                    // Cost is 50% of the PRICE (before normalization), not revenue
                    const price = data.revenue; // Price before normalization
                    const cost = price * 0.5; // 50% of price
                    const revenue = data.finalRevenue; // Revenue after normalization
                    const margin = revenue - cost; // Margin = Revenue - Cost
                    const marginPercentage = revenue > 0 ? (margin / revenue) * 100 : 0;
                    const costPercentage = revenue > 0 ? (cost / revenue) * 100 : 0;
                    
                    // Prepare data for radial chart - using blue/slate color scheme
                    const radialData = [
                      { name: 'Margin', value: marginPercentage, fill: '#3b82f6' },
                      { name: 'Cost', value: costPercentage, fill: '#64748b' }
                    ];
                    
                    return (
                      <div key={party} className="relative bg-gradient-to-br from-white to-slate-50 rounded-xl border-2 border-slate-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                        {/* Corner Uplift Badge */}
                        {data.upliftFactor > 1.0 && (
                          <div className="absolute top-0 right-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md">
                            +10%
                          </div>
                        )}
                        
                        {/* Header */}
                        <div className="text-center mb-4 md:mb-6 relative z-10">
                          <h4 className="text-lg md:text-xl font-bold text-slate-900">{party}</h4>
                        </div>
                        
                        {/* Radial Gauge Chart */}
                        <div className="relative mb-4 md:mb-6" style={{ height: '160px', minHeight: '160px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                              cx="50%"
                              cy="50%"
                              innerRadius="65%"
                              outerRadius="95%"
                              barSize={24}
                              data={radialData}
                              startAngle={90}
                              endAngle={-270}
                            >
                              <RadialBar
                                dataKey="value"
                                cornerRadius={12}
                                fill="#8884d8"
                              >
                                {radialData.map((entry, idx) => (
                                  <Cell key={`cell-${idx}`} fill={entry.fill} />
                                ))}
                              </RadialBar>
                              <Tooltip
                                formatter={(value) => value.toFixed(0) + '%'}
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '2px solid #e2e8f0',
                                  borderRadius: '8px',
                                  padding: '10px',
                                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                }}
                              />
                            </RadialBarChart>
                          </ResponsiveContainer>
                          
                          {/* Center Label - Absolutely positioned */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-xl md:text-2xl font-bold bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">
                              {marginPercentage.toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wide">Margin</div>
                          </div>
                        </div>
                        
                        {/* Financial Breakdown */}
                        <div className="space-y-2 md:space-y-3 pt-3 md:pt-4 border-t-2 border-slate-200">
                          <div className="flex justify-between items-center py-1 gap-2">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex-shrink-0">Price</span>
                            <span className="text-xs md:text-sm font-semibold text-slate-700 text-right break-words">{formatGBP(price)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 gap-2">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex-shrink-0">Revenue</span>
                            <span className="text-xs md:text-sm font-bold text-slate-900 text-right break-words">{formatGBP(revenue)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 bg-slate-50 -mx-2 px-2 rounded gap-2">
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs font-medium text-slate-600">Cost</span>
                              <span className="text-xs text-slate-400 hidden sm:inline">(50% of Price)</span>
                            </div>
                            <span className="text-xs md:text-sm font-semibold text-slate-700 text-right break-words">{formatGBP(cost)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 md:pt-3 border-t-2 border-blue-200 bg-blue-50 -mx-2 px-2 py-2 rounded mt-2 gap-2">
                            <span className="text-xs md:text-sm font-bold text-blue-700 uppercase tracking-wide flex-shrink-0">Margin</span>
                            <span className="text-sm md:text-base font-bold text-blue-900 text-right break-words">{formatGBP(margin)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons - Bottom */}
        <div className="bg-white rounded-lg shadow mb-6 p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button
                onClick={saveProject}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
              >
                <FileJson className="w-4 h-4" />
                <span className="hidden sm:inline">Save Project</span>
                <span className="sm:hidden">Save</span>
              </button>
              <button
                onClick={() => setShowLibrary(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm md:text-base"
                aria-hidden="true"
                tabIndex="-1"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Project Library</span>
                <span className="sm:hidden">Library</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-3 md:px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm md:text-base"
              >
                <FileJson className="w-4 h-4" />
                <span className="hidden sm:inline">Export JSON</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button
                onClick={() => setShowReportSelector(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm md:text-base"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print Report</span>
                <span className="sm:hidden">Print</span>
              </button>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm md:text-base"
              >
                <span className="hidden sm:inline">Compare Projects</span>
                <span className="sm:hidden">Compare</span>
              </button>
            </div>
          </div>
        </div>

        {/* Project Comparison */}
        {showComparison && (
          <section className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Project Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Project</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Days</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">RPG Share</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Proaptus Share</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(projectLibrary).map(([key, project]) => {
                    const tempModel = calculateRedPegasusModel({
                      clientRate: project.clientRate,
                      soldDays: project.soldDays,
                      deliverables: project.deliverables,
                      accountManagerParty: project.accountManagerParty || 'RPG',
                      roleWeights: roleWeights
                    });
                    const rpgShare = tempModel.partyAllocations['RPG']?.percentage || 0;
                    const proaptusShare = tempModel.partyAllocations['Proaptus']?.percentage || 0;
                    return (
                      <tr key={key} className="border-b border-slate-100">
                        <td className="py-3 px-4 font-medium">{project.name}</td>
                        <td className="text-right py-3 px-4">{project.soldDays}</td>
                        <td className="text-right py-3 px-4">{formatGBP(tempModel.totalRevenue)}</td>
                        <td className="text-right py-3 px-4">{rpgShare.toFixed(1)}%</td>
                        <td className="text-right py-3 px-4">{proaptusShare.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Modals */}
        {showLibrary && (
          <ScenarioLibrary
            scenarios={Object.values(projectLibrary)}
            onLoad={loadProject}
            onDelete={deleteProject}
            onClose={() => setShowLibrary(false)}
            isProjectMode={true}
          />
        )}

        {showReportSelector && (
          <ReportVariantSelector
            onSelect={(variant) => {
              setReportVariant(variant);
              setShowReportSelector(false);
              // Handle report generation based on variant
              setTimeout(() => handlePrint(), 100);
            }}
            onClose={() => setShowReportSelector(false)}
          />
        )}
          </>
        )}

        {/* New Project Modal */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
            <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Create New Project</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const name = formData.get('projectName');
                  if (name && name.trim()) {
                    createNewProject(name.trim());
                  }
                }}
              >
                <div className="mb-4">
                  <label htmlFor="project-title" className="block text-sm font-medium text-slate-700 mb-2">
                    Project Title
                  </label>
                  <input
                    id="project-title"
                    name="projectName"
                    type="text"
                    required
                    autoFocus
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report for Printing - Hidden on screen, shown only in print */}
        <div ref={reportRef} className="print-only-report">
          {model && inputs ? (
            reportVariant === 'INTERNAL' ? (
              <RedPegasusInternalReport 
                model={model} 
                inputs={inputs} 
                formatGBP={formatGBP}
                projectName={projectName}
                projectDescription={projectDescription}
                projectBackground={projectBackground}
                clientName={clientName}
                overview={overview}
                startDate={startDate}
                endDate={endDate}
                projectCode={projectCode}
                accountManager={accountManager}
                accountManagerParty={accountManagerParty}
                status={status}
              />
            ) : (
              <RedPegasusQuoteReport 
                model={model} 
                inputs={inputs} 
                formatGBP={formatGBP}
                projectName={projectName}
                clientName={clientName}
                startDate={startDate}
                endDate={endDate}
                projectCode={projectCode}
                accountManager={accountManager}
              />
            )
          ) : (
            <div className="p-8 bg-white text-slate-700">
              Loading report...
            </div>
          )}
        </div>

        {/* Help Modal */}
        {activeHelpKey && helpContent[activeHelpKey] && (
          <HelpModal
            isOpen={activeHelpKey !== null}
            title={helpContent[activeHelpKey].title}
            content={helpContent[activeHelpKey].content}
            example={helpContent[activeHelpKey].example}
            onClose={() => setActiveHelpKey(null)}
          />
        )}
      </div>
    </div>
  );
};

export default RedPegasusPricingCalculator;
