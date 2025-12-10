import React from 'react';

/**
 * CostBreakdownWaterfall Component
 *
 * Displays a detailed waterfall/breakdown of total quote cost:
 * - Ingestion CAPEX (OCR + AI Extraction + Manual Review)
 * - Build CAPEX (Platform Engineering)
 * - OPEX (Annual)
 * - Total Quote with markup and gross margin
 *
 * Helps procurement understand cost structure and where value is delivered.
 *
 * @param {Object} props
 * @param {Object} props.model - The computed financial model containing all calculations
 * @param {Function} props.formatGBP - Function to format currency values in GBP
 */
const CostBreakdownWaterfall = ({ model, formatGBP }) => {
  // Extract key cost components
  const ocrCost = model.C_OCR;
  const llmCost = model.C_LLM;
  const manualCost = model.C_manual;
  const ingestionLaborCost = manualCost;
  const ingestionPassthroughCost = ocrCost + llmCost;
  const ingestionTotalCost = model.ingestionTotalCost;
  const ingestionTotalPrice = model.ingestionTotalPrice;

  const buildLaborCost = model.buildLaborCost;
  const buildPassthroughCost = model.buildPassthroughCost;
  const buildTotalCost = model.buildTotalCost;
  const buildTotalPrice = model.buildTotalPrice;

  const opexAnnualCost = model.opexAnnualCost;
  const opexAnnualPrice = model.opexAnnualPrice;

  const capexTotalCost = model.capexOneTimeCost;
  const capexTotalPrice = model.capexOneTimePrice;

  // Calculate percentages within CAPEX
  const ingestionPct = capexTotalCost > 0 ? (ingestionTotalCost / capexTotalCost) * 100 : 0;
  const buildPct = capexTotalCost > 0 ? (buildTotalCost / capexTotalCost) * 100 : 0;

  // Calculate average margins (margin = (Price - Cost) / Price)
  const ingestionMarginAvg = ingestionTotalPrice > 0
    ? ((ingestionTotalPrice - ingestionTotalCost) / ingestionTotalPrice) * 100
    : 0;
  const buildMarginAvg = buildTotalPrice > 0
    ? ((buildTotalPrice - buildTotalCost) / buildTotalPrice) * 100
    : 0;
  const opexMarginAvg = opexAnnualPrice > 0
    ? ((opexAnnualPrice - opexAnnualCost) / opexAnnualPrice) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
        Cost Breakdown & Margin Structure
      </h2>

      <div className="space-y-6">
        {/* Ingestion CAPEX */}
        <div className="border border-slate-200 rounded p-4 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">Ingestion CAPEX (One-time)</h3>
            <span className="text-sm text-slate-600">{ingestionPct.toFixed(0)}% of total cost</span>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2 px-3 text-slate-700">OCR (Azure Read)</td>
                <td className="py-2 px-3 text-right font-mono text-slate-600">{formatGBP(ocrCost, 0)}</td>
                <td className="py-2 px-3 text-right text-slate-500">{(model.config.passthroughMargin * 100).toFixed(0)}% margin</td>
                <td className="py-2 px-3 text-right font-mono font-semibold">{formatGBP(model.P_OCR, 0)}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 px-3 text-slate-700">AI Extraction</td>
                <td className="py-2 px-3 text-right font-mono text-slate-600">{formatGBP(llmCost, 0)}</td>
                <td className="py-2 px-3 text-right text-slate-500">{(model.config.passthroughMargin * 100).toFixed(0)}% margin</td>
                <td className="py-2 px-3 text-right font-mono font-semibold">{formatGBP(model.P_LLM, 0)}</td>
              </tr>
              <tr className="bg-blue-50">
                <td className="py-2 px-3 text-slate-700">Manual Review (billed 10%)</td>
                <td className="py-2 px-3 text-right font-mono text-slate-600">{formatGBP(manualCost, 0)}</td>
                <td className="py-2 px-3 text-right text-slate-500">{(model.config.laborMargin * 100).toFixed(0)}% margin</td>
                <td className="py-2 px-3 text-right font-mono font-semibold">{formatGBP(model.P_manual_eng, 0)}</td>
              </tr>
              <tr className="font-bold bg-slate-100 border-t-2 border-slate-300">
                <td className="py-2 px-3">Ingestion CAPEX Total</td>
                <td className="py-2 px-3 text-right font-mono">{formatGBP(ingestionTotalCost, 0)}</td>
                <td className="py-2 px-3 text-right text-sm text-slate-600">
                  Avg {ingestionMarginAvg.toFixed(0)}% margin
                </td>
                <td className="py-2 px-3 text-right font-mono">{formatGBP(ingestionTotalPrice, 0)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-slate-600 mt-2">
            Machine costs (OCR + AI Extraction) = {formatGBP(ocrCost + llmCost, 0)} (~{(((ocrCost + llmCost) / ingestionTotalCost) * 100).toFixed(1)}% of ingestion); bulk is flagged document review.
          </p>
        </div>

        {/* Build CAPEX */}
        <div className="border border-slate-200 rounded p-4 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">Build CAPEX (One-time Platform)</h3>
            <span className="text-sm text-slate-600">{buildPct.toFixed(0)}% of total cost</span>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2 px-3 text-slate-700">Engineering Labor (7 roles, 230 days)</td>
                <td className="py-2 px-3 text-right font-mono text-slate-600">{formatGBP(buildLaborCost, 0)}</td>
                <td className="py-2 px-3 text-right text-slate-500">{(model.config.laborMargin * 100).toFixed(0)}% margin</td>
                <td className="py-2 px-3 text-right font-mono font-semibold">{formatGBP(model.buildLaborPrice, 0)}</td>
              </tr>
              <tr className="bg-blue-50">
                <td className="py-2 px-3 text-slate-700">Security Pen-Test</td>
                <td className="py-2 px-3 text-right font-mono text-slate-600">{formatGBP(buildPassthroughCost, 0)}</td>
                <td className="py-2 px-3 text-right text-slate-500">{(model.config.passthroughMargin * 100).toFixed(0)}% margin</td>
                <td className="py-2 px-3 text-right font-mono font-semibold">{formatGBP(model.buildPassthroughPrice, 0)}</td>
              </tr>
              <tr className="font-bold bg-slate-100 border-t-2 border-slate-300">
                <td className="py-2 px-3">Build CAPEX Total</td>
                <td className="py-2 px-3 text-right font-mono">{formatGBP(buildTotalCost, 0)}</td>
                <td className="py-2 px-3 text-right text-sm text-slate-600">
                  Avg {buildMarginAvg.toFixed(0)}% margin
                </td>
                <td className="py-2 px-3 text-right font-mono">{formatGBP(buildTotalPrice, 0)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-slate-600 mt-2">
            Covers: Ingestion orchestration, cross-doc reasoning, SSO/MFA, audit logs, API, search/Q&A UI, security hardening, pen-test.
          </p>
        </div>

        {/* Annual OPEX */}
        <div className="border border-slate-200 rounded p-4 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800">OPEX (Annual Run-Rate)</h3>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2 px-3 text-slate-700">Azure Services (Search, Hosting, Monitoring, Storage, QA API)</td>
                <td className="py-2 px-3 text-right font-mono text-slate-600">{formatGBP(model.opexTotalCost, 0)}/mo</td>
                <td className="py-2 px-3 text-right text-slate-500">{(model.config.passthroughMargin * 100).toFixed(0)}% margin</td>
                <td className="py-2 px-3 text-right font-mono font-semibold">{formatGBP(model.opexTotalPrice, 0)}/mo</td>
              </tr>
              <tr className="font-bold bg-slate-100 border-t-2 border-slate-300">
                <td className="py-2 px-3">Annual OPEX (×12)</td>
                <td className="py-2 px-3 text-right font-mono">{formatGBP(opexAnnualCost, 0)}</td>
                <td className="py-2 px-3 text-right text-sm text-slate-600">
                  Avg {opexMarginAvg.toFixed(0)}% margin
                </td>
                <td className="py-2 px-3 text-right font-mono">{formatGBP(opexAnnualPrice, 0)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-slate-600 mt-2">
            Baseline: 16 hrs/mo low-touch support. Optional upsell to 40–120 hrs/mo (enhanced/premium tiers).
          </p>
        </div>

        {/* Key Insights */}
        <div className="bg-amber-50 border border-amber-200 rounded p-4">
          <h3 className="font-bold text-sm text-amber-900 mb-2">Cost Driver Insights</h3>
          <ul className="text-xs text-amber-800 space-y-1 ml-3">
            <li>• <strong>Machine costs are negligible:</strong> OCR (£{ocrCost.toFixed(0)}) + LLM (£{llmCost.toFixed(0)}) = only £{(ocrCost + llmCost).toFixed(0)} total (~{(((ocrCost + llmCost) / capexTotalCost) * 100).toFixed(2)}%)</li>
            <li>• <strong>Manual review drives ingestion cost:</strong> {model.H_rev?.toFixed(0)} flagged hours; we bill 10% (£{manualCost.toFixed(0)})</li>
            <li>• <strong>Build engineering is the investment:</strong> {buildPct.toFixed(0)}% of cost—covers automation, security, governance, platform</li>
            <li>• <strong>OPEX is predictable:</strong> {formatGBP(opexAnnualPrice)}/year, scales with team requests (support hours are flexible)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CostBreakdownWaterfall;
