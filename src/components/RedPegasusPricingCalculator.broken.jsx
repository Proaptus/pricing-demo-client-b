import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileJson, Printer, LogOut, Package } from 'lucide-react';

// Shared utilities
import formatGBP from './pricing/shared/formatGBP';
import ValidationAlert from './pricing/shared/ValidationAlert';
import { validateInputs, getValidationWarnings } from './pricing/shared/validation';

// Analysis components
import MarginAnalysis from './pricing/MarginAnalysis';
import SaveScenarioModal from './pricing/SaveScenarioModal';
import ScenarioLibrary from './pricing/ScenarioLibrary';
import ProfessionalReport from './pricing/ProfessionalReport';
import ReportVariantSelector from './pricing/ReportVariantSelector';

/**
 * Red Pegasus Pricing Calculator
 *
 * A deliverables-based pricing model that allocates revenue based on value-days:
 * - Each deliverable has: name, owner (party), role, days, acceptance criteria
 * - Value-days = days × role weight
 * - Revenue is allocated proportionally by value-days
 * - Parties (RPG, Proaptus, etc.) receive their share based on total value-days
 *
 * Based on Cornerstone architecture but with different calculation model
 */

// Role weights (multipliers for day rates)
const ROLE_WEIGHTS = {
  'Solution Architect': 1.2,
  'Project Management': 1.1,
  'Development': 1.0,
  'QA': 0.95,
  'Junior': 0.85
};

// Default starting project (Simpson Travel KB)
const DEFAULT_PROJECT = {
  id: 'simpson-travel-kb',
  lastModified: new Date().toISOString(),
    name: 'Simpson Travel KB',
    description: 'AI Knowledge Base for Simpson Travel',
    // Project Information Fields
    clientName: 'Simpson Travel',
    overview: 'AI-powered knowledge base with HubSpot integration, semantic search, and LLM-powered query responses',
    startDate: '2025-01-15',
    endDate: '2025-03-31',
    projectCode: 'ST-KB-2025-Q1',
    accountManager: 'Colin (RPG)',
    accountManagerParty: 'RPG', // Party that manages the account (gets 10% uplift)
    status: 'Active',
    clientRate: 950,
    soldDays: 45,
    // Deliverables with roles for day rate calculation
    deliverables: [
      // Proaptus Development
      { id: 1, name: 'Architecture & System Design', owner: 'Proaptus', role: 'Solution Architect', days: 2.0, acceptanceCriteria: 'System architecture documented with Azure, API boundaries, security model defined' },
      { id: 3, name: 'OneNote (Microsoft Graph) Integration', owner: 'Proaptus', role: 'Development', days: 2.0, acceptanceCriteria: 'OAuth app registered, Graph API integration functional with delta sync' },
      { id: 4, name: 'Website Content Extraction', owner: 'Proaptus', role: 'Development', days: 2.0, acceptanceCriteria: 'API-based ingestion built, auth/rate limits handled, HTML→text conversion working' },
      { id: 5, name: 'Content Processing Pipeline', owner: 'Proaptus', role: 'Development', days: 2.0, acceptanceCriteria: 'Parsing, chunking, metadata enrichment, inconsistency detection implemented' },
      { id: 6, name: 'Search Infrastructure', owner: 'Proaptus', role: 'Development', days: 1.5, acceptanceCriteria: 'Hybrid search (BM25 + vector) configured with semantic search enabled' },
      { id: 7, name: 'Query Processing Engine', owner: 'Proaptus', role: 'Development', days: 2.0, acceptanceCriteria: 'Stage-1 LLM: intent detection, retrieval plan, query rewriting functional' },
      { id: 8, name: 'LLM Integration', owner: 'Proaptus', role: 'Development', days: 2.0, acceptanceCriteria: 'Stage-2 LLM: answer synthesis with guardrails and prompt injection defenses' },
      { id: 9, name: 'Citation System', owner: 'Proaptus', role: 'Development', days: 1.0, acceptanceCriteria: 'Verifiable citations implemented with client-specific templates' },
      { id: 10, name: 'API Development', owner: 'Proaptus', role: 'Development', days: 1.5, acceptanceCriteria: 'REST API with auth, rate limiting, health checks, ingestion endpoints ready' },
      { id: 14, name: 'Performance Optimization', owner: 'Proaptus', role: 'Development', days: 1.0, acceptanceCriteria: 'Query response times <2s p50, search parameters tuned, caching optimized' },
      { id: 15, name: 'Technical Documentation', owner: 'Proaptus', role: 'Development', days: 1.0, acceptanceCriteria: 'Technical docs, runbooks, API documentation, ops quick-start guide complete' },
      { id: 12, name: 'HubSpot UI Development', owner: 'Proaptus', role: 'Development', days: 3.0, acceptanceCriteria: 'Native HubSpot UI built with HS components, response times <15s' },
      { id: 2, name: 'Azure Infrastructure Setup', owner: 'Proaptus', role: 'Development', days: 0.5, acceptanceCriteria: 'Azure resources configured' },
      { id: 100, name: 'HubSpot UI Phase-1', owner: 'Proaptus', role: 'Development', days: 0.25, acceptanceCriteria: 'Iframe embed coordination' },
      { id: 101, name: 'Integration Testing', owner: 'Proaptus', role: 'QA', days: 2.0, acceptanceCriteria: 'Test automation and QA complete' },
      { id: 102, name: 'Security Hardening', owner: 'Proaptus', role: 'Development', days: 1.0, acceptanceCriteria: 'Security implementation and testing' },
      { id: 103, name: 'Monitoring & Alerting', owner: 'Proaptus', role: 'Development', days: 0.75, acceptanceCriteria: 'Monitoring setup complete' },
      { id: 104, name: 'Knowledge Transfer & Handover', owner: 'Proaptus', role: 'Development', days: 0.75, acceptanceCriteria: 'Technical handover and documentation' },

      // RPG Management & Solutions (NO SALES - just Solution Architect and PM)
      { id: 17, name: 'Solution Architecture & Discovery', owner: 'RPG', role: 'Solution Architect', days: 5.0, acceptanceCriteria: 'Solution design documented and approved by client' },
      { id: 18, name: 'Project Management', owner: 'RPG', role: 'Project Management', days: 7.5, acceptanceCriteria: 'Project milestones tracked, status reports delivered weekly' },
      { id: 105, name: 'Client Enablement Workshop', owner: 'RPG', role: 'Solution Architect', days: 0.5, acceptanceCriteria: 'Client team trained on workflows, documentation, and enablement assets handed over' },
    ]
};

