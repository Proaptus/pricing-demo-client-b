import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileJson, Printer, LogOut, Settings, Package, ChevronDown, ChevronUp } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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

// Scenario Presets for Red Pegasus
const SCENARIO_PRESETS = {
  simple: {
    name: 'Simple Project',
    description: '20-day project, 2 parties, basic roles',
    clientRate: 800,
    soldDays: 20,
    deliverables: [
      { id: 1, name: 'Discovery & requirements', owner: 'RPG', role: 'Solution Architect', days: 3, acceptanceCriteria: 'Requirements documented and signed off' },
      { id: 2, name: 'Core development', owner: 'Proaptus', role: 'Development', days: 12, acceptanceCriteria: 'Features implemented and tested' },
      { id: 3, name: 'Testing & UAT', owner: 'Proaptus', role: 'QA', days: 3, acceptanceCriteria: 'All tests passing, UAT complete' },
      { id: 4, name: 'Project management', owner: 'RPG', role: 'Project Management', days: 2, acceptanceCriteria: 'Project delivered on time and budget' },
    ]
  },
  standard: {
    name: 'Standard Project (Simpson)',
    description: '45-day project, RPG + Proaptus split',
    clientRate: 950,
    soldDays: 45,
    deliverables: [
      { id: 1, name: 'Planning and Preparation', owner: 'RPG', role: 'Sales', days: 3, acceptanceCriteria: 'Agreement on scope and approach' },
      { id: 2, name: 'Commercial Support', owner: 'RPG', role: 'Sales', days: 5, acceptanceCriteria: 'Commercial alignment achieved' },
      { id: 3, name: 'Functional Fit Gap', owner: 'RPG', role: 'Solution Architect', days: 10, acceptanceCriteria: 'Fit/gap analysis completed' },
      { id: 4, name: 'Development', owner: 'Proaptus', role: 'Development', days: 15, acceptanceCriteria: 'System built to specification' },
      { id: 5, name: 'Testing & QA', owner: 'Proaptus', role: 'QA', days: 4, acceptanceCriteria: 'Quality standards met' },
      { id: 6, name: 'Junior Dev Support', owner: 'Proaptus', role: 'Junior', days: 3, acceptanceCriteria: 'Support tasks completed' },
      { id: 7, name: 'Project Management', owner: 'RPG', role: 'Project Management', days: 3, acceptanceCriteria: 'Project milestones achieved' },
      { id: 8, name: 'PM Support', owner: 'Proaptus', role: 'Project Management', days: 2, acceptanceCriteria: 'Administrative tasks complete' },
    ]
  },
  complex: {
    name: 'Complex Project',
    description: '90+ day project, multiple roles and phases',
    clientRate: 1100,
    soldDays: 111,
    deliverables: [
      { id: 1, name: 'Commercial leadership', owner: 'RPG', role: 'Sales', days: 8, acceptanceCriteria: 'Commercial strategy approved' },
      { id: 2, name: 'Solution architecture (Phase 1)', owner: 'RPG', role: 'Solution Architect', days: 10, acceptanceCriteria: 'Architecture design documented' },
      { id: 3, name: 'Technical architecture', owner: 'Proaptus', role: 'Solution Architect', days: 8, acceptanceCriteria: 'Technical blueprint approved' },
      { id: 4, name: 'Core platform development', owner: 'Proaptus', role: 'Development', days: 35, acceptanceCriteria: 'Platform functionality complete' },
      { id: 5, name: 'API integrations', owner: 'Proaptus', role: 'Development', days: 15, acceptanceCriteria: 'All APIs integrated and tested' },
      { id: 6, name: 'Junior developer support', owner: 'Proaptus', role: 'Junior', days: 10, acceptanceCriteria: 'Support tasks completed' },
      { id: 7, name: 'QA & test automation', owner: 'Proaptus', role: 'QA', days: 12, acceptanceCriteria: 'Test suite complete, all passing' },
      { id: 8, name: 'PM & governance (RPG)', owner: 'RPG', role: 'Project Management', days: 8, acceptanceCriteria: 'Project governed successfully' },
      { id: 9, name: 'PM & coordination (Proaptus)', owner: 'Proaptus', role: 'Project Management', days: 5, acceptanceCriteria: 'Teams coordinated effectively' },
    ]
  }
};

