import React, { useMemo } from 'react';

/**
 * CostDriverAnalysis Component
 *
 * Displays comprehensive breakdown of QUOTE PRICING for CLIENT QUOTE showing:
 * - CLIENT QUOTE total PRICE breakdown (Ingestion CAPEX, Build CAPEX, Annual OPEX)
 * - Detailed sub-components within each category with actual prices and percentages
 * - Color-coded visual indicators (red >40%, amber 20-40%, green <20%)
 * - Dynamic, actionable insights based on actual price distribution
 * - Top 3 price drivers with specific optimization recommendations
 *
 * CRITICAL: Uses CLIENT QUOTE PRICES (what client is charged)
 * NOT internal costs - shows capexOneTimePrice + opexAnnualPrice
 *
 * @param {Object} props
 * @param {Object} props.model - The computed financial model containing all calculations
 * @param {Function} props.formatGBP - Function to format currency values in GBP
 */
const CostDriverAnalysis = ({ model, formatGBP }) => {
  // CAPEX and OPEX must be reported separately - they are different financial categories
  // CAPEX: Total one-time implementation cost
  // OPEX: Annual ongoing operational cost
  const totalCapexPrice = model.capexOneTimePrice;
  const totalOpexPrice = model.opexAnnualPrice;

  // Helper to get color based on percentage threshold
  const getColorClass = (pct) => {
    if (pct > 40) return 'bg-red-500';
    if (pct > 20) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getTextColorClass = (pct) => {
    if (pct > 40) return 'text-red-700';
    if (pct > 20) return 'text-amber-700';
    return 'text-green-700';
  };

  // Calculate percentages for CAPEX categories (as % of total CAPEX)
  const pctIngestionCapex = totalCapexPrice > 0 ? (model.ingestionTotalPrice / totalCapexPrice) * 100 : 0;
  const pctBuildCapex = totalCapexPrice > 0 ? (model.buildTotalPrice / totalCapexPrice) * 100 : 0;

  // Calculate percentages for ingestion sub-components (as % of total CAPEX)
  const pctManualReview = totalCapexPrice > 0 ? (model.P_manual_eng / totalCapexPrice) * 100 : 0;
  const pctOCR = totalCapexPrice > 0 ? (model.P_OCR / totalCapexPrice) * 100 : 0;
  const pctLLM = totalCapexPrice > 0 ? (model.P_LLM / totalCapexPrice) * 100 : 0;

  // Calculate percentages for build sub-components (as % of total CAPEX)
  const pctBuildLabor = totalCapexPrice > 0 ? (model.buildLaborPrice / totalCapexPrice) * 100 : 0;
  const pctBuildPassthrough = totalCapexPrice > 0 ? (model.buildPassthroughPrice / totalCapexPrice) * 100 : 0;

  // OPEX is 100% of itself (annual recurring)
  const pctOpexAnnual = 100;

  // Generate dynamic insights and recommendations
  const insights = useMemo(() => {
    const items = [];

    // Ingestion CAPEX insights
    if (pctIngestionCapex > 50) {
      items.push({
        type: 'critical',
        message: `Ingestion CAPEX is ${pctIngestionCapex.toFixed(0)}% of total cost - major cost driver`,
        recommendation: 'Focus optimization efforts on ingestion phase'
      });
    }

    // Manual review insights
    if (pctManualReview > 40) {
      items.push({
        type: 'warning',
        message: `Manual review is ${pctManualReview.toFixed(0)}% of total cost`,
        recommendation: 'Improve data quality or reduce review percentage to lower costs significantly'
      });
    } else if (pctManualReview > 20) {
      items.push({
        type: 'info',
        message: `Manual review is ${pctManualReview.toFixed(0)}% of total cost`,
        recommendation: 'Consider optimizing review time or improving document quality'
      });
    }

    // OPEX insights
    if (pctOpexAnnual > 30) {
      items.push({
        type: 'warning',
        message: `Annual OPEX is ${pctOpexAnnual.toFixed(0)}% of total cost`,
        recommendation: 'Explore infrastructure optimizations, right-size storage and compute resources'
      });
    }

    // Build CAPEX insights
    if (pctBuildCapex > 50) {
      items.push({
        type: 'critical',
        message: `Build CAPEX is ${pctBuildCapex.toFixed(0)}% of total cost`,
        recommendation: 'Consider increasing amortization sites or reducing development scope'
      });
    } else if (pctBuildCapex > 30) {
      items.push({
        type: 'info',
        message: `Build CAPEX is ${pctBuildCapex.toFixed(0)}% of total cost`,
        recommendation: 'Review team composition and development estimates'
      });
    }

    // AI Extraction cost insights
    if (pctLLM > 15) {
      items.push({
        type: 'info',
        message: `AI Extraction costs are ${pctLLM.toFixed(0)}% of total`,
        recommendation: 'Consider optimizing extraction efficiency and model selection'
      });
    }

    return items;
  }, [pctIngestionCapex, pctManualReview, pctOpexAnnual, pctBuildCapex, pctLLM]);

  // Calculate top 3 CAPEX drivers (percentages of total CAPEX)
  const topDrivers = useMemo(() => {
    const drivers = [
      { name: 'Manual Review', pct: pctManualReview, price: model.P_manual_eng },
      { name: 'Build Labor', pct: pctBuildLabor, price: model.buildLaborPrice },
      { name: 'OCR Processing', pct: pctOCR, price: model.P_OCR },
      { name: 'AI Extraction', pct: pctLLM, price: model.P_LLM },
      { name: 'Build Passthrough', pct: pctBuildPassthrough, price: model.buildPassthroughPrice },
    ];
    return drivers
      .filter(d => d.price > 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [pctManualReview, pctBuildLabor, pctOCR, pctLLM, pctBuildPassthrough, model]);

  // Component for cost driver row
  const CostDriverRow = ({ label, percentage, amount, indent = false }) => (
    <div className={`flex justify-between items-center ${indent ? 'pl-4 border-l-2 border-slate-200' : ''}`}>
      <span className={`text-sm ${indent ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600 w-24 text-right">
          {formatGBP(amount)}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-32 h-3 bg-slate-200 rounded overflow-hidden">
            <div
              className={`h-full ${getColorClass(percentage)}`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            ></div>
          </div>
          <span className={`text-sm font-semibold w-14 text-right ${getTextColorClass(percentage)}`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-2 pb-2 border-b border-slate-200">
        Cost Driver Analysis
      </h2>
      <p className="text-sm text-slate-600 mb-6">
        CLIENT QUOTE breakdown showing CAPEX composition (where one-time implementation costs are concentrated) and Annual OPEX.
        CAPEX: <strong>{formatGBP(totalCapexPrice)}</strong> (one-time) | OPEX: <strong>{formatGBP(totalOpexPrice)}</strong> (annual recurring).
      </p>

      {/* Main Cost Categories */}
      <div className="space-y-6 mb-6">
        {/* Ingestion CAPEX Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
            Ingestion CAPEX (One-Time)
          </h3>
          <div className="space-y-3">
            <CostDriverRow
              label="Total Ingestion CAPEX"
              percentage={pctIngestionCapex}
              amount={model.ingestionTotalPrice}
            />
            <CostDriverRow
              label="Manual Review Support"
              percentage={pctManualReview}
              amount={model.P_manual_eng}
              indent={true}
            />
            <CostDriverRow
              label="OCR Processing"
              percentage={pctOCR}
              amount={model.P_OCR}
              indent={true}
            />
            <CostDriverRow
              label="LLM Extraction"
              percentage={pctLLM}
              amount={model.P_LLM}
              indent={true}
            />
          </div>
        </div>

        {/* Build CAPEX Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
            Build CAPEX (One-Time)
          </h3>
          <div className="space-y-3">
            <CostDriverRow
              label="Total Build CAPEX"
              percentage={pctBuildCapex}
              amount={model.buildTotalPrice}
            />
            <CostDriverRow
              label="Development Labor"
              percentage={pctBuildLabor}
              amount={model.buildLaborPrice}
              indent={true}
            />
            <CostDriverRow
              label="Passthrough Costs (Pen-Test, etc.)"
              percentage={pctBuildPassthrough}
              amount={model.buildPassthroughPrice}
              indent={true}
            />
          </div>
        </div>

        {/* Annual OPEX Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
            Annual OPEX (Recurring)
          </h3>
          <div className="space-y-3">
            <CostDriverRow
              label="Total Annual OPEX"
              percentage={pctOpexAnnual}
              amount={model.opexAnnualPrice}
            />
            <CostDriverRow
              label="Monthly OPEX × 12"
              percentage={pctOpexAnnual}
              amount={model.opexAnnualPrice}
              indent={true}
            />
          </div>
        </div>
      </div>

      {/* Top 3 CAPEX Drivers */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-300 mb-4">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
          Top 3 CAPEX Drivers
        </h3>
        <div className="space-y-2">
          {topDrivers.map((driver, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">
                <span className="font-bold text-slate-900">{idx + 1}.</span> {driver.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-medium">{formatGBP(driver.price)}</span>
                <span className={`font-bold ${getTextColorClass(driver.pct)}`}>
                  ({driver.pct.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Insights and Recommendations */}
      {insights.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wide">
            Actionable Insights
          </h3>
          {insights.map((insight, idx) => {
            const bgColor = insight.type === 'critical' ? 'bg-slate-100 border-slate-300' :
                           insight.type === 'warning' ? 'bg-slate-50 border-slate-300' :
                           'bg-slate-50 border-slate-200';
            const textColor = 'text-slate-700';
            const iconColor = insight.type === 'critical' ? 'text-slate-600' :
                             insight.type === 'warning' ? 'text-slate-600' :
                             'text-slate-500';
            return (
              <div key={idx} className={`p-3 rounded border ${bgColor}`}>
                <p className={`text-xs ${textColor} mb-1`}>
                  <strong>{insight.message}</strong>
                </p>
                <p className={`text-xs ${iconColor}`}>
                  → {insight.recommendation}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Color Legend */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-end gap-4 text-xs text-slate-600">
        <span>Color coding:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>&gt;40% (High)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-500 rounded"></div>
          <span>20-40% (Medium)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>&lt;20% (Low)</span>
        </div>
      </div>
    </div>
  );
};

export default CostDriverAnalysis;