// Removed localStorage - using Express API instead

// API base URL
const API_URL = 'http://localhost:3557/api';

// API functions
const api = {
  async loadProjects() {
    try {
      const response = await fetch(`${API_URL}/projects`);
      if (!response.ok) throw new Error('Failed to load projects');
      return await response.json();
    } catch (error) {
      console.error('Error loading projects:', error);
      return { [DEFAULT_PROJECT.id]: DEFAULT_PROJECT };
    }
  },

  async saveProject(id, project) {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (!response.ok) throw new Error('Failed to save project');
      return await response.json();
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  },

  async saveAllProjects(projects) {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projects)
      });
      if (!response.ok) throw new Error('Failed to save projects');
      return await response.json();
    } catch (error) {
      console.error('Error saving projects:', error);
      throw error;
    }
  }
};

/**
 * Calculate the Red Pegasus pricing model with role-weighted day rates
 *
 * Model: Revenue allocation based on deliverable days × role weights
 * - Each role has a weight that multiplies the base day rate
 * - Account manager party gets 10% uplift on their final share
 * - Formula: deliverable_revenue = days × (base_rate × role_weight)
 */
function calculateRedPegasusModel(inputs) {
  const { clientRate, soldDays, deliverables, accountManagerParty, roleWeights = ROLE_WEIGHTS } = inputs;

  // Calculate total revenue
  const totalRevenue = clientRate * soldDays;

  // Calculate revenue for each deliverable based on role weights
  const deliverablesWithRevenue = deliverables.map(d => {
    const days = d.days || 0;
    const roleWeight = roleWeights[d.role] || 1.0;
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
    roleData[role] = { days: 0, revenue: 0, weight: roleWeights[role] };
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
  // Load current project and library from API
  const [currentProject, setCurrentProject] = useState(DEFAULT_PROJECT);
  const [projectLibrary, setProjectLibrary] = useState({ [DEFAULT_PROJECT.id]: DEFAULT_PROJECT });
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // State for inputs (initialized from current project)
  const [inputs, setInputs] = useState({
    clientRate: currentProject.clientRate,
    soldDays: currentProject.soldDays,
    deliverables: currentProject.deliverables,
    accountManagerParty: currentProject.accountManagerParty,
    roleWeights: ROLE_WEIGHTS
  });

  // State for project metadata
  const [projectName, setProjectName] = useState(currentProject.name);
  const [projectDescription, setProjectDescription] = useState(currentProject.description || '');
  const [projectBackground, setProjectBackground] = useState(currentProject.background || '');
  const [clientName, setClientName] = useState(currentProject.clientName || '');
  const [overview, setOverview] = useState(currentProject.overview || '');
  const [startDate, setStartDate] = useState(currentProject.startDate || '');
  const [endDate, setEndDate] = useState(currentProject.endDate || '');
  const [projectCode, setProjectCode] = useState(currentProject.projectCode || '');
  const [accountManager, setAccountManager] = useState(currentProject.accountManager || '');
  const [accountManagerParty, setAccountManagerParty] = useState(currentProject.accountManagerParty || 'RPG');
  const [status, setStatus] = useState(currentProject.status || 'Active');

  // State for UI
  const [selectedProject, setSelectedProject] = useState('simpsonTravelKB');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [showProjectBackground, setShowProjectBackground] = useState(true);
  const [editingAcceptanceId, setEditingAcceptanceId] = useState(null);

  const reportRef = useRef();

  // Load projects from API on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const projects = await api.loadProjects();
      setProjectLibrary(projects);

      // Load the Simpson Travel KB project as default
      const defaultProj = projects[DEFAULT_PROJECT.id] || DEFAULT_PROJECT;
      setCurrentProject(defaultProj);

      // Initialize all state from loaded project
      setProjectName(defaultProj.name);
      setProjectDescription(defaultProj.description || '');
      setProjectBackground(defaultProj.background || '');
      setClientName(defaultProj.clientName || '');
      setOverview(defaultProj.overview || '');
      setStartDate(defaultProj.startDate || '');
      setEndDate(defaultProj.endDate || '');
      setProjectCode(defaultProj.projectCode || '');
      setAccountManager(defaultProj.accountManager || '');
      setAccountManagerParty(defaultProj.accountManagerParty || 'RPG');
      setStatus(defaultProj.status || 'Active');
      setInputs({
        clientRate: defaultProj.clientRate,
        soldDays: defaultProj.soldDays,
        deliverables: defaultProj.deliverables,
        accountManagerParty: defaultProj.accountManagerParty,
        roleWeights: ROLE_WEIGHTS
      });

      setIsLoading(false);
    };
    loadData();
  }, []);

  // Autosave effect - saves current project whenever it changes
  useEffect(() => {
    if (!autosaveEnabled || isLoading) return;

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

    // Debounce the save to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      try {
        await api.saveProject(projectData.id, projectData);
        console.log('✅ Project autosaved:', projectData.id);
      } catch (error) {
        console.error('❌ Autosave failed:', error);
      }
    }, 1000); // Wait 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [
    autosaveEnabled,
    isLoading,
    currentProject.id,
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

  // Calculate the model
  const model = useMemo(() => calculateRedPegasusModel(inputs), [inputs]);

  // Validation
  const validation = useMemo(() => validateInputs(inputs, inputs.deliverables), [inputs]);
  const warnings = useMemo(() => getValidationWarnings(inputs, model.partyAllocations || {}, inputs.deliverables), [inputs, model]);

  // Project selection
  const selectProject = (projectKey) => {
    const project = PROJECT_PRESETS[projectKey];
    setInputs({
      clientRate: project.clientRate,
      soldDays: project.soldDays,
      deliverables: project.deliverables,
      accountManagerParty: project.accountManagerParty || 'RPG',
      partyHours: project.partyHours || {}
    });
    setProjectName(project.name);
    setProjectDescription(project.description);
    setProjectBackground(project.background || '');
    // Set project information fields
    setClientName(project.clientName || '');
    setOverview(project.overview || '');
    setStartDate(project.startDate || '');
    setEndDate(project.endDate || '');
    setProjectCode(project.projectCode || '');
    setAccountManager(project.accountManager || '');
    setAccountManagerParty(project.accountManagerParty || 'RPG');
    setStatus(project.status || 'Active');
    setSelectedProject(projectKey);
    setEditingAcceptanceId(null);
  };

  // Export data
  const exportData = () => {
    const exportPayload = {
      timestamp: new Date().toISOString(),
      project: selectedProject,
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
    content: () => reportRef.current,
  });

  // Save project
  const saveProject = (name, description, background) => {
    const newProject = {
      id: Date.now(),
      name: name || projectName,
      description: description || projectDescription,
      background: background || projectBackground,
      timestamp: new Date().toISOString(),
      inputs,
      model
    };
    const updated = [...savedProjects, newProject];
    setSavedProjects(updated);
    localStorage.setItem('redPegasusProjects', JSON.stringify(updated));
    setShowSaveModal(false);
  };

  // Load project
  const loadProject = (project) => {
    setInputs(project.inputs);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setProjectBackground(project.background || '');
    setShowLibrary(false);
    setEditingAcceptanceId(null);
  };

  // Delete project
  const deleteProject = (id) => {
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('redPegasusProjects', JSON.stringify(updated));
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
  const jointAllocation = model.partyAllocations['Joint'] || { finalRevenue: 0, percentage: 0 };
  const clientRateValue = inputs.clientRate || 0;
  const formattedClientDayRate = formatGBP(
    clientRateValue,
    Number.isInteger(clientRateValue) ? 0 : 2
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Red Pegasus Pricing Calculator
              </h1>
              <p className="text-slate-600">
                Revenue Allocation Based on Value-Days
              </p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </header>

        {/* Validation Alert */}
        <ValidationAlert
          validation={validation}
          warnings={warnings}
        />

        {/* Action Buttons - Top */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FileJson className="w-4 h-4" />
                Save Project
              </button>
              <button
                onClick={() => setShowLibrary(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
              >
                <Package className="w-4 h-4" />
                Project Library
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                <FileJson className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={() => setShowReportSelector(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button>
            </div>
          </div>
        </div>

        {/* Project Selector */}
        <section className="bg-white rounded-lg shadow p-6 mb-6" data-component="project-selector">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Project Presets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(PROJECT_PRESETS).map(([key, project]) => (
              <button
                key={key}
                onClick={() => selectProject(key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedProject === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <h3 className="font-semibold text-slate-900">{project.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{project.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Project Information */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Project Information</h2>

          <div className="space-y-4">
            {/* Row 1: Title & Client */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Title</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Simpson Travel KB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., ST-KB-2025-Q1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Manager</label>
                <input
                  type="text"
                  value={accountManager}
                  onChange={(e) => setAccountManager(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Colin (RPG)"
                />
              </div>
            </div>

            {/* Row 5: Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Planning">Planning</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-500 text-xs font-medium">Total Value</p>
                  <p className="text-slate-900 font-semibold text-lg">{formatGBP(model.totalRevenue)}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-500 text-xs font-medium">Allocated Days</p>
                  <p className="text-slate-900 font-semibold text-lg">{inputs.soldDays} days</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-500 text-xs font-medium">Deliverables</p>
                  <p className="text-slate-900 font-semibold text-lg">{inputs.deliverables.length}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Project Configuration */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Project Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Client Day Rate (£)
              </label>
              <input
                type="number"
                value={inputs.clientRate}
                onChange={(e) => setInputs(prev => ({ ...prev, clientRate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Sold Days
              </label>
              <input
                type="number"
                value={inputs.soldDays}
                onChange={(e) => setInputs(prev => ({ ...prev, soldDays: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Manager Party
              </label>
              <select
                value={inputs.accountManagerParty}
                onChange={(e) => {
                  const value = e.target.value;
                  setAccountManagerParty(value);
                  setInputs(prev => ({ ...prev, accountManagerParty: value }));
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="RPG">RPG</option>
                <option value="Proaptus">Proaptus</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Selected party receives a 10% revenue uplift for account management.
              </p>
            </div>
          </div>
        </section>

        {/* Role Weights Configuration */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Role Weights (Day Rate Multipliers)</h2>
          <p className="text-sm text-slate-600 mb-4">
            Adjust the multipliers for each role. These are applied to the base client day rate of {formatGBP(inputs.clientRate)} to calculate effective day rates.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(inputs.roleWeights).map(([role, weight]) => (
              <div key={role}>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {role}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setInputs(prev => ({
                      ...prev,
                      roleWeights: {
                        ...prev.roleWeights,
                        [role]: parseFloat(e.target.value) || 1.0
                      }
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
        </section>

        {/* Deliverables */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Deliverables & Revenue Overview
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 font-medium mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">{formatGBP(model.totalRevenue)}</p>
              <p className="text-xs text-slate-500 mt-2">
                {inputs.soldDays} days sold @ {formattedClientDayRate} per day
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-xs text-slate-600 font-medium mb-1">RPG Allocation</p>
              <p className="text-2xl font-bold text-blue-900">{formatGBP(rpgAllocation.finalRevenue || 0)}</p>
              <p className="text-xs text-blue-600 mt-2">
                {(Number.isFinite(rpgAllocation.percentage) ? rpgAllocation.percentage : 0).toFixed(1)}% of revenue
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-slate-600 font-medium mb-1">Proaptus Allocation</p>
              <p className="text-2xl font-bold text-green-900">{formatGBP(proaptusAllocation.finalRevenue || 0)}</p>
              <p className="text-xs text-green-600 mt-2">
                {(Number.isFinite(proaptusAllocation.percentage) ? proaptusAllocation.percentage : 0).toFixed(1)}% of revenue
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-xs text-slate-600 font-medium mb-1">Joint Allocation</p>
              <p className="text-2xl font-bold text-purple-900">{formatGBP(jointAllocation.finalRevenue || 0)}</p>
              <p className="text-xs text-purple-600 mt-2">
                {(Number.isFinite(jointAllocation.percentage) ? jointAllocation.percentage : 0).toFixed(1)}% of revenue
              </p>
            </div>
          </div>

          {['RPG', 'Proaptus'].map((party) => {
            const partyDeliverables = inputs.deliverables.filter(d => d.owner === party);
            const partyColor = party === 'RPG' ? 'blue' : 'green';
            const partyDaysTotal = partyDeliverables.reduce((sum, d) => sum + (d.days || 0), 0);
            const partyRevenue = model.partyAllocations[party]?.revenue || 0;
            const partyPercentage = Number.isFinite(model.partyAllocations[party]?.percentage)
              ? model.partyAllocations[party].percentage
              : 0;

            return (
              <div key={party} className="mb-8">
                <div className={`border-l-4 border-${partyColor}-500 bg-${partyColor}-50 p-4 rounded mb-3 flex flex-wrap justify-between gap-3 items-start`}>
                  <div>
                    <h3 className={`font-semibold text-${partyColor}-900`}>{party} ({partyDaysTotal.toFixed(1)} days)</h3>
                    <p className={`text-sm text-${partyColor}-700`}>
                      {partyDeliverables.length} deliverables • {formatGBP(partyRevenue)} ({partyPercentage.toFixed(1)}% of revenue)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const maxId = Math.max(...inputs.deliverables.map(d => d.id || 0), 0);
                      setEditingAcceptanceId(null);
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
                    className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    + Add
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-2 px-3 font-semibold text-slate-700">Deliverable Name</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700">Role</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-700">Days</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-700">Day Rate</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-700">Total Cost</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700">Owner</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-700">Acceptance Criteria</th>
                        <th className="text-center py-2 px-3 font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partyDeliverables.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-4 px-3 text-center text-slate-500">
                            No deliverables assigned to {party}. Use the add button to create one.
                          </td>
                        </tr>
                      ) : (
                        partyDeliverables.map((d) => {
                          const deliverableDays = Number.isFinite(d.days) ? d.days : 0;
                          const roleWeight = inputs.roleWeights[d.role] || 1.0;
                          const effectiveDayRate = inputs.clientRate * roleWeight;
                          const totalCost = deliverableDays * effectiveDayRate;
                          const isEditing = editingAcceptanceId === d.id;

                          return (
                            <tr key={d.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={d.name}
                                  onChange={(e) => updateDeliverable(d.id, 'name', e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={d.role || 'Development'}
                                  onChange={(e) => updateDeliverable(d.id, 'role', e.target.value)}
                                  className="w-full px-2 py-1 border border-slate-300 rounded text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  {Object.keys(inputs.roleWeights).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="text-right py-2 px-3">
                                <input
                                  type="number"
                                  value={d.days}
                                  onChange={(e) => updateDeliverable(d.id, 'days', parseFloat(e.target.value) || 0)}
                                  step="0.25"
                                  min="0"
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-slate-900 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="text-right py-2 px-3 text-slate-700">
                                {formatGBP(effectiveDayRate)}
                              </td>
                              <td className="text-right py-2 px-3 text-slate-700">
                                {formatGBP(totalCost)}
                              </td>
                              <td className="py-2 px-3 text-slate-700">
                                {party}
                              </td>
                              <td className="py-2 px-3">
                                <div className="space-y-2">
                                  <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 whitespace-pre-line">
                                    {d.acceptanceCriteria || 'No acceptance criteria provided.'}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setEditingAcceptanceId(prev => prev === d.id ? null : d.id)}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                  >
                                    {isEditing ? 'Hide editor' : 'Edit'}
                                  </button>
                                  {isEditing && (
                                    <textarea
                                      value={d.acceptanceCriteria}
                                      onChange={(e) => updateDeliverable(d.id, 'acceptanceCriteria', e.target.value)}
                                      rows={3}
                                      className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Update acceptance criteria"
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="text-center py-2 px-3">
                                <button
                                  onClick={() => {
                                    setEditingAcceptanceId(prev => (prev === d.id ? null : prev));
                                    deleteDeliverable(d.id);
                                  }}
                                  className="px-2 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors text-xs font-semibold"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

        </section>

        {/* Margin Analysis (if needed for internal reporting) - can be toggled */}
        {false && <MarginAnalysis model={model} formatGBP={formatGBP} />}

        {/* Profit Split Analysis */}
        <section className="bg-white rounded-lg shadow p-6 mb-6" data-component="profit-split-analysis">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Profit Split Analysis</h2>
          <p className="text-sm text-slate-600 mb-4">
            Revenue allocation based on internal weighting with {inputs.accountManagerParty} receiving a 10% uplift for account management responsibilities.
          </p>
          <div className="space-y-4">
            {Object.entries(model.partyAllocations).filter(([_, data]) => data.revenue > 0).map(([party, data]) => (
              <div key={party}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-slate-700">{party}</h3>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">{formatGBP(data.revenue)}</span>
                    <span className="text-slate-600 ml-2">
                      {Number.isFinite(data.percentage) ? data.percentage.toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
                <div className="bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full ${party === 'RPG' ? 'bg-blue-500' : party === 'Proaptus' ? 'bg-green-500' : 'bg-purple-500'}`}
                    style={{ width: `${Math.min(Number.isFinite(data.percentage) ? data.percentage : 0, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action Buttons - Bottom */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FileJson className="w-4 h-4" />
                Save Project
              </button>
              <button
                onClick={() => setShowLibrary(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
              >
                <Package className="w-4 h-4" />
                Project Library
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                <FileJson className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={() => setShowReportSelector(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Compare Projects
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
                  {Object.entries(PROJECT_PRESETS).map(([key, project]) => {
                    const tempModel = calculateRedPegasusModel({
                      clientRate: project.clientRate,
                      soldDays: project.soldDays,
                      deliverables: project.deliverables,
                      accountManagerParty: project.accountManagerParty || 'RPG',
                      partyHours: project.partyHours || {}
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
        {showSaveModal && (
          <SaveScenarioModal
            onSave={saveProject}
            onClose={() => setShowSaveModal(false)}
            currentName={projectName}
            currentDescription={projectDescription}
            currentBackground={projectBackground}
          />
        )}

        {showLibrary && (
          <ScenarioLibrary
            scenarios={savedProjects}
            onLoad={loadProject}
            onDelete={deleteProject}
            onClose={() => setShowLibrary(false)}
            isProjectMode={true}
          />
        )}

        {showReportSelector && (
          <ReportVariantSelector
            onSelect={(variant) => {
              setShowReportSelector(false);
              // Handle report generation based on variant
              handlePrint();
            }}
            onClose={() => setShowReportSelector(false)}
          />
        )}

        {/* Hidden Professional Report for Printing */}
        <div style={{ display: 'none' }}>
          <ProfessionalReport
            ref={reportRef}
            model={model}
            inputs={inputs}
            scenario={selectedProject}
            formatGBP={formatGBP}
          />
        </div>
      </div>
    </div>
  );
};

export default RedPegasusPricingCalculator;