// Role weights for value-days calculation
const ROLE_WEIGHTS = {
  'Sales': 1.8,
  'Solution Architect': 1.4,
  'Project Management': 1.2,
  'Development': 1.0,
  'QA': 0.8,
  'Junior': 0.6
};

// Party color scheme
const PARTY_COLORS = {
  'RPG': '#3b82f6', // Blue
  'Proaptus': '#10b981', // Green
  'Other': '#6b7280' // Gray
};

/**
 * Calculate the Red Pegasus pricing model based on value-days
 */
function calculateRedPegasusModel(inputs) {
  const { clientRate, soldDays, deliverables, roleWeights } = inputs;

  // Calculate total revenue
  const totalRevenue = clientRate * soldDays;

  // Calculate value-days for each deliverable
  const deliverablesWithValueDays = deliverables.map(d => {
    const weight = roleWeights[d.role] || 1.0;
    const valueDays = d.days * weight;
    return { ...d, weight, valueDays };
  });

  // Calculate total value-days
  const totalValueDays = deliverablesWithValueDays.reduce((sum, d) => sum + d.valueDays, 0);

  // Calculate party allocations
  const partyAllocations = {};
  deliverablesWithValueDays.forEach(d => {
    if (!partyAllocations[d.owner]) {
      partyAllocations[d.owner] = { valueDays: 0, days: 0, deliverables: [] };
    }
    partyAllocations[d.owner].valueDays += d.valueDays;
    partyAllocations[d.owner].days += d.days;
    partyAllocations[d.owner].deliverables.push(d);
  });

  // Calculate revenue shares
  Object.keys(partyAllocations).forEach(party => {
    const allocation = partyAllocations[party];
    allocation.share = (allocation.valueDays / totalValueDays) * 100;
    allocation.revenue = (allocation.share / 100) * totalRevenue;
  });

  // Calculate blended rate
  const blendedRate = totalValueDays > 0 ? totalRevenue / totalValueDays : 0;

  // Prepare data for charts
  const partyChartData = Object.entries(partyAllocations).map(([party, data]) => ({
    name: party,
    value: data.revenue,
    percentage: data.share
  }));

  const roleChartData = Object.entries(roleWeights).map(([role, weight]) => {
    const roleDays = deliverablesWithValueDays
      .filter(d => d.role === role)
      .reduce((sum, d) => sum + d.valueDays, 0);
    return { role, valueDays: roleDays, weight };
  }).filter(r => r.valueDays > 0);

  return {
    // Inputs
    clientRate,
    soldDays,
    totalRevenue,

    // Calculations
    deliverables: deliverablesWithValueDays,
    totalValueDays,
    partyAllocations,
    blendedRate,

    // Chart data
    partyChartData,
    roleChartData,

    // For MarginAnalysis component
    rpg: partyAllocations['RPG'] || { valueDays: 0, share: 0, revenue: 0 },
    proaptus: partyAllocations['Proaptus'] || { valueDays: 0, share: 0, revenue: 0 },
    total: { valueDays: totalValueDays, revenue: totalRevenue }
  };
}

