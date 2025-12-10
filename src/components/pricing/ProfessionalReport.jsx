import React, { forwardRef } from 'react';
import formatGBP from './shared/formatGBP';
import { computeModel } from '../CornerstonePricingCalculator';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * Helper function to create ROM (Rough Order of Magnitude) price ranges
 * Applies ±15% range and rounds to appropriate increments for ballpark estimates
 * @param {number} exactPrice - The exact calculated price
 * @returns {string} Formatted range string (e.g., "£300,000 – £410,000")
 */
const formatROMRange = (exactPrice) => {
  const lowerBound = exactPrice * 0.85; // -15%
  const upperBound = exactPrice * 1.15; // +15%

  // Determine rounding increment based on price magnitude
  let roundTo;
  if (exactPrice < 10000) {
    roundTo = 1000; // Round to £1k
  } else if (exactPrice < 100000) {
    roundTo = 5000; // Round to £5k
  } else if (exactPrice < 500000) {
    roundTo = 10000; // Round to £10k
  } else {
    roundTo = 25000; // Round to £25k
  }

  // Round down lower bound, round up upper bound
  const roundedLower = Math.floor(lowerBound / roundTo) * roundTo;
  const roundedUpper = Math.ceil(upperBound / roundTo) * roundTo;

  return `${formatGBP(roundedLower)} – ${formatGBP(roundedUpper)}`;
};

/**
 * ProfessionalReport Component
 * Multi-variant professional business report (INTERNAL, ROM, DETAILED_QUOTE)
 *
 * Three distinct report types:
 * - INTERNAL: Full financial analysis with costs, margins, and internal metrics
 * - ROM: Client-facing Rough Order of Magnitude quote with pricing ranges (no costs/margins)
 * - DETAILED_QUOTE: Client-facing detailed quote with pricing breakdown (no costs/margins)
 *
 * @param {Object} model - Calculated pricing model
 * @param {Object} inputs - User assumptions
 * @param {string} scenario - Selected pricing scenario
 * @param {string} reportVariant - Report type (INTERNAL, ROM, DETAILED_QUOTE)
 * @param {Object} SCENARIO_CONFIGS - Scenario configuration
 */
