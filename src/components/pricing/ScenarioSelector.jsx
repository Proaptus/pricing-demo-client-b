import React from 'react';

/**
 * ScenarioSelector Component
 *
 * Displays three scenario buttons (Conservative, Standard, Aggressive) for pricing strategy selection
 * and a toggle for scenario comparison view.
 *
 * @param {Object} props
 * @param {string} props.scenario - Currently selected scenario key
 * @param {Function} props.setScenario - Function to update selected scenario
 * @param {Object} props.SCENARIO_CONFIGS - Scenario configuration object
 * @param {boolean} props.showComparison - Whether comparison view is shown
 * @param {Function} props.setShowComparison - Function to toggle comparison view
 */
const ScenarioSelector = ({ scenario, setScenario, SCENARIO_CONFIGS, showComparison, setShowComparison }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Select Pricing Scenario</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {Object.entries(SCENARIO_CONFIGS).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setScenario(key)}
            className={`p-4 rounded-lg border-2 transition ${
              scenario === key
                ? 'border-blue-600 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="font-bold text-lg mb-1">{cfg.name}</div>
            <div className="text-sm text-slate-600">{cfg.description}</div>
            <div className="mt-2 text-xs space-y-1">
              <div>
                <span className="font-semibold">Labor Margin:</span> {(cfg.laborMargin * 100).toFixed(0)}%
              </div>
              <div>
                <span className="font-semibold">Pass-through Margin:</span> {(cfg.passthroughMargin * 100).toFixed(0)}%
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowComparison(!showComparison)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {showComparison ? '− Hide' : '+ Show'} Scenario Comparison
      </button>
    </div>
  );
};

export default ScenarioSelector;
