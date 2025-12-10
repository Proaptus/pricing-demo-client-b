import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

/**
 * ClientQuoteSummary Component
 *
 * Displays professional client-facing quotes in two formats:
 * - SHORT ROM (Rough Order of Magnitude): Quick quote without assumptions
 * - DETAILED QUOTE: Full quote with key assumptions and scope details
 *
 * @param {Object} props - Component props
 * @param {Object} props.model - Calculated pricing model data
 * @param {Function} props.formatGBP - Currency formatting function
 * @param {Object} props.inputs - User input parameters for assumptions display
 * @param {string} props.scenario - Current pricing scenario
 */
const ClientQuoteSummary = ({ model, formatGBP, inputs, scenario }) => {
  const [quoteVariant, setQuoteVariant] = useState('short'); // 'short' or 'detailed'
  const [expandedAssumptions, setExpandedAssumptions] = useState(false);

  // Helper function to round to nearest 5k
  const roundTo = (num, divisor = 5000) => {
    return Math.round(num / divisor) * divisor;
  };

  // Calculate key metrics for display
  const capexPrice = model.capexOneTimePrice;
  const monthlyOpexPrice = model.opexTotalPrice; // opexTotalPrice is monthly, opexAnnualPrice is yearly
  const annualOpexPrice = model.opexAnnualPrice;

  // ROM Quote ranges (±15% with rounding for conservative estimate)
  const capexLow = roundTo(capexPrice * 0.85);
  const capexHigh = roundTo(capexPrice * 1.15);
  const monthlyOpexLow = roundTo(monthlyOpexPrice * 0.85, 500);
  const monthlyOpexHigh = roundTo(monthlyOpexPrice * 1.15, 500);
  const annualOpexLow = monthlyOpexLow * 12;
  const annualOpexHigh = monthlyOpexHigh * 12;

  // Scenario display info
  const scenarioNames = {
    conservative: 'Conservative',
    standard: 'Standard',
    aggressive: 'Aggressive'
  };

  // Key assumptions to display
  const keyAssumptions = [
    { label: 'Total Sites', value: inputs.nSites.toLocaleString() },
    { label: 'Documents per Site', value: `${inputs.minDocs}-${inputs.maxDocs}` },
    { label: 'Document Mix', value: `Lease ${(inputs.mixLease * 100).toFixed(0)}% / Deed ${(inputs.mixDeed * 100).toFixed(0)}% / Licence ${(inputs.mixLicence * 100).toFixed(0)}% / Plan ${(inputs.mixPlan * 100).toFixed(0)}%` },
    { label: 'Data Quality', value: `Good ${(inputs.qGood * 100).toFixed(0)}% / Medium ${(inputs.qMed * 100).toFixed(0)}% / Poor ${(inputs.qPoor * 100).toFixed(0)}%` },
    { label: 'Review Time per Document', value: `${inputs.reviewMinutes} minutes` },
    { label: 'Conflict Resolution Time', value: `${inputs.conflictMinutes} minutes` },
  ];

  // ===== SHORT ROM QUOTE =====
  const ShortQuote = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b-2 border-blue-200 pb-4">
        <p className="text-sm text-slate-600 mb-2">Rough Order of Magnitude - Professional Services</p>
        <h3 className="text-2xl font-bold text-slate-900">{scenarioNames[scenario]} Scenario</h3>
        <p className="text-xs text-slate-500 mt-1">Estimated ranges based on key assumptions (subject to detailed discovery)</p>
      </div>

      {/* Key Pricing - RANGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CAPEX */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Initial Setup</div>
          <div className="text-sm text-slate-600 mb-3">One-time CAPEX</div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900">{formatGBP(capexLow)} – {formatGBP(capexHigh)}</div>
            <div className="text-xs text-slate-600">Estimated range (±15%)</div>
          </div>
        </div>

        {/* Monthly OPEX */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Ongoing Costs</div>
          <div className="text-sm text-slate-600 mb-3">Monthly OPEX</div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900">{formatGBP(monthlyOpexLow)} – {formatGBP(monthlyOpexHigh)}</div>
            <div className="text-xs text-slate-600">{formatGBP(annualOpexLow)} – {formatGBP(annualOpexHigh)}/year</div>
          </div>
        </div>

      </div>

      {/* Scope Summary */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Scope of Work</h4>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5">•</span>
            <span>Document ingestion, OCR processing, and AI extraction for {inputs.nSites.toLocaleString()} sites</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5">•</span>
            <span>Custom platform build including search, reconciliation, and audit capabilities</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5">•</span>
            <span>Ongoing platform support and maintenance ({inputs.supportHours} hours/month)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5">•</span>
            <span>Data quality monitoring and optimization</span>
          </li>
        </ul>
      </div>

      {/* Cost Driver Breakdown */}
      <div className="mt-6 p-4 bg-white rounded-lg border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-4">Where Your Investment Goes</h4>

        {(() => {
          // Calculate cost driver percentages
          const totalPrice = capexPrice + annualOpexPrice;
          const buildPercent = ((model.buildTotalPrice / totalPrice) * 100).toFixed(0);
          const reviewPercent = ((model.ingestionTotalPrice / totalPrice) * 100).toFixed(0);
          const opexPercent = ((annualOpexPrice / totalPrice) * 100).toFixed(0);

          const costDriverData = [
            { name: 'Platform Development', value: parseFloat(buildPercent), label: `${buildPercent}%` },
            { name: 'Document Review', value: parseFloat(reviewPercent), label: `${reviewPercent}%` },
            { name: 'Annual Operations', value: parseFloat(opexPercent), label: `${opexPercent}%` }
          ];

          const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Pie Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costDriverData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costDriverData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Cost Driver Explanations */}
              <div className="space-y-4 text-sm">
                <div className="pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                    <span className="font-semibold text-slate-900">Platform Development (~{buildPercent}%)</span>
                  </div>
                  <p className="text-slate-600 text-xs ml-5">One-time investment in custom platform build, security hardening, and testing</p>
                </div>

                <div className="pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                    <span className="font-semibold text-slate-900">Document Review (~{reviewPercent}%)</span>
                  </div>
                  <p className="text-slate-600 text-xs ml-5">Scales with data quality — better documents = lower review effort</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
                    <span className="font-semibold text-slate-900">Annual Operations (~{opexPercent}%)</span>
                  </div>
                  <p className="text-slate-600 text-xs ml-5">Predictable ongoing costs — infrastructure, support, and maintenance</p>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <strong>Key Insight:</strong> Infrastructure costs (OCR/AI) are minimal. The investment is primarily in platform development and quality assurance labor. Better source data means less review effort and lower total cost.
        </div>
      </div>
    </div>
  );

  // ===== DETAILED QUOTE =====
  const DetailedQuote = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-2 border-blue-200 pb-4">
        <p className="text-sm text-slate-600 mb-2">Professional Services Quote</p>
        <h3 className="text-2xl font-bold text-slate-900">{scenarioNames[scenario]} Scenario</h3>
        <p className="text-sm text-slate-600 mt-2">Complete pricing breakdown with key assumptions</p>
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-3">
        <h4 className="font-semibold text-slate-900">Investment Summary</h4>

        {/* CAPEX Section */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-200 p-4">
            <div className="flex justify-between items-baseline">
              <div className="font-semibold text-slate-900">Initial Platform Setup (CAPEX)</div>
              <div className="text-2xl font-bold text-blue-700">{formatGBP(capexPrice)}</div>
            </div>
            <div className="text-sm text-slate-600 mt-1">One-time investment for platform development and initial deployment</div>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-700">• Document ingestion & processing infrastructure</span>
              <span className="text-slate-600">{formatGBP(model.ingestionTotalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">• Custom platform development & deployment</span>
              <span className="text-slate-600">{formatGBP(model.buildTotalPrice)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-900">Total CAPEX</span>
              <span className="font-bold text-blue-700">{formatGBP(capexPrice)}</span>
            </div>
          </div>
        </div>

        {/* OPEX Section */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-green-50 border-b border-green-200 p-4">
            <div className="flex justify-between items-baseline">
              <div className="font-semibold text-slate-900">Monthly Operations (OPEX)</div>
              <div className="text-2xl font-bold text-green-700">{formatGBP(monthlyOpexPrice)}/month</div>
            </div>
            <div className="text-sm text-slate-600 mt-1">Recurring monthly cost for platform support, monitoring, and storage</div>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-700">• Cloud infrastructure & storage</span>
              <span className="text-slate-600">{formatGBP(model.opexTotalPrice / 12 * 0.4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">• Platform support & maintenance</span>
              <span className="text-slate-600">{formatGBP(model.opexTotalPrice / 12 * 0.6)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-900">Total Monthly OPEX</span>
              <span className="font-bold text-green-700">{formatGBP(monthlyOpexPrice)}</span>
            </div>
            <div className="flex justify-between text-slate-600 italic">
              <span>Annual OPEX (12 months)</span>
              <span>{formatGBP(annualOpexPrice)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Key Assumptions - Collapsible */}
      <div className="border rounded-lg">
        <button
          onClick={() => setExpandedAssumptions(!expandedAssumptions)}
          className="w-full px-4 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200"
        >
          <h4 className="font-semibold text-slate-900">Key Assumptions & Scope</h4>
          <ChevronDown
            size={20}
            className={`text-slate-600 transition-transform ${expandedAssumptions ? 'rotate-180' : ''}`}
          />
        </button>

        {expandedAssumptions && (
          <div className="p-4 space-y-4">
            {/* Assumptions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {keyAssumptions.map((assumption, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    {assumption.label}
                  </div>
                  <div className="text-sm text-slate-900 font-medium">{assumption.value}</div>
                </div>
              ))}
            </div>

            {/* Scope Details */}
            <div className="pt-4 border-t border-slate-200">
              <h5 className="font-semibold text-slate-900 mb-3">What's Included</h5>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Full document lifecycle management for {inputs.nSites.toLocaleString()} sites</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Advanced OCR and AI-powered extraction with quality assurance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Custom-built platform with search, filtering, and reconciliation tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Security, compliance, and audit trail capabilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">✓</span>
                  <span>Dedicated support ({inputs.supportHours} hours/month included)</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Not Included Section */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-3">What's Not Included</h4>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold mt-0.5">•</span>
            <span>Additional support hours beyond the {inputs.supportHours} hours/month allowance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold mt-0.5">•</span>
            <span>Custom integrations with client legacy systems</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold mt-0.5">•</span>
            <span>Data migration assistance beyond initial ingestion setup</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 font-bold mt-0.5">•</span>
            <span>Scope changes or additional sites beyond {inputs.nSites.toLocaleString()}</span>
          </li>
        </ul>
      </div>

      {/* Terms & Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2">Quote Valid</h4>
          <p className="text-sm text-slate-700">30 days from issue date</p>
          <p className="text-xs text-slate-600 mt-2">Assumptions subject to change based on detailed requirements gathering</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-2">Next Steps</h4>
          <p className="text-sm text-slate-700">Schedule discovery call to validate assumptions and discuss timeline</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-slate-200">
      {/* Quote Type Selector */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Professional Quote</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setQuoteVariant('short')}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
              quoteVariant === 'short'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ROM Quote
          </button>
          <button
            onClick={() => setQuoteVariant('detailed')}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
              quoteVariant === 'detailed'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Detailed Quote
          </button>
        </div>
      </div>

      {/* Quote Content */}
      <div>
        {quoteVariant === 'short' ? <ShortQuote /> : <DetailedQuote />}
      </div>
    </div>
  );
};

export default ClientQuoteSummary;
