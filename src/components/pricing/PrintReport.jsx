import React, { useMemo } from 'react';
import formatGBP from './shared/formatGBP';
import { computeModel } from '../CornerstonePricingCalculator';

// Valid report variants
const VALID_VARIANTS = ['INTERNAL', 'ROM', 'DETAILED_QUOTE'];

// Variant metadata
const VARIANT_CONFIG = {
  INTERNAL: {
    label: 'INTERNAL USE ONLY - CONFIDENTIAL',
    title: 'Financial Analysis Report',
  },
  ROM: {
    label: 'RANGE OF MAGNITUDE - CLIENT PROPOSAL',
    title: 'Range of Magnitude Quote',
  },
  DETAILED_QUOTE: {
    label: 'DETAILED QUOTE - CLIENT PROPOSAL',
    title: 'Detailed Project Quote',
  },
};

// Safe wrapper for formatGBP that handles undefined/null values
const safeFormatGBP = (value) => {
  if (value === null || value === undefined) {
    return '£0.00';
  }
  try {
    return formatGBP(value);
  } catch (error) {
    console.error('Error formatting GBP for value:', value, error);
    return '£0.00';
  }
};

/**
 * PrintReport Component
 * Multi-variant professional report (INTERNAL, ROM, DETAILED_QUOTE)
 * Renders a print-optimized report with all assumptions, costs, and analysis
 * Hidden on screen, shown only in print preview / PDF export
 *
 * @param {Object} model - Calculated pricing model from computeModel()
 * @param {Object} inputs - User input assumptions
 * @param {string} scenario - Selected scenario name
 * @param {string} reportVariant - Report type (INTERNAL, ROM, DETAILED_QUOTE)
 * @param {Object} SCENARIO_CONFIGS - Scenario configuration object
 */