const ProfessionalReport = forwardRef(({ model, inputs, scenario, reportVariant, SCENARIO_CONFIGS }, ref) => {
  const config = SCENARIO_CONFIGS?.[scenario];

  if (!config || !model || !inputs) {
    return <div className="p-6">Loading report...</div>;
  }

  const reportDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate ROM scenarios (High/Medium/Low quality) for ROM report
  let romHigh, romMedium, romLow;
  let romHighPrice, romMediumPrice, romLowPrice;
  let totalDocs, manualCostPerDoc, manualTotalCost, romMediumCapexSavingsPercent;

  if (reportVariant === 'ROM') {
    try {
      const calculateROMScenario = (qGood, qMed, qPoor) => {
        const tempInputs = { ...inputs, qGood, qMed, qPoor };
        return computeModel(tempInputs, config);
      };

      romHigh = calculateROMScenario(0.60, 0.30, 0.10);
      romMedium = calculateROMScenario(0.50, 0.35, 0.15);
      romLow = calculateROMScenario(0.35, 0.40, 0.25);

      // Calculate total Year 1 prices (CAPEX + Annual OPEX) for ROM comparison table
      romHighPrice = romHigh.capexOneTimePrice + romHigh.opexAnnualPrice;
      romMediumPrice = romMedium.capexOneTimePrice + romMedium.opexAnnualPrice;
      romLowPrice = romLow.capexOneTimePrice + romLow.opexAnnualPrice;

      // Calculate manual labor benchmarks for ROM report (compare CAPEX only - one-time cost)
      totalDocs = model.N_docs;
      manualCostPerDoc = inputs.benchmarkManualPerDoc;
      manualTotalCost = totalDocs * manualCostPerDoc;
      romMediumCapexSavingsPercent = ((manualTotalCost - romMedium.capexOneTimePrice) / manualTotalCost) * 100;
    } catch (error) {
      console.error('Error calculating ROM scenarios:', error);
      romHigh = model;
      romMedium = model;
      romLow = model;
      romHighPrice = model.capexOneTimePrice + model.opexAnnualPrice;
      romMediumPrice = model.capexOneTimePrice + model.opexAnnualPrice;
      romLowPrice = model.capexOneTimePrice + model.opexAnnualPrice;
      totalDocs = 0;
      manualCostPerDoc = 100;
      manualTotalCost = 0;
      romMediumCapexSavingsPercent = 0;
    }
  }

  const classificationLabel = {
    INTERNAL: 'INTERNAL USE ONLY - CONFIDENTIAL',
    ROM: 'ROUGH ORDER OF MAGNITUDE - CLIENT PROPOSAL',
    DETAILED_QUOTE: 'DETAILED QUOTE - CLIENT PROPOSAL',
  }[reportVariant];

  const reportTitle = {
    INTERNAL: 'Internal Financial Analysis',
    ROM: 'Rough Order of Magnitude Quote',
    DETAILED_QUOTE: 'Detailed Project Quote',
  }[reportVariant];

  // Calculate key metrics - CAPEX and OPEX must be reported separately
  // CAPEX: One-time implementation cost
  // OPEX: Annual ongoing operational cost
  const capexGrossMargin = model.capexOneTimePrice > 0 ? ((model.capexOneTimePrice - model.capexOneTimeCost) / model.capexOneTimePrice) * 100 : 0;
  const opexGrossMargin = model.opexAnnualPrice > 0 ? ((model.opexAnnualPrice - model.opexAnnualCost) / model.opexAnnualPrice) * 100 : 0;


  // Header Component (shared across all variants)
  const ReportHeader = () => (
    <>
      {/* Proaptus Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <img
          src="https://firebasestorage.googleapis.com/v0/b/proaptus-website.firebasestorage.app/o/LOGO_RGB%20(1).svg?alt=media&token=72b5eb8b-c509-40af-b8d1-84861040be37"
          alt="Proaptus"
          style={{ height: '60px', margin: '0 auto' }}
        />
      </div>

      {/* Classification Banner */}
      <div
        style={{
          textAlign: 'center',
          padding: '12px 24px',
          marginBottom: '40px',
          borderTop: '2px solid #1e293b',
          borderBottom: '2px solid #1e293b',
          backgroundColor: reportVariant === 'INTERNAL' ? '#fee2e2' : '#f5f5f5',
        }}
      >
        <p style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em', color: reportVariant === 'INTERNAL' ? '#991b1b' : '#1e293b' }}>
          {classificationLabel}
        </p>
      </div>

      {/* Report Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>Cornerstone AI</h1>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#475569' }}>{reportTitle}</h2>
        <div style={{ height: '4px', width: '128px', backgroundColor: '#cbd5e1', margin: '0 auto' }}></div>
      </div>

      {/* Report Metadata */}
      <div style={{ marginTop: '48px', marginBottom: '48px', fontSize: '14px', color: '#475569', display: 'grid', gridTemplateColumns: reportVariant === 'INTERNAL' ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {reportVariant === 'INTERNAL' && (
          <div>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              Pricing Scenario
            </p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{config.name}</p>
          </div>
        )}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            Report Date
          </p>
          <p style={{ fontSize: '16px', color: '#1e293b' }}>{reportDate}</p>
        </div>
      </div>
    </>
  );

  // Footer removed - browser print dialog provides page numbers

  // ========================================
  // INTERNAL REPORT VARIANT
  // ========================================
  const InternalReport = () => (
    <>
      {/* Page 1: Executive Summary & Financial Overview */}
      <div className="page" style={{ padding: '40px' }}>
        <ReportHeader />

        {/* Executive Summary */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b', borderBottom: '2px solid #64748b', paddingBottom: '8px' }}>
            Executive Summary
          </h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569' }}>
            <p style={{ marginBottom: '12px' }}>
              This internal financial analysis provides a comprehensive breakdown of costs, pricing, and margin performance for the <strong>{config.name}</strong> pricing scenario.
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>CAPEX (One-time):</strong> {formatGBP(model.capexOneTimePrice)} (Cost: {formatGBP(model.capexOneTimeCost)} | Margin: {capexGrossMargin.toFixed(1)}%)
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>OPEX (Annual):</strong> {formatGBP(model.opexAnnualPrice)} (Cost: {formatGBP(model.opexAnnualCost)} | Margin: {opexGrossMargin.toFixed(1)}%)
            </p>
            <p>
              <strong>Strategy:</strong> Dual-margin approach with {(config.laborMargin * 100).toFixed(0)}% labor margin and {(config.passthroughMargin * 100).toFixed(0)}% pass-through margin to achieve {(config.targetMargin * 100).toFixed(0)}% target margin.
            </p>
          </div>
        </div>

        {/* Financial Dashboard */}
        <div style={{ marginBottom: '40px', padding: '24px', backgroundColor: '#334155', color: 'white', borderRadius: '4px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px' }}>Financial Dashboard</h4>

          {/* CAPEX Section */}
          <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #64748b' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '12px' }}>CAPEX (ONE-TIME IMPLEMENTATION)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>Cost</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatGBP(model.capexOneTimeCost)}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>Price</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatGBP(model.capexOneTimePrice)}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>Margin</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e2e8f0' }}>{capexGrossMargin.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* OPEX Section */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '12px' }}>OPEX (ANNUAL ONGOING)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>Cost</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatGBP(model.opexAnnualCost)}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>Price</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatGBP(model.opexAnnualPrice)}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '4px' }}>Margin</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e2e8f0' }}>{opexGrossMargin.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Breakdown Summary */}
        <div style={{ marginBottom: '40px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Cost Structure Breakdown</h4>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Category</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Cost</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Margin</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>Price</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>% of CAPEX</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>Ingestion CAPEX</td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{formatGBP(model.ingestionTotalCost)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>—</td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{formatGBP(model.ingestionTotalPrice)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{((model.ingestionTotalCost / model.capexOneTimeCost) * 100).toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px' }}>Build CAPEX</td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{formatGBP(model.buildTotalCost)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>—</td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>{formatGBP(model.buildTotalPrice)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{((model.buildTotalCost / model.capexOneTimeCost) * 100).toFixed(1)}%</td>
              </tr>
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 'bold' }}>
                <td style={{ padding: '12px' }}>Total CAPEX (One-time)</td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{formatGBP(model.capexOneTimeCost)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{capexGrossMargin.toFixed(1)}%</td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', color: '#1e40af' }}>{formatGBP(model.capexOneTimePrice)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>100%</td>
              </tr>
              <tr style={{ borderTop: '2px solid #cbd5e1' }}>
                <td style={{ padding: '12px', paddingTop: '20px' }} colSpan="5">
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>ONGOING OPERATIONS</div>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px' }}>Annual OPEX</td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>{formatGBP(model.opexAnnualCost)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>{opexGrossMargin.toFixed(1)}%</td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#166534' }}>{formatGBP(model.opexAnnualPrice)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Margin Analysis */}
        <div style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#92400e' }}>Margin Performance Analysis</h4>
          <div style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>Target Margin:</strong> {(config.targetMargin * 100).toFixed(1)}% | <strong>Achieved:</strong> {capexGrossMargin.toFixed(1)}% | <strong>Variance:</strong> <span style={{ color: (capexGrossMargin - config.targetMargin * 100) >= -2 ? '#15803d' : '#b91c1c' }}>{(capexGrossMargin - config.targetMargin * 100) > 0 ? '+' : ''}{(capexGrossMargin - config.targetMargin * 100).toFixed(1)}%</span>
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Dual-Margin Strategy:</strong> Labor {(config.laborMargin * 100).toFixed(0)}% / Pass-through {(config.passthroughMargin * 100).toFixed(0)}%
            </p>
            <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
              {(capexGrossMargin - config.targetMargin * 100) >= -2 ? '✓ Margin on target' : '⚠ Margin below target - review cost drivers and pricing strategy'}
            </p>
          </div>
        </div>
      </div>

      {/* Page 2: Detailed Cost Tables */}
      <div className="page" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #64748b', paddingBottom: '8px' }}>
            Detailed Cost Breakdown
          </h3>
        </div>

        {/* Ingestion CAPEX Table */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#475569' }}>Ingestion CAPEX Line Items</h4>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Cost</th>
                <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Margin</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {model.ingestionLineItems?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>{item.description}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(item.cost)}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontSize: '11px' }}>{(item.margin * 100).toFixed(0)}%</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', fontSize: '11px' }}>{formatGBP(item.price)}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="4" style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>No line items available</td>
                </tr>
              )}
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #64748b', fontWeight: 'bold' }}>
                <td style={{ padding: '10px' }}>Total Ingestion CAPEX</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{formatGBP(model.ingestionTotalCost)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>—</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#1e40af' }}>{formatGBP(model.ingestionTotalPrice)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Build CAPEX Table */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#475569' }}>Build CAPEX Line Items</h4>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Cost</th>
                <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Margin</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {model.buildLineItems?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>{item.description}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(item.cost)}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontSize: '11px' }}>{(item.margin * 100).toFixed(0)}%</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', fontSize: '11px' }}>{formatGBP(item.price)}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="4" style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>No line items available</td>
                </tr>
              )}
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #64748b', fontWeight: 'bold' }}>
                <td style={{ padding: '10px' }}>Total Build CAPEX</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{formatGBP(model.buildTotalCost)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>—</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#1e40af' }}>{formatGBP(model.buildTotalPrice)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Monthly OPEX Table */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#475569' }}>Monthly OPEX Line Items</h4>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Cost (Monthly)</th>
                <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Margin</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Price (Monthly)</th>
              </tr>
            </thead>
            <tbody>
              {model.opexLineItems?.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>{item.description}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(item.cost)}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontSize: '11px' }}>{(item.margin * 100).toFixed(0)}%</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', fontSize: '11px' }}>{formatGBP(item.price)}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="4" style={{ padding: '10px', textAlign: 'center', color: '#94a3b8' }}>No line items available</td>
                </tr>
              )}
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #64748b', fontWeight: 'bold' }}>
                <td style={{ padding: '10px' }}>Total Monthly OPEX</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{formatGBP(model.opexTotalCost)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>—</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#1e40af' }}>{formatGBP(model.opexTotalPrice)}</td>
              </tr>
              <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', fontSize: '11px', fontStyle: 'italic' }}>
                <td style={{ padding: '10px' }}>Annual OPEX (×12)</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#475569' }}>{formatGBP(model.opexAnnualCost)}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>—</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#1e40af' }}>{formatGBP(model.opexAnnualPrice)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Page 3: Cost Drivers & Key Assumptions */}
      <div className="page" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #64748b', paddingBottom: '8px' }}>
            Cost Driver Analysis & Assumptions
          </h3>
        </div>

        {/* Cost Driver Insights */}
        <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#92400e' }}>Key Cost Drivers</h4>
          <ul style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
            <li><strong>Machine costs are negligible:</strong> OCR + AI = only ~{(((model.C_OCR + model.C_LLM) / model.capexOneTimeCost) * 100).toFixed(2)}% of CAPEX cost</li>
            <li><strong>Manual review drives ingestion:</strong> {model.H_rev?.toFixed(0)} flagged hours; we bill 10% as client quote</li>
            <li><strong>Build engineering is the investment:</strong> {((model.buildTotalCost / model.capexOneTimeCost) * 100).toFixed(0)}% of CAPEX—automation, security, governance</li>
            <li><strong>OPEX is predictable:</strong> {formatGBP(model.opexAnnualPrice)}/year, scales with support hours</li>
          </ul>
        </div>

        {/* Key Assumptions Grid */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#475569' }}>Key Financial Assumptions</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>TOTAL SITES</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{inputs.nSites.toLocaleString()}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>DOCS PER SITE</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{inputs.minDocs}–{inputs.maxDocs}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>REVIEW TIME</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{inputs.reviewMinutes} min</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>DATA QUALITY (Good/Med/Poor)</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{(inputs.qGood * 100).toFixed(0)}% / {(inputs.qMed * 100).toFixed(0)}% / {(inputs.qPoor * 100).toFixed(0)}%</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>LABOR MARGIN</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{(config.laborMargin * 100).toFixed(0)}%</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>PASS-THROUGH MARGIN</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{(config.passthroughMargin * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {/* Scenario Configuration */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#475569' }}>Scenario Configuration Details</h4>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>Team Structure</td>
                <td style={{ padding: '10px', color: '#475569' }}>{config.teamType || 'Not specified'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>Build Amortization Sites</td>
                <td style={{ padding: '10px', color: '#475569' }}>{config.amortizationSites?.toLocaleString() || 'Not specified'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>Target Gross Margin</td>
                <td style={{ padding: '10px', color: '#475569' }}>{(config.targetMargin * 100).toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>Labor Margin</td>
                <td style={{ padding: '10px', color: '#475569' }}>{(config.laborMargin * 100).toFixed(0)}%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>Pass-through Margin</td>
                <td style={{ padding: '10px', color: '#475569' }}>{(config.passthroughMargin * 100).toFixed(0)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Benchmarking (Internal Analysis) */}
        <div style={{ padding: '20px', backgroundColor: '#f0f9ff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#1e40af' }}>Competitive Benchmarking (Internal)</h4>
          <div style={{ fontSize: '12px', color: '#1e3a8a', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>vs Manual Labor ({formatGBP(inputs.benchmarkManualPerDoc)}/doc):</strong> {formatGBP(model.benchManualTotal)} — Our quote is {(((model.capexOneTimePrice / model.benchManualTotal) - 1) * 100).toFixed(0)}% {model.capexOneTimePrice < model.benchManualTotal ? 'cheaper' : 'more expensive'}
            </p>
            <p>
              <strong>vs Software Vendor ({formatGBP(inputs.benchmarkCompetitorPerDoc)}/doc):</strong> {formatGBP(model.benchCompetitorTotal)} — Our quote is {(((model.capexOneTimePrice / model.benchCompetitorTotal) - 1) * 100).toFixed(0)}% {model.capexOneTimePrice < model.benchCompetitorTotal ? 'cheaper' : 'more expensive'}
            </p>
          </div>
        </div>
      </div>

      {/* Page 4: Volume Analysis & Per-Site Economics */}
      <div className="page" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #64748b', paddingBottom: '8px' }}>
            Volume Analysis & Per-Site Economics
          </h3>
        </div>

        {/* Volume Metrics Section */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#475569' }}>Document Volume Metrics</h4>

          {/* Primary Volume Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>TOTAL DOCUMENTS</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{model.N_docs.toLocaleString()}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>TOTAL PAGES</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{model.N_pages.toLocaleString()}</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' }}>AVG PAGES PER DOC</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>{model.P_doc.toFixed(1)}</div>
            </div>
          </div>

          {/* Processing Hours Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>REVIEW HOURS REQUIRED</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>{model.H_rev.toFixed(0)} hrs</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>CONFLICT RESOLUTION HOURS</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>{model.H_conflict.toFixed(0)} hrs</div>
            </div>
          </div>

          {/* Document Type Breakdown */}
          <div style={{ marginBottom: '20px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', color: '#475569' }}>Document Mix Breakdown</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>LEASE</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#166534' }}>{(inputs.mixLease * 100).toFixed(0)}%</div>
                <div style={{ fontSize: '9px', color: '#166534', marginTop: '4px' }}>{(inputs.mixLease * model.N_docs).toFixed(0)} docs</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #fbbf24', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>DEED</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#92400e' }}>{(inputs.mixDeed * 100).toFixed(0)}%</div>
                <div style={{ fontSize: '9px', color: '#92400e', marginTop: '4px' }}>{(inputs.mixDeed * model.N_docs).toFixed(0)} docs</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>LICENCE</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>{(inputs.mixLicence * 100).toFixed(0)}%</div>
                <div style={{ fontSize: '9px', color: '#1e40af', marginTop: '4px' }}>{(inputs.mixLicence * model.N_docs).toFixed(0)} docs</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #a855f7', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#6b21a8', marginBottom: '4px' }}>PLAN</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b21a8' }}>{(inputs.mixPlan * 100).toFixed(0)}%</div>
                <div style={{ fontSize: '9px', color: '#6b21a8', marginTop: '4px' }}>{(inputs.mixPlan * model.N_docs).toFixed(0)} docs</div>
              </div>
            </div>
          </div>

          {/* Quality Tier Breakdown */}
          <div>
            <h5 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', color: '#475569' }}>Data Quality Distribution</h5>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Quality Tier</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Distribution</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Review Rate</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Documents</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Review Hours</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <td style={{ padding: '10px' }}>Good Quality</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#166534' }}>{(inputs.qGood * 100).toFixed(0)}%</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#166534' }}>{(inputs.rGood * 100).toFixed(0)}%</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{(inputs.qGood * model.N_docs).toFixed(0)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{(inputs.qGood * model.N_docs * inputs.rGood * inputs.reviewMinutes / 60).toFixed(0)} hrs</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <td style={{ padding: '10px' }}>Medium Quality</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#92400e' }}>{(inputs.qMed * 100).toFixed(0)}%</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#92400e' }}>{(inputs.rMed * 100).toFixed(0)}%</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{(inputs.qMed * model.N_docs).toFixed(0)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{(inputs.qMed * model.N_docs * inputs.rMed * inputs.reviewMinutes / 60).toFixed(0)} hrs</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fee2e2' }}>
                  <td style={{ padding: '10px' }}>Poor Quality</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#991b1b' }}>{(inputs.qPoor * 100).toFixed(0)}%</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#991b1b' }}>{(inputs.rPoor * 100).toFixed(0)}%</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{(inputs.qPoor * model.N_docs).toFixed(0)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{(inputs.qPoor * model.N_docs * inputs.rPoor * inputs.reviewMinutes / 60).toFixed(0)} hrs</td>
                </tr>
                <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #64748b', fontWeight: 'bold' }}>
                  <td style={{ padding: '10px' }}>TOTAL</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>100%</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>—</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{model.N_docs.toFixed(0)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{model.H_rev.toFixed(0)} hrs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Site Economics Section */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#475569' }}>Per-Site Economics Analysis</h4>

          {/* CAPEX Per Site */}
          <div style={{ padding: '16px', backgroundColor: '#334155', color: 'white', borderRadius: '4px', marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '12px', fontWeight: 'bold' }}>CAPEX (ONE-TIME PER SITE)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '9px', color: '#cbd5e1', marginBottom: '4px' }}>Cost</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatGBP(model.capexOneTimeCost / inputs.nSites)}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#cbd5e1', marginBottom: '4px' }}>Price</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatGBP(model.capexOneTimePrice / inputs.nSites)}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#cbd5e1', marginBottom: '4px' }}>Margin</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>{capexGrossMargin.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* OPEX Per Site */}
          <div style={{ padding: '16px', backgroundColor: '#334155', color: 'white', borderRadius: '4px', marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '12px', fontWeight: 'bold' }}>OPEX (ANNUAL PER SITE)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '9px', color: '#cbd5e1', marginBottom: '4px' }}>Cost</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatGBP(model.opexAnnualCost / inputs.nSites)}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#cbd5e1', marginBottom: '4px' }}>Price</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatGBP(model.opexAnnualPrice / inputs.nSites)}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#cbd5e1', marginBottom: '4px' }}>Margin</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0' }}>{opexGrossMargin.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Per-Site Breakdown Table */}
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Metric</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Total</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Per Site</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>% of Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Ingestion CAPEX Cost</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(model.ingestionTotalCost)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>{formatGBP(model.ingestionTotalCost / inputs.nSites)}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#64748b' }}>{((model.ingestionTotalCost / model.capexOneTimeCost) * 100).toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Ingestion CAPEX Price</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#1e40af' }}>{formatGBP(model.ingestionTotalPrice)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', color: '#1e40af' }}>{formatGBP(model.ingestionTotalPrice / inputs.nSites)}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#64748b' }}>{((model.ingestionTotalPrice / model.capexOneTimePrice) * 100).toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fafafa' }}>
                <td style={{ padding: '10px' }}>Build CAPEX Cost</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(model.buildTotalCost)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>{formatGBP(model.buildTotalCost / inputs.nSites)}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#64748b' }}>{((model.buildTotalCost / model.capexOneTimeCost) * 100).toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fafafa' }}>
                <td style={{ padding: '10px' }}>Build CAPEX Price</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#1e40af' }}>{formatGBP(model.buildTotalPrice)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', color: '#1e40af' }}>{formatGBP(model.buildTotalPrice / inputs.nSites)}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#64748b' }}>{((model.buildTotalPrice / model.capexOneTimePrice) * 100).toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Annual OPEX Cost</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(model.opexAnnualCost)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>{formatGBP(model.opexAnnualCost / inputs.nSites)}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#64748b' }}>—</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Annual OPEX Price</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px', color: '#1e40af' }}>{formatGBP(model.opexAnnualPrice)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', color: '#1e40af' }}>{formatGBP(model.opexAnnualPrice / inputs.nSites)}</td>
                <td style={{ padding: '10px', textAlign: 'right', color: '#64748b' }}>—</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Key Insights Box */}
        <div style={{ padding: '20px', backgroundColor: '#f0f9ff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#1e40af' }}>Volume & Economics Key Insights</h4>
          <div style={{ fontSize: '12px', color: '#1e3a8a', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>Document Density:</strong> Average of {model.D.toFixed(1)} documents per site with {model.P_doc.toFixed(1)} pages per document
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Review Intensity:</strong> {((model.H_rev / model.N_docs) * 60).toFixed(1)} minutes average review time per document across all quality tiers
            </p>
            <p>
              <strong>Per-Site ROI:</strong> Each site generates {formatGBP((model.capexOneTimePrice - model.capexOneTimeCost) / inputs.nSites)} gross profit at {capexGrossMargin.toFixed(1)}% margin
            </p>
          </div>
        </div>
      </div>

      {/* Page 5: Resource Effort Breakdown & Labor Rates */}
      <div className="page" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #64748b', paddingBottom: '8px' }}>
            Resource Effort Breakdown & Labor Rates
          </h3>
        </div>

        {/* Build Team Resource Table */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#475569' }}>Build Team Labor Resources</h4>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Role</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Days</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Rate (£/day)</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Solution Architect</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{inputs.saDays}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(config.saRate)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', fontSize: '11px' }}>{formatGBP(inputs.saDays * config.saRate)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>ML Engineer</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{inputs.mlDays}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(config.mlRate)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', fontSize: '11px' }}>{formatGBP(inputs.mlDays * config.mlRate)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Backend Engineer</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{inputs.beDays}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(config.beRate)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', fontSize: '11px' }}>{formatGBP(inputs.beDays * config.beRate)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Frontend Engineer</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{inputs.feDays}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(config.feRate)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', fontSize: '11px' }}>{formatGBP(inputs.feDays * config.feRate)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>DevOps Engineer</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{inputs.devopsDays}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(config.devopsRate)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', fontSize: '11px' }}>{formatGBP(inputs.devopsDays * config.devopsRate)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>QA Engineer</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{inputs.qaDays}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(config.qaRate)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', fontSize: '11px' }}>{formatGBP(inputs.qaDays * config.qaRate)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Project Manager</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{inputs.pmDays}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(config.pmRate)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', fontSize: '11px' }}>{formatGBP(inputs.pmDays * config.pmRate)}</td>
              </tr>
              <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #64748b', fontWeight: 'bold' }}>
                <td style={{ padding: '10px' }} colSpan="3">Total Build Labor</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace' }}>{formatGBP(
                  inputs.saDays * config.saRate +
                  inputs.mlDays * config.mlRate +
                  inputs.beDays * config.beRate +
                  inputs.feDays * config.feRate +
                  inputs.devopsDays * config.devopsRate +
                  inputs.qaDays * config.qaRate +
                  inputs.pmDays * config.pmRate
                )}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Pen-Test (External)</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>—</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>—</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', fontSize: '11px' }}>{formatGBP(inputs.penTest)}</td>
              </tr>
              <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #64748b', fontWeight: 'bold' }}>
                <td style={{ padding: '10px' }} colSpan="3">Grand Total Build CAPEX</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px', color: '#1e40af' }}>{formatGBP(model.buildTotalCost)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Support & Operations Rates */}
        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#475569' }}>Support & Operations Rates</h4>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Resource Type</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Rate</th>
                <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Allocation</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Analyst Rate</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(config.analystRate)}/hour</td>
                <td style={{ padding: '10px', textAlign: 'right', fontSize: '11px', color: '#64748b' }}>—</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>Support Rate</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: '11px' }}>{formatGBP(inputs.supportRate)}/hour</td>
                <td style={{ padding: '10px', textAlign: 'right', fontSize: '11px', color: '#64748b' }}>—</td>
              </tr>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>Support Hours Included</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>—</td>
                <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px' }}>{inputs.supportHours} hours/month</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Build Team Notes */}
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>Resource Planning Notes</h4>
          <ul style={{ fontSize: '11px', color: '#1e3a8a', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
            <li>Labor rates reflect {config.teamType} team structure with {(config.laborMargin * 100).toFixed(0)}% margin applied</li>
            <li>Build costs are amortized across {config.amortizationSites?.toLocaleString()} sites in pricing model</li>
            <li>Pen-test is external fixed-cost security assessment conducted by third-party vendor</li>
            <li>Support hours are pooled monthly allocation; additional hours billed at support rate</li>
          </ul>
        </div>
      </div>

      {/* Page 6: Comprehensive Assumptions Appendix */}
      <div className="page" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #64748b', paddingBottom: '8px' }}>
            Comprehensive Assumptions Appendix
          </h3>
        </div>

        {/* Volume Assumptions */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: '#475569', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '4px' }}>
            Volume Assumptions
          </h4>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>Total Sites</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.nSites.toLocaleString()}</td>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>Docs per Site (Min-Max)</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.minDocs}–{inputs.maxDocs}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Document Mix - Lease</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(inputs.mixLease * 100).toFixed(1)}%</td>
                <td style={{ padding: '8px', fontWeight: '600' }}>Pages per Lease</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.pagesLease}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Document Mix - Deed</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(inputs.mixDeed * 100).toFixed(1)}%</td>
                <td style={{ padding: '8px', fontWeight: '600' }}>Pages per Deed</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.pagesDeed}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Document Mix - Licence</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(inputs.mixLicence * 100).toFixed(1)}%</td>
                <td style={{ padding: '8px', fontWeight: '600' }}>Pages per Licence</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.pagesLicence}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Document Mix - Plan</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(inputs.mixPlan * 100).toFixed(1)}%</td>
                <td style={{ padding: '8px', fontWeight: '600' }}>Pages per Plan</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.pagesPlan}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Quality Assumptions */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: '#475569', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '4px' }}>
            Quality Assumptions
          </h4>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>Good Quality Mix</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(inputs.qGood * 100).toFixed(1)}%</td>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>Good Failure Rate</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(inputs.rGood * 100).toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Medium Quality Mix</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(inputs.qMed * 100).toFixed(1)}%</td>
                <td style={{ padding: '8px', fontWeight: '600' }}>Medium Failure Rate</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(inputs.rMed * 100).toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Poor Quality Mix</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(inputs.qPoor * 100).toFixed(1)}%</td>
                <td style={{ padding: '8px', fontWeight: '600' }}>Poor Failure Rate</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(inputs.rPoor * 100).toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Processing Parameters */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: '#475569', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '4px' }}>
            Processing Parameters
          </h4>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>Review Time per Doc</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.reviewMinutes} minutes</td>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>Conflict Review Time</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.conflictMinutes} minutes</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Manual Review (Billed %)</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.ourManualReviewPct.toFixed(1)}%</td>
                <td style={{ padding: '8px', fontWeight: '600' }}></td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* AI/OCR Costs */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: '#475569', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '4px' }}>
            AI/OCR Cost Assumptions
          </h4>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>OCR Cost per 1000 Pages</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{formatGBP(inputs.ocrCostPer1000)}</td>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>LLM Cost per M Tokens</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{formatGBP(inputs.llmCostPerMTokens)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Tokens per Page</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.tokensPerPage}</td>
                <td style={{ padding: '8px', fontWeight: '600' }}>Pipeline Passes</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.pipelinePasses}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cloud Infrastructure */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: '#475569', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '4px' }}>
            Cloud Infrastructure Costs
          </h4>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>Azure Search (Monthly)</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{formatGBP(inputs.azureSearch)}</td>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>App Hosting (Monthly)</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{formatGBP(inputs.appHosting)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Monitoring (Monthly)</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{formatGBP(inputs.monitoring)}</td>
                <td style={{ padding: '8px', fontWeight: '600' }}>Storage Cost per GB/Month</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{formatGBP(inputs.costPerGBMonth)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Query Cost per 1000</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{formatGBP(inputs.costPerQuery)}</td>
                <td style={{ padding: '8px', fontWeight: '600' }}>Queries per 1000 Docs</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.queriesPer1000}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>MB per Page (Storage)</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{inputs.mbPerPage}</td>
                <td style={{ padding: '8px', fontWeight: '600' }}></td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Scenario Configuration */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px', color: '#475569', backgroundColor: '#f1f5f9', padding: '8px', borderRadius: '4px' }}>
            Scenario Configuration - {config.name}
          </h4>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>Labor Margin</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(config.laborMargin * 100).toFixed(1)}%</td>
                <td style={{ padding: '8px', fontWeight: '600', width: '35%' }}>Pass-through Margin</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(config.passthroughMargin * 100).toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Target Gross Margin</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{(config.targetMargin * 100).toFixed(1)}%</td>
                <td style={{ padding: '8px', fontWeight: '600' }}>Amortization Sites</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{config.amortizationSites?.toLocaleString()}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px', fontWeight: '600' }}>Team Structure</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }} colSpan="3">{config.teamType || 'Not specified'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Appendix Footer Note */}
        <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #fbbf24', borderRadius: '6px' }}>
          <p style={{ fontSize: '10px', color: '#78350f', margin: 0, lineHeight: '1.5' }}>
            <strong>Assumptions Audit Trail:</strong> All assumptions documented above are used in the financial model calculations.
            Changes to any parameter will recalculate costs, pricing, and margins. Refer to ASSUMPTIONS_AUDIT_TRAIL.md for detailed
            parameter definitions and procurement guidance.
          </p>
        </div>
      </div>
    </>
  );

  // ========================================
  // ROM REPORT VARIANT (Client-Facing)
  // ========================================
  const ROMReport = () => {
    // ROM ranges for High/Medium/Low quality - CAPEX and OPEX reported separately
    // Note: CAPEX is one-time, OPEX is annual recurring cost

    // Calculate ROI positioning metrics (comparing CAPEX only - one-time cost)
    const avgDocs = (inputs.minDocs + inputs.maxDocs) / 2;
    const totalDocs = inputs.nSites * avgDocs;
    const manualCostPerDoc = inputs.benchmarkManualPerDoc;
    const manualTotalCost = totalDocs * manualCostPerDoc;
    const romMediumCapexSavingsPercent = ((manualTotalCost - romMedium.capexOneTimePrice) / manualTotalCost) * 100;

    // Calculate review hours for each scenario
    const calcReviewHours = (qGood, qMed, qPoor) => {
      const flaggedDocs = totalDocs * (qGood * 0 + qMed * 0.5 + qPoor * 1.0);
      return (flaggedDocs * inputs.reviewMinutes) / 60;
    };

    const romHighReviewHours = calcReviewHours(0.60, 0.30, 0.10);
    const romMediumReviewHours = calcReviewHours(0.50, 0.35, 0.15);
    const romLowReviewHours = calcReviewHours(0.35, 0.40, 0.25);

    // Calculate cost driver percentages for display
    const totalPrice = model.capexOneTimePrice + model.opexAnnualPrice;
    const buildPercent = ((model.buildTotalPrice / totalPrice) * 100).toFixed(0);
    const reviewPercent = ((model.ingestionTotalPrice / totalPrice) * 100).toFixed(0);
    const opexPercent = ((model.opexAnnualPrice / totalPrice) * 100).toFixed(0);

    return (
      <>
        {/* Page 1: ROM Quote */}
        <div className="page" style={{ padding: '40px' }}>
          <ReportHeader />

          {/* Executive Summary */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b', borderBottom: '2px solid #64748b', paddingBottom: '8px' }}>
              Executive Summary
            </h3>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569' }}>
              <p style={{ marginBottom: '12px' }}>
                This Rough Order of Magnitude (ROM) quote provides estimated pricing ranges for the Cornerstone AI document processing platform based on data quality assumptions.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>ROI Positioning:</strong> AI-powered automation reduces manual processing costs by approximately {romMediumCapexSavingsPercent.toFixed(0)}%. Typical manual abstraction costs {formatGBP(manualCostPerDoc)}/document ({formatGBP(manualTotalCost)} total for {totalDocs.toLocaleString()} documents), while our AI solution delivers comparable results at a fraction of the cost.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Scope:</strong> {inputs.nSites.toLocaleString()} sites with {inputs.minDocs}–{inputs.maxDocs} documents per site
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Risk Mitigation:</strong> Pricing ranges reflect uncertainty around source data quality. Lower quality data requires more manual review and validation, which drives higher costs. Final pricing will be refined after document sampling during discovery phase.
              </p>
              <p>
                <strong>Confidence Levels:</strong> High Quality scenario (70% confidence | best-case), Medium Quality scenario (85% confidence | most likely), Low Quality scenario (60% confidence | worst-case with mitigation strategies)
              </p>
            </div>
          </div>

          {/* Data Quality Impact Note */}
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '4px' }}>
            <p style={{ fontSize: '13px', color: '#0c4a6e', margin: 0, lineHeight: '1.6' }}>
              <strong>📊 What Affects Final Price:</strong> Data quality impacts review effort. Clean documents require minimal validation; degraded or inconsistent documents need more manual review. The discovery phase will sample your documents to refine pricing. Machine costs (OCR/AI) are negligible — labor for document review drives the range.
            </p>
          </div>

          {/* ROM Pricing for Selected Scenario */}
          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b', textTransform: 'capitalize' }}>
              {scenario} Scenario
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
              Estimated ranges based on key assumptions (subject to detailed discovery)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {/* Initial Setup */}
              <div style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Initial Setup</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>One-time CAPEX</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', fontFamily: 'monospace', color: '#1e293b', marginBottom: '8px' }}>
                  {formatROMRange(model.capexOneTimePrice)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>Estimated range (±15%)</div>
              </div>

              {/* Ongoing Costs */}
              <div style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ongoing Costs</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>Monthly OPEX</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', fontFamily: 'monospace', color: '#1e293b', marginBottom: '4px' }}>
                  {formatROMRange(model.opexTotalPrice)}
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                  {formatROMRange(model.opexAnnualPrice)}/year
                </div>
              </div>
            </div>

            {/* Scope of Work */}
            <div style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>Scope of Work</div>
              <ul style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8', margin: 0, paddingLeft: '20px', listStyleType: 'disc' }}>
                <li>Document ingestion, OCR processing, and AI extraction for {inputs.nSites.toLocaleString()} sites</li>
                <li>Custom platform build including search, reconciliation, and audit capabilities</li>
                <li>Ongoing platform support and maintenance ({inputs.supportHours} hours/month)</li>
                <li>Data quality monitoring and optimization</li>
              </ul>
            </div>
          </div>

          {/* Cost Driver Breakdown */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Where Your Investment Goes</h4>

            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7', marginBottom: '20px' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px', marginRight: '8px' }}></div>
                  <strong style={{ color: '#1e293b' }}>Platform Development (~{buildPercent}%)</strong>
                </div>
                <p style={{ margin: '0 0 0 20px', fontSize: '12px' }}>One-time investment in custom platform build, security hardening, and testing</p>
              </div>

              <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px', marginRight: '8px' }}></div>
                  <strong style={{ color: '#1e293b' }}>Document Review (~{reviewPercent}%)</strong>
                </div>
                <p style={{ margin: '0 0 0 20px', fontSize: '12px' }}>Scales with data quality — better documents = lower review effort</p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '2px', marginRight: '8px' }}></div>
                  <strong style={{ color: '#1e293b' }}>Annual Operations (~{opexPercent}%)</strong>
                </div>
                <p style={{ margin: '0 0 0 20px', fontSize: '12px' }}>Predictable ongoing costs — infrastructure, support, and maintenance</p>
              </div>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px' }}>
              <p style={{ fontSize: '12px', color: '#1e40af', margin: 0, lineHeight: '1.6' }}>
                <strong>Key Insight:</strong> Infrastructure costs (OCR/AI) are minimal. The investment is primarily in platform development and quality assurance labor. Better source data means less review effort and lower total cost.
              </p>
            </div>
          </div>

          {/* Scope Overview */}
          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>What's Included</h4>
            <ul style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Full document lifecycle management</strong> for {inputs.nSites.toLocaleString()} sites
                <ul style={{ fontSize: '12px', marginTop: '4px', paddingLeft: '20px' }}>
                  <li>End-to-end orchestration from source systems to searchable repository</li>
                  <li>Automated document classification and routing</li>
                </ul>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Advanced OCR and AI-powered extraction</strong> with quality assurance
                <ul style={{ fontSize: '12px', marginTop: '4px', paddingLeft: '20px' }}>
                  <li>95%+ accuracy target with human-in-loop quality assurance</li>
                  <li>Confidence scoring and automated flagging for review</li>
                  <li>Multi-model AI approach optimized for document complexity</li>
                </ul>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Custom-built platform</strong> with search, filtering, and reconciliation tools
                <ul style={{ fontSize: '12px', marginTop: '4px', paddingLeft: '20px' }}>
                  <li>Azure Cognitive Search integration for sub-second queries</li>
                  <li>Advanced filtering by site, document type, date range, and extracted fields</li>
                  <li>Cross-document conflict detection and resolution workflows</li>
                </ul>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Security, compliance, and audit trail</strong> capabilities
                <ul style={{ fontSize: '12px', marginTop: '4px', paddingLeft: '20px' }}>
                  <li>SSO/MFA authentication and role-based access control</li>
                  <li>Full audit logging of all user actions and data changes</li>
                  <li>Security hardening and penetration testing included</li>
                </ul>
              </li>
              <li>
                <strong>Dedicated support</strong> ({inputs.supportHours} hours/month included)
                <ul style={{ fontSize: '12px', marginTop: '4px', paddingLeft: '20px' }}>
                  <li>Technical support for platform operations and troubleshooting</li>
                  <li>Minor enhancements and bug fixes within support allowance</li>
                  <li>Monthly health checks and performance monitoring</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Important Note */}
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '0', overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>Important Notes</div>
            <ul style={{ fontSize: '11px', color: '#1e3a8a', lineHeight: '1.6', margin: 0, paddingLeft: '20px', marginBottom: 0 }}>
              <li>Pricing ranges reflect different data quality assumptions</li>
              <li>Actual pricing will be refined based on detailed requirements gathering</li>
              <li>Quote valid for 30 days from issue date</li>
              <li>Next step: Schedule discovery call to validate assumptions and scope</li>
            </ul>
          </div>

        </div>
      </>
    );
  };

  // ========================================
  // DETAILED QUOTE REPORT VARIANT (Client-Facing)
  // ========================================
  const DetailedQuoteReport = () => {
    return (
      <>
        {/* Page 1: Quote Summary & Pricing */}
        <div className="page" style={{ padding: '40px' }}>
          <ReportHeader />

          {/* Executive Summary */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b', borderBottom: '2px solid #8b5cf6', paddingBottom: '8px' }}>
              Project Quote Summary
            </h3>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569' }}>
              <p style={{ marginBottom: '12px' }}>
                This detailed quote provides comprehensive pricing for the Cornerstone AI document processing platform deployment across {inputs.nSites.toLocaleString()} sites.
              </p>
            </div>
          </div>

          {/* Investment Breakdown */}
          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' }}>Investment Breakdown</h4>

            {/* Initial Setup (CAPEX) */}
            <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>Initial Platform Setup</div>
                  <div style={{ fontSize: '11px', color: '#1e40af' }}>One-time CAPEX investment</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>{formatGBP(model.capexOneTimePrice)}</div>
              </div>
              <div style={{ paddingTop: '12px', borderTop: '1px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#1e40af' }}>Document ingestion & processing infrastructure</span>
                  <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{formatGBP(model.ingestionTotalPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#1e40af' }}>Custom platform development & deployment</span>
                  <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{formatGBP(model.buildTotalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Ongoing Operations (OPEX) */}
            <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>Monthly Operations</div>
                  <div style={{ fontSize: '11px', color: '#166534' }}>Recurring OPEX for platform support & infrastructure</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>{formatGBP(model.opexTotalPrice)}/mo</div>
              </div>
              <div style={{ paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#166534' }}>Cloud infrastructure & storage</span>
                  <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{formatGBP(model.opexTotalPrice * 0.4)}/mo</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                  <span style={{ color: '#166534' }}>Platform support & maintenance</span>
                  <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{formatGBP(model.opexTotalPrice * 0.6)}/mo</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #cbd5e1', fontSize: '11px', fontStyle: 'italic' }}>
                  <span style={{ color: '#166534' }}>Annual OPEX (12 months)</span>
                  <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{formatGBP(model.opexAnnualPrice)}</span>
                </div>
              </div>
            </div>

            {/* Investment Summary - CAPEX and OPEX Separate */}
            <div style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>One-Time Implementation (CAPEX)</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>{formatGBP(model.capexOneTimePrice)}</div>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534', marginBottom: '8px' }}>Ongoing Operations (OPEX)</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>{formatGBP(model.opexAnnualPrice)}/year</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{formatGBP(model.opexTotalPrice)}/month</div>
              </div>
            </div>
          </div>

          </div>

        {/* Page 2: Scope & Assumptions */}
        <div className="page" style={{ padding: '40px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #8b5cf6', paddingBottom: '8px' }}>
              Scope of Work & Assumptions
            </h3>
          </div>

          {/* What's Included */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>What's Included in This Quote</h4>
            <ul style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
              <li><strong>Document Ingestion:</strong> Full OCR processing and AI-powered data extraction for all documents across {inputs.nSites.toLocaleString()} sites</li>
              <li><strong>Quality Assurance:</strong> Automated flagging and human-in-the-loop review for data quality verification</li>
              <li><strong>Platform Development:</strong> Custom-built search, filtering, reconciliation, and reporting tools</li>
              <li><strong>Security & Compliance:</strong> SSO/MFA authentication, role-based access control, audit logging, and security hardening</li>
              <li><strong>Cross-document Reasoning:</strong> AI-powered conflict detection and multi-document analysis</li>
              <li><strong>API & Integration:</strong> RESTful API for system integration and data export</li>
              <li><strong>Support & Maintenance:</strong> {inputs.supportHours} hours/month dedicated support included in OPEX</li>
              <li><strong>Cloud Infrastructure:</strong> Azure hosting, storage, search services, and monitoring</li>
            </ul>
          </div>

          {/* Key Assumptions */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Key Assumptions</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>TOTAL SITES</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{inputs.nSites.toLocaleString()}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>DOCUMENTS PER SITE</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{inputs.minDocs}–{inputs.maxDocs}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>DOCUMENT MIX</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Lease {(inputs.mixLease * 100).toFixed(0)}% | Deed {(inputs.mixDeed * 100).toFixed(0)}% | Licence {(inputs.mixLicence * 100).toFixed(0)}% | Plan {(inputs.mixPlan * 100).toFixed(0)}%</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>DATA QUALITY MIX</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Good {(inputs.qGood * 100).toFixed(0)}% | Medium {(inputs.qMed * 100).toFixed(0)}% | Poor {(inputs.qPoor * 100).toFixed(0)}%</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>REVIEW TIME</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{inputs.reviewMinutes} minutes per document</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>SUPPORT HOURS</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{inputs.supportHours} hours/month</div>
              </div>
            </div>
          </div>

          {/* What's NOT Included */}
          <div style={{ marginBottom: '32px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#92400e' }}>What's NOT Included</h4>
            <ul style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
              <li>Additional support hours beyond {inputs.supportHours} hours/month allowance</li>
              <li>Custom integrations with client legacy systems (quoted separately if required)</li>
              <li>Data migration assistance beyond initial ingestion setup</li>
              <li>Scope changes or additional sites beyond {inputs.nSites.toLocaleString()} sites</li>
            </ul>
          </div>

          {/* Terms & Next Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>Quote Validity</h4>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>This quote is valid for 30 days from issue date. Pricing subject to change based on detailed requirements gathering.</p>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>Next Steps</h4>
              <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>Schedule a discovery call to validate assumptions, discuss implementation timeline, and finalize project scope.</p>
            </div>
          </div>

          </div>

        {/* Page 3: Implementation Timeline & Deliverables */}
        <div className="page" style={{ padding: '40px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #8b5cf6', paddingBottom: '8px' }}>
              Implementation Timeline & Deliverables
            </h3>
          </div>

          {/* Implementation Timeline */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Project Timeline</h4>

            {/* Phase 1 */}
            <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderLeft: '3px solid #64748b', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af' }}>Phase 1: Discovery & Planning</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>2-3 weeks</div>
              </div>
              <ul style={{ fontSize: '12px', color: '#1e3a8a', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
                <li>Requirements gathering and stakeholder interviews</li>
                <li>Data quality assessment and document sampling</li>
                <li>Architecture design and technical specification</li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #10b981', borderLeft: '3px solid #cbd5e1', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#166534' }}>Phase 2: Platform Build</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>8-12 weeks</div>
              </div>
              <ul style={{ fontSize: '12px', color: '#166534', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
                <li>OCR and AI extraction pipeline development</li>
                <li>Custom platform development (search, filtering, reconciliation)</li>
                <li>Security implementation (SSO/MFA, RBAC, audit logging)</li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #fbbf24', borderLeft: '3px solid #cbd5e1', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>Phase 3: Data Ingestion</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e' }}>4-6 weeks</div>
              </div>
              <ul style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
                <li>Document processing and OCR execution</li>
                <li>Quality assurance and validation workflows</li>
                <li>Data reconciliation and accuracy verification</li>
              </ul>
            </div>

            {/* Phase 4 */}
            <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #a855f7', borderLeft: '3px solid #cbd5e1', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b21a8' }}>Phase 4: Deployment & Training</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b21a8' }}>2-3 weeks</div>
              </div>
              <ul style={{ fontSize: '12px', color: '#6b21a8', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
                <li>Production deployment and system cutover</li>
                <li>User training and documentation handover</li>
                <li>Final acceptance testing and sign-off</li>
              </ul>
            </div>

            {/* Total Timeline */}
            <div style={{ padding: '12px', backgroundColor: '#1e293b', color: 'white', borderRadius: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Total Project Timeline: 16-24 weeks</span>
            </div>
          </div>

          {/* Key Deliverables */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Key Deliverables</h4>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <ul style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8', margin: 0, paddingLeft: '0', listStyle: 'none' }}>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 'bold', marginRight: '8px' }}>✓</span>
                  <strong>Fully functional document processing platform</strong>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 'bold', marginRight: '8px' }}>✓</span>
                  <strong>Ingested and validated data for all {inputs.nSites.toLocaleString()} sites</strong>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 'bold', marginRight: '8px' }}>✓</span>
                  <strong>User documentation and training materials</strong>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 'bold', marginRight: '8px' }}>✓</span>
                  <strong>API documentation and integration guides</strong>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: 'bold', marginRight: '8px' }}>✓</span>
                  <strong>Security audit and compliance certification</strong>
                </li>
                <li>
                  <span style={{ color: '#64748b', fontWeight: 'bold', marginRight: '8px' }}>✓</span>
                  <strong>12 months platform support and maintenance</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Success Metrics */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Success Metrics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', marginBottom: '4px' }}>DATA EXTRACTION ACCURACY</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>95%+ target</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>PLATFORM UPTIME SLA</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>99.5%</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>QUERY RESPONSE TIME</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>&lt;2 seconds</div>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b21a8', marginBottom: '4px' }}>SUPPORT RESPONSE TIME</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b21a8' }}>&lt;4 hours</div>
                <div style={{ fontSize: '10px', color: '#6b21a8', marginTop: '4px' }}>for critical issues</div>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#92400e' }}>Payment Terms</h4>

            {/* Milestone-based payments */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#78350f', marginBottom: '12px' }}>Milestone-Based Payment Structure:</div>
              <div style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #cbd5e1' }}>
                  <span>1. Upon contract signing</span>
                  <span style={{ fontWeight: 'bold' }}>20% ({formatGBP(model.capexOneTimePrice * 0.20)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #cbd5e1' }}>
                  <span>2. Upon completion of Platform Build phase</span>
                  <span style={{ fontWeight: 'bold' }}>30% ({formatGBP(model.capexOneTimePrice * 0.30)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #cbd5e1' }}>
                  <span>3. Upon completion of Data Ingestion</span>
                  <span style={{ fontWeight: 'bold' }}>30% ({formatGBP(model.capexOneTimePrice * 0.30)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #cbd5e1' }}>
                  <span>4. Upon final acceptance</span>
                  <span style={{ fontWeight: 'bold' }}>20% ({formatGBP(model.capexOneTimePrice * 0.20)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', paddingTop: '8px', borderTop: '2px solid #92400e' }}>
                  <span>Total CAPEX</span>
                  <span>{formatGBP(model.capexOneTimePrice)}</span>
                </div>
              </div>
            </div>

            {/* OPEX billing */}
            <div style={{ fontSize: '12px', color: '#78350f', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
              <strong>Monthly OPEX billing:</strong> Begins after go-live at {formatGBP(model.opexTotalPrice)}/month
            </div>
          </div>

        </div>
      </>
    );
  };

  // Render the appropriate report variant
  return (
    <div className="professional-report bg-white text-slate-900">
      {reportVariant === 'INTERNAL' && <InternalReport />}
      {reportVariant === 'ROM' && <ROMReport />}
      {reportVariant === 'DETAILED_QUOTE' && <DetailedQuoteReport />}

      {/* Print Styles */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
            float: none !important;
          }
          html, body {
            height: initial !important;
            overflow: initial !important;
            margin: 0;
            padding: 0;
          }
          .professional-report {
            display: block;
          }
          /* Page setup with proper margins */
          @page {
            size: A4;
            margin: 20mm; /* Ensures margins on all printed pages */
          }
          .page {
            width: 100%;
            padding: 0 !important; /* Remove padding - @page margins handle spacing */
            box-sizing: border-box;
            page-break-after: auto;
            page-break-inside: auto;
          }
          /* Force page break between .page sections */
          .page + .page {
            page-break-before: always;
            break-before: always;
          }
          /* Keep component sections together */
          .page > div {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 16px;
          }
          /* Tables can span pages but keep rows together */
          table {
            page-break-inside: auto;
            break-inside: auto;
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 16px;
          }
          thead {
            display: table-header-group;
          }
          tbody {
            display: table-row-group;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Keep headers with following content */
          h3, h4, h5 {
            page-break-after: avoid;
            break-after: avoid;
            margin-top: 20px;
            margin-bottom: 12px;
          }
          /* First heading on page shouldn't have top margin */
          .page > div:first-child h3,
          .page > div:first-child h4 {
            margin-top: 0;
          }
        }

        @media screen {
          .professional-report {
            display: none; /* Hidden on screen, only shown in print */
          }
        }
      `}</style>
    </div>
  );
});

export default ProfessionalReport;