const RedPegasusPricingCalculator = ({ onLogout }) => {
  // State for inputs
  const [inputs, setInputs] = useState({
    clientRate: 950,
    soldDays: 45,
    deliverables: SCENARIO_PRESETS.standard.deliverables,
    roleWeights: ROLE_WEIGHTS
  });

  // State for UI
  const [selectedScenario, setSelectedScenario] = useState('standard');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showReportSelector, setShowReportSelector] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState([]);

  const reportRef = useRef();

  // Load saved scenarios from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('redPegasusScenarios');
    if (saved) {
      setSavedScenarios(JSON.parse(saved));
    }
  }, []);

  // Calculate the model
  const model = useMemo(() => calculateRedPegasusModel(inputs), [inputs]);

  // Validation
  const validation = useMemo(() => validateInputs(inputs, inputs.deliverables, inputs.roleWeights), [inputs]);
  const warnings = useMemo(() => getValidationWarnings(inputs, model, inputs.deliverables), [inputs, model]);

  // Scenario selection
  const selectScenario = (scenarioKey) => {
    const scenario = SCENARIO_PRESETS[scenarioKey];
    setInputs({
      clientRate: scenario.clientRate,
      soldDays: scenario.soldDays,
      deliverables: scenario.deliverables,
      roleWeights: ROLE_WEIGHTS
    });
    setSelectedScenario(scenarioKey);
  };

  // Export data
  const exportData = () => {
    const exportPayload = {
      timestamp: new Date().toISOString(),
      scenario: selectedScenario,
      inputs,
      model,
      validation
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `red_pegasus_${selectedScenario}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print handler
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
  });

  // Save scenario
  const saveScenario = (name, description) => {
    const newScenario = {
      id: Date.now(),
      name,
      description,
      timestamp: new Date().toISOString(),
      inputs,
      model
    };
    const updated = [...savedScenarios, newScenario];
    setSavedScenarios(updated);
    localStorage.setItem('redPegasusScenarios', JSON.stringify(updated));
    setShowSaveModal(false);
  };

  // Load scenario
  const loadScenario = (scenario) => {
    setInputs(scenario.inputs);
    setShowLibrary(false);
  };

  // Delete scenario
  const deleteScenario = (id) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem('redPegasusScenarios', JSON.stringify(updated));
  };

  // Add deliverable
  const addDeliverable = () => {
    const newDeliverable = {
      id: Date.now(),
      name: 'New Deliverable',
      owner: 'RPG',
      role: 'Development',
      days: 5,
      acceptanceCriteria: ''
    };
    setInputs(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, newDeliverable]
    }));
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

        {/* Scenario Selector */}
        <section className="bg-white rounded-lg shadow p-6 mb-6" data-component="scenario-selector">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Scenario Presets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(SCENARIO_PRESETS).map(([key, scenario]) => (
              <button
                key={key}
                onClick={() => selectScenario(key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedScenario === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <h3 className="font-semibold text-slate-900">{scenario.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{scenario.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Project Configuration */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Project Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </section>

        {/* Role Weights */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Role Weights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(inputs.roleWeights).map(([role, weight]) => (
              <div key={role}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {role}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setInputs(prev => ({
                    ...prev,
                    roleWeights: { ...prev.roleWeights, [role]: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-600 mt-1">
                  Effective rate: <span className="font-semibold text-slate-900">{formatGBP(inputs.clientRate * weight)}/day</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Deliverables */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Project Deliverables
            </h2>
            <button
              onClick={addDeliverable}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Deliverable
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Deliverable</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Owner</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Role</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Days</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Value-Days</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Revenue</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {model.deliverables.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={d.name}
                        onChange={(e) => updateDeliverable(d.id, 'name', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={d.owner}
                        onChange={(e) => updateDeliverable(d.id, 'owner', e.target.value)}
                        className={`w-full px-2 py-1 border rounded ${
                          d.owner === 'RPG' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <option value="RPG">RPG</option>
                        <option value="Proaptus">Proaptus</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={d.role}
                        onChange={(e) => updateDeliverable(d.id, 'role', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-200 rounded"
                      >
                        {Object.keys(inputs.roleWeights).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-right py-3 px-4">
                      <input
                        type="number"
                        value={d.days}
                        onChange={(e) => updateDeliverable(d.id, 'days', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-right"
                      />
                    </td>
                    <td className="text-right py-3 px-4 font-semibold">
                      {d.valueDays.toFixed(1)}
                    </td>
                    <td className="text-right py-3 px-4 font-semibold">
                      {formatGBP((d.valueDays / model.totalValueDays) * model.totalRevenue)}
                    </td>
                    <td className="text-center py-3 px-4">
                      <button
                        onClick={() => deleteDeliverable(d.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td colSpan="3" className="py-3 px-4">Total</td>
                  <td className="text-right py-3 px-4">{inputs.soldDays}</td>
                  <td className="text-right py-3 px-4">{model.totalValueDays.toFixed(1)}</td>
                  <td className="text-right py-3 px-4">{formatGBP(model.totalRevenue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Margin Analysis */}
        <MarginAnalysis model={model} formatGBP={formatGBP} />

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Party Allocation Pie Chart */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Party Revenue Allocation</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={model.partyChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {model.partyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PARTY_COLORS[entry.name] || PARTY_COLORS.Other} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatGBP(value)} />
              </PieChart>
            </ResponsiveContainer>
          </section>

          {/* Role Distribution Bar Chart */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Value-Days by Role</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={model.roleChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => value.toFixed(1)} />
                <Bar dataKey="valueDays" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>

        {/* Competitive Benchmarking */}
        <section className="bg-white rounded-lg shadow p-6 mb-6" data-component="benchmarking">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Competitive Benchmarking</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Fixed Price Model</h3>
              <p className="text-2xl font-bold text-blue-900">{formatGBP(model.totalRevenue)}</p>
              <p className="text-sm text-blue-700">Value-days based allocation</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Time & Materials</h3>
              <p className="text-2xl font-bold text-green-900">{formatGBP(inputs.clientRate * inputs.soldDays)}</p>
              <p className="text-sm text-green-700">Straight daily rate</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">50/50 Split</h3>
              <p className="text-2xl font-bold text-purple-900">{formatGBP(model.totalRevenue / 2)}</p>
              <p className="text-sm text-purple-700">Equal revenue share</p>
            </div>
          </div>
        </section>

        {/* Cost Driver Analysis */}
        <section className="bg-white rounded-lg shadow p-6 mb-6" data-component="cost-driver-analysis">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Cost Driver Analysis</h2>
          <div className="space-y-4">
            {Object.entries(model.partyAllocations).map(([party, data]) => (
              <div key={party}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-slate-700">{party}</h3>
                  <span className="text-slate-600">{data.share.toFixed(1)}% of revenue</span>
                </div>
                <div className="bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full ${party === 'RPG' ? 'bg-blue-500' : 'bg-green-500'}`}
                    style={{ width: `${data.share}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {data.valueDays.toFixed(1)} value-days • {data.days} calendar days • {formatGBP(data.revenue)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileJson className="w-5 h-5" />
            Export JSON
          </button>
          <button
            onClick={() => setShowReportSelector(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print Report
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Save Scenario
          </button>
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Scenario Library
          </button>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Compare Scenarios
          </button>
        </div>

        {/* Scenario Comparison */}
        {showComparison && (
          <section className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Scenario Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Scenario</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Days</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">RPG Share</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Proaptus Share</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(SCENARIO_PRESETS).map(([key, scenario]) => {
                    const tempModel = calculateRedPegasusModel({
                      ...scenario,
                      roleWeights: ROLE_WEIGHTS
                    });
                    return (
                      <tr key={key} className="border-b border-slate-100">
                        <td className="py-3 px-4 font-medium">{scenario.name}</td>
                        <td className="text-right py-3 px-4">{scenario.soldDays}</td>
                        <td className="text-right py-3 px-4">{formatGBP(tempModel.totalRevenue)}</td>
                        <td className="text-right py-3 px-4">{tempModel.rpg.share.toFixed(1)}%</td>
                        <td className="text-right py-3 px-4">{tempModel.proaptus.share.toFixed(1)}%</td>
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
            onSave={saveScenario}
            onClose={() => setShowSaveModal(false)}
          />
        )}

        {showLibrary && (
          <ScenarioLibrary
            scenarios={savedScenarios}
            onLoad={loadScenario}
            onDelete={deleteScenario}
            onClose={() => setShowLibrary(false)}
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
            scenario={selectedScenario}
            formatGBP={formatGBP}
          />
        </div>
      </div>
    </div>
  );
};

export default RedPegasusPricingCalculator;