const PrintReport = ({ model, inputs, scenario, reportVariant = 'INTERNAL', SCENARIO_CONFIGS }) => {
  // Validate inputs
  if (!model || !inputs || !SCENARIO_CONFIGS) {
    return (
      <div className="print-report bg-white text-black p-8">
        <p className="text-slate-600">Error: Missing required data for report generation</p>
      </div>
    );
  }

  // Validate and normalize variant
  const normalizedVariant = VALID_VARIANTS.includes(reportVariant) ? reportVariant : 'INTERNAL';
  if (normalizedVariant !== reportVariant) {
    console.warn(`Invalid report variant "${reportVariant}", defaulting to "INTERNAL"`);
  }

  const config = SCENARIO_CONFIGS[scenario];
  if (!config) {
    console.warn(`Scenario "${scenario}" not found in SCENARIO_CONFIGS`);
  }

  const reportDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate ROM scenarios (High/Medium/Low quality) with memoization
  const romScenarios = useMemo(() => {
    if (normalizedVariant !== 'ROM' || !config) {
      return { romHigh: null, romMedium: null, romLow: null };
    }

    try {
      const calculateROMScenario = (qGood, qMed, qPoor) => {
        try {
          const tempInputs = { ...inputs, qGood, qMed, qPoor };
          return computeModel(tempInputs, config);
        } catch (err) {
          console.error(`Error calculating ROM scenario (${qGood}/${qMed}/${qPoor}):`, err);
          return null;
        }
      };

      const high = calculateROMScenario(0.60, 0.30, 0.10);
      const medium = calculateROMScenario(0.50, 0.35, 0.15);
      const low = calculateROMScenario(0.35, 0.40, 0.25);

      // Fallback to current model if any scenario fails
      return {
        romHigh: high || model,
        romMedium: medium || model,
        romLow: low || model,
      };
    } catch (error) {
      console.error('Error calculating ROM scenarios:', error);
      return { romHigh: model, romMedium: model, romLow: model };
    }
  }, [normalizedVariant, inputs, config, model]);

  const { romHigh, romMedium, romLow } = romScenarios;

  // Get variant metadata safely
  const variantMetadata = VARIANT_CONFIG[normalizedVariant] || VARIANT_CONFIG.INTERNAL;
  const classificationLabel = variantMetadata.label;
  const reportTitle = variantMetadata.title;

  return (
    <div className="print-report bg-white text-black">
      {/* PAGE 1: TITLE PAGE */}
      <div className="page break-after-page py-20 px-8">
        {/* Classification Banner */}
        {classificationLabel && (
          <div style={{
            textAlign: 'center',
            padding: '12px 24px',
            marginBottom: '32px',
            borderTop: '2px solid #1e293b',
            borderBottom: '2px solid #1e293b',
            backgroundColor: '#f5f5f5',
          }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em', margin: 0 }}>
              {classificationLabel}
            </p>
          </div>
        )}

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Cornerstone AI Pricing Model</h1>
          <p className="text-xl text-slate-600 mb-8">{reportTitle}</p>
          <div className="inline-block border-t-2 border-b-2 border-blue-600 py-4 px-8">
            <p className="text-lg font-semibold text-slate-800">
              {config?.name || 'Standard'} Scenario
            </p>
          </div>
        </div>

        <div className="space-y-4 text-center text-slate-700 mb-12">
          <p>
            <strong>Report Generated:</strong> {reportDate}
          </p>
          <p>
            <strong>Pricing Scenario:</strong> {config?.name || 'N/A'}
          </p>
        </div>

        <div className="bg-slate-100 p-8 rounded-lg space-y-3 text-sm">
          <div>
            <span className="font-semibold text-slate-900">Total Sites:</span>{' '}
            <span className="text-slate-700">{inputs.nSites.toLocaleString()}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Avg Documents/Site:</span>{' '}
            <span className="text-slate-700">{((inputs.minDocs + inputs.maxDocs) / 2).toFixed(1)}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Quality Distribution:</span>{' '}
            <span className="text-slate-700">
              {(inputs.qGood * 100).toFixed(0)}% good / {(inputs.qMed * 100).toFixed(0)}% medium /{' '}
              {(inputs.qPoor * 100).toFixed(0)}% poor
            </span>
          </div>
          <div>
            <span className="font-semibold text-slate-900">Gross Margin:</span>{' '}
            <span className="text-slate-700 font-bold">
              {(model.grossMargin * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* PAGE 2: KEY ASSUMPTIONS */}
      <div className="page break-after-page py-12 px-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 page-title">Key Assumptions</h2>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Volume Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 border-b-2 border-blue-600 pb-2">Volume</h3>
            <table className="w-full text-sm">
              <tbody className="space-y-2">
                <tr>
                  <td className="font-semibold text-slate-700">Total Sites:</td>
                  <td className="text-right text-slate-900">{inputs.nSites.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-slate-700">Min Docs/Site:</td>
                  <td className="text-right text-slate-900">{inputs.minDocs}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-slate-700">Max Docs/Site:</td>
                  <td className="text-right text-slate-900">{inputs.maxDocs}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-slate-700">Avg Docs/Site:</td>
                  <td className="text-right text-slate-900">
                    {((inputs.minDocs + inputs.maxDocs) / 2).toFixed(1)}
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold text-slate-700">Total Documents:</td>
                  <td className="text-right text-slate-900">{model.N_docs.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="font-semibold text-slate-700">Total Pages:</td>
                  <td className="text-right text-slate-900">{model.N_pages.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quality Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 border-b-2 border-blue-600 pb-2">Data Quality</h3>
            <table className="w-full text-sm">
              <tbody className="space-y-2">
                <tr>
                  <td className="font-semibold text-slate-700">Good Quality:</td>
                  <td className="text-right text-slate-900">{(inputs.qGood * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                  <td className="font-semibold text-slate-700">Medium Quality:</td>
                  <td className="text-right text-slate-900">{(inputs.qMed * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                  <td className="font-semibold text-slate-700">Poor Quality:</td>
                  <td className="text-right text-slate-900">{(inputs.qPoor * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                  <td className="font-semibold text-slate-700">Review Rate (Good):</td>
                  <td className="text-right text-slate-900">{(inputs.rGood * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="font-semibold text-slate-700">Review Rate (Medium):</td>
                  <td className="text-right text-slate-900">{(inputs.rMed * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="font-semibold text-slate-700">Review Rate (Poor):</td>
                  <td className="text-right text-slate-900">{(inputs.rPoor * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Mix */}
        <div className="space-y-3 mb-8">
          <h3 className="font-bold text-slate-800 border-b-2 border-blue-600 pb-2">Document Mix & Pages</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="text-left font-semibold text-slate-800 py-2">Document Type</th>
                <th className="text-right font-semibold text-slate-800 py-2">Mix %</th>
                <th className="text-right font-semibold text-slate-800 py-2">Avg Pages</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2 text-slate-700">Lease</td>
                <td className="text-right text-slate-900">{(inputs.mixLease * 100).toFixed(0)}%</td>
                <td className="text-right text-slate-900">{inputs.pagesLease}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 text-slate-700">Deed</td>
                <td className="text-right text-slate-900">{(inputs.mixDeed * 100).toFixed(0)}%</td>
                <td className="text-right text-slate-900">{inputs.pagesDeed}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 text-slate-700">Licence</td>
                <td className="text-right text-slate-900">{(inputs.mixLicence * 100).toFixed(0)}%</td>
                <td className="text-right text-slate-900">{inputs.pagesLicence}</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-700">Plan</td>
                <td className="text-right text-slate-900">{(inputs.mixPlan * 100).toFixed(0)}%</td>
                <td className="text-right text-slate-900">{inputs.pagesPlan}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGE 3: COST BREAKDOWN - Only show for INTERNAL and ROM */}
      {(normalizedVariant === 'INTERNAL' || normalizedVariant === 'ROM') && (
      <div className="page break-after-page py-12 px-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 page-title">Cost Breakdown</h2>

        {/* Ingestion */}
        <div className="mb-8">
          <h3 className="font-bold text-slate-800 bg-blue-100 p-2 rounded mb-3">Ingestion CAPEX</h3>
          <table className="w-full text-sm border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="text-left p-2 font-semibold">Item</th>
                <th className="text-right p-2 font-semibold">Cost</th>
                <th className="text-right p-2 font-semibold">Markup</th>
                <th className="text-right p-2 font-semibold">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 text-slate-700">Azure OCR</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(model.C_OCR)}</td>
                <td className="text-right p-2 text-slate-900">
                  {(config.passthroughMargin * 100).toFixed(0)}% margin
                </td>
                <td className="text-right p-2 font-semibold">{formatGBP(model.P_OCR)}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 text-slate-700">AI Extraction</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(model.C_LLM)}</td>
                <td className="text-right p-2 text-slate-900">
                  {(config.passthroughMargin * 100).toFixed(0)}% margin
                </td>
                <td className="text-right p-2 font-semibold">{formatGBP(model.P_LLM)}</td>
              </tr>
              <tr>
                <td className="p-2 text-slate-700">Manual Review</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(model.C_manual)}</td>
                <td className="text-right p-2 text-slate-900">+{(config.laborMargin * 100).toFixed(0)}%</td>
                <td className="text-right p-2 font-semibold">{formatGBP(model.P_manual_eng)}</td>
              </tr>
              <tr className="bg-blue-50 border-t-2 border-blue-600">
                <td className="p-2 font-bold text-slate-900">Ingestion Total</td>
                <td className="text-right p-2 font-bold text-slate-900">{formatGBP(model.ingestionTotalCost)}</td>
                <td className="text-right p-2"></td>
                <td className="text-right p-2 font-bold text-blue-600">{formatGBP(model.ingestionTotalPrice)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Build */}
        <div className="mb-8">
          <h3 className="font-bold text-slate-800 bg-blue-100 p-2 rounded mb-3">Build CAPEX</h3>
          <table className="w-full text-sm border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="text-left p-2 font-semibold">Item</th>
                <th className="text-right p-2 font-semibold">Cost</th>
                <th className="text-right p-2 font-semibold">Markup</th>
                <th className="text-right p-2 font-semibold">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-50 border-b-2 border-blue-600">
                <td className="p-2 font-bold text-slate-900">Build Labor Total</td>
                <td className="text-right p-2 font-bold text-slate-900">
                  {formatGBP(model.buildLaborCost)}
                </td>
                <td className="text-right p-2 font-bold text-slate-900">
                  +{(config.laborMargin * 100).toFixed(0)}%
                </td>
                <td className="text-right p-2 font-bold text-blue-600">
                  {formatGBP(model.buildLaborPrice)}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-slate-900">Pen Test</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(model.buildPassthroughCost)}</td>
                <td className="text-right p-2 text-slate-900">
                  {(config.passthroughMargin * 100).toFixed(0)}% margin
                </td>
                <td className="text-right p-2 font-semibold">{formatGBP(model.buildPassthroughPrice)}</td>
              </tr>
              <tr className="bg-blue-50 border-t-2 border-blue-600">
                <td className="p-2 font-bold text-slate-900">Build Total</td>
                <td className="text-right p-2 font-bold text-slate-900">{formatGBP(model.buildTotalCost)}</td>
                <td className="text-right p-2"></td>
                <td className="text-right p-2 font-bold text-blue-600">{formatGBP(model.buildTotalPrice)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* PAGE 4: SUMMARY & MARGINS */}
      <div className="page break-after-page py-12 px-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 page-title">Financial Summary</h2>

        {/* Quote Summary */}
        <div className="mb-8 p-6 bg-slate-900 text-white rounded-lg">
          <div className={`grid ${normalizedVariant === 'DETAILED_QUOTE' ? 'grid-cols-2' : 'grid-cols-2'} gap-6`}>
            <div>
              <p className="text-sm text-slate-300 mb-1">CAPEX (One-time)</p>
              <p className="text-2xl font-bold">{formatGBP(model.capexOneTimePrice)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-300 mb-1">OPEX (Annual)</p>
              <p className="text-2xl font-bold">{formatGBP(model.opexAnnualPrice)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-300 mb-1">Total Quote (CAPEX + Year 1 OPEX)</p>
              <p className="text-3xl font-bold text-green-400">{formatGBP(model.totalQuotePrice)}</p>
            </div>
            {reportVariant !== 'DETAILED_QUOTE' && (
            <div>
              <p className="text-sm text-slate-300 mb-1">Gross Margin</p>
              <p className="text-3xl font-bold text-blue-400">{(model.grossMargin * 100).toFixed(1)}%</p>
            </div>
            )}
          </div>
        </div>

        {/* ROM Pricing Scenarios - Only for ROM variant */}
        {normalizedVariant === 'ROM' && (
        <div className="mb-8">
          <h3 className="font-bold text-slate-800 bg-green-100 p-2 rounded mb-3">Pricing by Data Quality Scenario</h3>
          <table className="w-full text-sm border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="text-left p-2 font-semibold">Quality Scenario</th>
                <th className="text-right p-2 font-semibold">CAPEX</th>
                <th className="text-right p-2 font-semibold">Annual OPEX</th>
                <th className="text-right p-2 font-semibold">Total (Year 1)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 text-slate-700"><strong>High Quality</strong> (60% good, 30% med, 10% poor)</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(romHigh.capexOneTimePrice)}</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(romHigh.opexAnnualPrice)}</td>
                <td className="text-right p-2 font-semibold text-blue-600">{formatGBP(romHigh.totalQuotePrice)}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 text-slate-700"><strong>Medium Quality</strong> (50% good, 35% med, 15% poor)</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(romMedium.capexOneTimePrice)}</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(romMedium.opexAnnualPrice)}</td>
                <td className="text-right p-2 font-semibold text-blue-600">{formatGBP(romMedium.totalQuotePrice)}</td>
              </tr>
              <tr>
                <td className="p-2 text-slate-700"><strong>Low Quality</strong> (35% good, 40% med, 25% poor)</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(romLow.capexOneTimePrice)}</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(romLow.opexAnnualPrice)}</td>
                <td className="text-right p-2 font-semibold text-blue-600">{formatGBP(romLow.totalQuotePrice)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        )}

        {/* Benchmarking - Only for INTERNAL variant */}
        {normalizedVariant === 'INTERNAL' && (
        <div className="mb-8">
          <h3 className="font-bold text-slate-800 bg-blue-100 p-2 rounded mb-3">Competitive Benchmarking</h3>
          <table className="w-full text-sm border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="text-left p-2 font-semibold">Scenario</th>
                <th className="text-right p-2 font-semibold">Per Document</th>
                <th className="text-right p-2 font-semibold">Total CAPEX</th>
                <th className="text-right p-2 font-semibold">Savings vs Our Solution</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 text-slate-700">Manual Labor (100% human review)</td>
                <td className="text-right p-2 text-slate-900">£{inputs.benchmarkManualPerDoc}</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(model.benchManualTotal)}</td>
                <td className="text-right p-2 font-semibold text-green-600">
                  +{formatGBP(model.savingsVsManual)}
                </td>
              </tr>
              <tr>
                <td className="p-2 text-slate-700">Competitor AI Solution</td>
                <td className="text-right p-2 text-slate-900">£{inputs.benchmarkCompetitorPerDoc}</td>
                <td className="text-right p-2 text-slate-900">{formatGBP(model.benchCompetitorTotal)}</td>
                <td className="text-right p-2 font-semibold text-green-600">
                  +{formatGBP(model.savingsVsCompetitor)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        )}

        {/* Scenario Config - Only for INTERNAL variant */}
        {normalizedVariant === 'INTERNAL' && (
        <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-300">
          <h3 className="font-bold text-slate-800 mb-3">Pricing Strategy: {config?.name}</h3>
          <p className="text-sm text-slate-700 mb-3">{config?.description}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-slate-800">Labor Margin:</span>{' '}
              <span className="text-slate-900">{(config.laborMargin * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Pass-through Margin:</span>{' '}
              <span className="text-slate-900">{(config.passthroughMargin * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Target Margin:</span>{' '}
              <span className="text-slate-900">{(config.targetMargin * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Achieved Gross Margin:</span>{' '}
              <span className="text-slate-900 font-bold">{(model.grossMargin * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Critical: Allow document to expand beyond single viewport */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: initial !important;
            overflow: initial !important;
            background: white !important;
            width: 100% !important;
          }

          .print-report {
            width: 100%;
            max-width: 100%;
            box-shadow: none;
            border: none;
            background: white !important;
            color: black !important;
            display: block;
            margin: 0;
            padding: 0;
          }

          /* Each .page is a separate A4 sheet */
          .page {
            page-break-after: always;
            page-break-inside: avoid;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 20mm;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white !important;
            display: block;
          }

          /* No break after final page */
          .page:last-child {
            page-break-after: avoid;
          }

          .break-after-page {
            page-break-after: always;
          }

          .page-title {
            color: #1f2937 !important;
            border-bottom: 3px solid #1e40af !important;
            padding-bottom: 8px;
            margin-bottom: 20px;
            page-break-after: avoid;
          }

          h1, h2, h3, h4, h5, h6 {
            color: #111827 !important;
            margin-top: 0;
            page-break-after: avoid;
          }

          table {
            font-size: 11px;
            border-collapse: collapse;
            width: 100%;
            page-break-inside: auto;
            background: white !important;
          }

          /* Allow table rows to break across pages */
          tbody tr {
            page-break-inside: avoid;
          }

          thead tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          td, th {
            border: 1px solid #ccc !important;
            padding: 4px !important;
            background: inherit !important;
          }

          button, .no-print {
            display: none !important;
          }

          /* Prevent orphaned text */
          p {
            page-break-inside: avoid;
            margin: inherit;
          }

          /* Page setup for all browsers */
          @page {
            size: A4;
            margin: 10mm;
          }

          /* Firefox-specific fixes */
          @-moz-document url-prefix() {
            .page {
              page-break-after: always;
            }
          }
        }

        @media screen {
          .print-report {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintReport;
