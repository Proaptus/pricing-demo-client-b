import React from 'react';

/**
 * KeyAssumptions Component
 *
 * Displays primary input fields for the pricing model:
 * - Total Sites
 * - Min-Max Docs/Site
 * - Review Minutes/Doc
 *
 * @param {Object} props
 * @param {Object} props.inputs - Current input values
 * @param {Function} props.setInputs - Function to update input values
 * @param {Object} props.validation - Validation status object with isValid and errors
 * @param {boolean} props.showAdvanced - Whether advanced section is expanded
 * @param {Function} props.setShowAdvanced - Function to toggle advanced section
 */
const KeyAssumptions = ({ inputs, setInputs, validation, showAdvanced, setShowAdvanced }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Key Assumptions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Total Sites</label>
          <input
            type="number"
            value={inputs.nSites}
            onChange={(e) => setInputs(prev => ({ ...prev, nSites: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Min-Max Docs/Site</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={inputs.minDocs}
              onChange={(e) => setInputs(prev => ({ ...prev, minDocs: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
            />
            <input
              type="number"
              value={inputs.maxDocs}
              onChange={(e) => setInputs(prev => ({ ...prev, maxDocs: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Review Minutes/Doc</label>
          <input
            type="number"
            value={inputs.reviewMinutes}
            onChange={(e) => setInputs(prev => ({ ...prev, reviewMinutes: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showAdvanced ? '− Hide' : '+ Show'} Advanced Assumptions
        </button>
      </div>
    </div>
  );
};

export default KeyAssumptions;
