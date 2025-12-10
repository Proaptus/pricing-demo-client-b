import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * ScenarioComparison Component
 *
 * Displays a comparison table and chart for all three pricing scenarios
 * (Conservative, Standard, Aggressive). Includes toggle to show/hide the comparison.
 *
 * @param {Object} props - Component props
 * @param {Object} props.allScenarios - Object containing computed models for all scenarios
 * @param {Object} props.allScenarios.conservative - Conservative scenario model
 * @param {Object} props.allScenarios.standard - Standard scenario model
 * @param {Object} props.allScenarios.aggressive - Aggressive scenario model
 * @param {boolean} props.showComparison - Whether to display the comparison section
 * @param {Function} props.setShowComparison - Function to toggle comparison visibility
 * @param {Function} props.formatGBP - Currency formatting function
 */
const ScenarioComparison = ({ allScenarios, showComparison, setShowComparison, formatGBP }) => {
  // Calculate metrics for each scenario - CAPEX and OPEX reported separately
  const scenarios = ['conservative', 'standard', 'aggressive'];
  const scenarioData = scenarios.map(key => {
    const scenario = allScenarios[key];

    // Calculate CAPEX margin (primary project cost indicator)
    const capexMargin = scenario.capexOneTimePrice > 0 ? ((scenario.capexOneTimePrice - scenario.capexOneTimeCost) / scenario.capexOneTimePrice) * 100 : 0;
    const targetMargin = scenario.config.targetMargin * 100;
    const variance = capexMargin - targetMargin;

    return {
      name: scenario.config.name,
      capexPrice: scenario.capexOneTimePrice,
      opexPrice: scenario.opexAnnualPrice,
      targetMargin,
      capexMargin,
      variance,
      laborMargin: scenario.config.laborMargin * 100,
      passthroughMargin: scenario.config.passthroughMargin * 100,
      onTarget: variance >= -2,
    };
  });

  return (
    <>
      {/* Toggle Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showComparison ? '− Hide' : '+ Show'} Scenario Comparison
        </button>
      </div>

      {/* Scenario Comparison Content */}
      {showComparison && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Scenario Comparison: Pricing & Margin Performance</h2>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {scenarioData.map((scenario, idx) => (
              <div key={idx} className={`rounded-lg p-4 border-2 ${scenario.onTarget ? 'border-slate-400 bg-slate-50' : 'border-slate-300 bg-slate-50'}`}>
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-slate-800">{scenario.name}</h3>
                  <div className="text-sm text-slate-600 mt-2 space-y-1">
                    <div>CAPEX (One-time): <span className="font-mono font-bold text-slate-900">{formatGBP(scenario.capexPrice, 0)}</span></div>
                    <div>OPEX (Annual): <span className="font-mono font-bold text-slate-900">{formatGBP(scenario.opexPrice, 0)}</span></div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-200 pt-3">
                  {/* Target vs CAPEX Margin */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-slate-700">Target Margin</span>
                      <span className="text-sm font-mono font-bold">{scenario.targetMargin.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-slate-700">CAPEX Margin</span>
                      <span className={`text-sm font-mono font-bold ${scenario.onTarget ? 'text-slate-800' : 'text-slate-700'}`}>
                        {scenario.capexMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-700">Variance</span>
                      <span className={`text-sm font-mono font-bold ${scenario.onTarget ? 'text-slate-800' : 'text-slate-700'}`}>
                        {scenario.variance > 0 ? '+' : ''}{scenario.variance.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Dual Margins */}
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-slate-700">Labor Margin</span>
                      <span className="font-mono font-semibold">{scenario.laborMargin.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700">Pass-through Margin</span>
                      <span className="font-mono font-semibold">{scenario.passthroughMargin.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="pt-2">
                    <div className={`text-xs font-bold text-center py-1 rounded ${scenario.onTarget ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-700'}`}>
                      {scenario.onTarget ? '✓ On Target' : '≈ Near Target'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Comparison Table */}
          <div className="mt-6 border-t-2 border-slate-300 pt-6">
            <h3 className="font-bold text-slate-800 mb-4">Detailed Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Metric</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Conservative<br/>(40% Target)</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Standard<br/>(50% Target)</th>
                    <th className="text-right py-2 px-3 font-semibold text-slate-700">Aggressive<br/>(60% Target)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3">CAPEX (One-time)</td>
                    <td className="py-2 px-3 text-right font-mono">{formatGBP(allScenarios.conservative.capexOneTimePrice, 0)}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatGBP(allScenarios.standard.capexOneTimePrice, 0)}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatGBP(allScenarios.aggressive.capexOneTimePrice, 0)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3">OPEX (Annual)</td>
                    <td className="py-2 px-3 text-right font-mono">{formatGBP(allScenarios.conservative.opexAnnualPrice, 0)}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatGBP(allScenarios.standard.opexAnnualPrice, 0)}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatGBP(allScenarios.aggressive.opexAnnualPrice, 0)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50 font-semibold">
                    <td className="py-2 px-3">CAPEX Margin %</td>
                    <td className="py-2 px-3 text-right font-mono">{scenarioData[0].capexMargin.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right font-mono">{scenarioData[1].capexMargin.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right font-mono">{scenarioData[2].capexMargin.toFixed(1)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3">vs Manual Benchmark</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {(((allScenarios.conservative.capexOneTimePrice / allScenarios.conservative.benchManualTotal) - 1) * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {(((allScenarios.standard.capexOneTimePrice / allScenarios.standard.benchManualTotal) - 1) * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {(((allScenarios.aggressive.capexOneTimePrice / allScenarios.aggressive.benchManualTotal) - 1) * 100).toFixed(0)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Margin Visualization */}
          <div className="mt-6">
            <h3 className="font-bold text-slate-800 mb-4">Margin Performance Chart</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scenarioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Margin %', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v) => v.toFixed(1) + '%'} />
                <Bar dataKey="targetMargin" fill="#cbd5e1" name="Target Margin" />
                <Bar dataKey="capexMargin" fill="#64748b" name="CAPEX Margin" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Note */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-300 rounded">
            <p className="text-sm text-slate-700">
              <strong>Quick Insight:</strong> All three scenarios are designed to achieve their target CAPEX margins through a dual-margin strategy: higher margins on labor (value-add) and lower margins on pass-through costs (verifiable Azure infrastructure). CAPEX and OPEX are reported separately as distinct financial categories.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ScenarioComparison;
