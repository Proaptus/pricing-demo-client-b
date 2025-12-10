import React from 'react';

/**
 * MarginAnalysis Component for Red Pegasus
 *
 * Displays revenue allocation summary dashboard:
 * - Total revenue and value-days
 * - Blended effective day rate
 * - Party allocation breakdown (RPG vs Proaptus)
 * - Dark dashboard styling for visual prominence
 *
 * @param {Object} props
 * @param {Object} props.model - The computed allocation model with parties and totals
 * @param {Function} props.formatGBP - Function to format currency values in GBP
 */
const MarginAnalysis = ({ model, formatGBP }) => {
  // Check if model has the expected structure
  if (!model || !model.total) {
    return null;
  }

  // ACTUAL data structure from RedPegasusPricingCalculator:
  // model = { rpg: {...}, proaptus: {...}, total: {...} }
  const { total, rpg, proaptus } = model;

  // Calculate blended effective rate (revenue per value-day)
  const blendedRate = total.valueDays > 0 ? total.revenue / total.valueDays : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-slate-200" data-testid="margin-analysis">
      <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Revenue Allocation Summary</h2>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <div className="text-slate-600 text-sm font-semibold mb-2">Total Revenue</div>
          <div className="text-3xl font-bold text-slate-900">{formatGBP(total.revenue)}</div>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <div className="text-slate-600 text-sm font-semibold mb-2">Total Value-Days</div>
          <div className="text-3xl font-bold text-slate-900">{total.valueDays ? total.valueDays.toFixed(1) : '0.0'}</div>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
          <div className="text-slate-600 text-sm font-semibold mb-2">Blended Rate</div>
          <div className="text-3xl font-bold text-slate-900">{formatGBP(blendedRate)}/day</div>
        </div>
      </div>

      {/* Party Allocation Table */}
      <div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-300">
              <th className="text-left py-3 px-4 text-sm font-bold text-slate-900">Party</th>
              <th className="text-right py-3 px-4 text-sm font-bold text-slate-900">Value-Days</th>
              <th className="text-right py-3 px-4 text-sm font-bold text-slate-900">Share %</th>
              <th className="text-right py-3 px-4 text-sm font-bold text-slate-900">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rpg && (
              <tr className="border-b border-slate-100 hover:bg-slate-50 align-middle">
                <td className="py-3 px-4 font-medium text-slate-800">RPG</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">{rpg.valueDays ? rpg.valueDays.toFixed(1) : '0.0'}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">{rpg.share ? rpg.share.toFixed(2) : '0.00'}%</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">{formatGBP(rpg.revenue || 0)}</td>
              </tr>
            )}
            {proaptus && (
              <tr className="border-b border-slate-100 hover:bg-slate-50 align-middle">
                <td className="py-3 px-4 font-medium text-slate-800">Proaptus</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">{proaptus.valueDays ? proaptus.valueDays.toFixed(1) : '0.0'}</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">{proaptus.share ? proaptus.share.toFixed(2) : '0.00'}%</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">{formatGBP(proaptus.revenue || 0)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Explanation */}
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded">
          <div className="text-xs text-slate-600">
            <strong>Revenue Allocation Model:</strong> Revenue is distributed proportionally
            based on value-days (days × role weight). Higher-value roles contribute more
            to revenue allocation even with fewer calendar days.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarginAnalysis;