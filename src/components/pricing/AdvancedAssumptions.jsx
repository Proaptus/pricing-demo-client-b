import React from 'react';

/**
 * AdvancedAssumptions Component
 *
 * Displays advanced input fields organized into sections:
 * - Volume & Documents (document mix, pages per type)
 * - Quality Distribution (quality percentages, review rates)
 * - Unit Costs (OCR, AI Extraction configuration)
 * - Build Team Days (development team effort)
 * - OPEX Assumptions (monthly operational costs)
 * - Competitive Benchmarks (manual and competitor pricing)
 *
 * @param {Object} props
 * @param {Object} props.inputs - Current input values
 * @param {Function} props.setInputs - Function to update input values
 * @param {boolean} props.showAdvanced - Whether this section is visible
 */
const AdvancedAssumptions = ({ inputs, setInputs, showAdvanced }) => {
  if (!showAdvanced) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 space-y-6">
      {/* Volume & Documents */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Volume & Documents</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Lease Mix</label>
            <input
              type="number"
              step={0.01}
              value={inputs.mixLease}
              onChange={(e) => setInputs(prev => ({ ...prev, mixLease: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Deed Mix</label>
            <input
              type="number"
              step={0.01}
              value={inputs.mixDeed}
              onChange={(e) => setInputs(prev => ({ ...prev, mixDeed: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Licence Mix</label>
            <input
              type="number"
              step={0.01}
              value={inputs.mixLicence}
              onChange={(e) => setInputs(prev => ({ ...prev, mixLicence: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Plan Mix</label>
            <input
              type="number"
              step={0.01}
              value={inputs.mixPlan}
              onChange={(e) => setInputs(prev => ({ ...prev, mixPlan: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Lease Pages</label>
            <input
              type="number"
              value={inputs.pagesLease}
              onChange={(e) => setInputs(prev => ({ ...prev, pagesLease: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Deed Pages</label>
            <input
              type="number"
              value={inputs.pagesDeed}
              onChange={(e) => setInputs(prev => ({ ...prev, pagesDeed: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Licence Pages</label>
            <input
              type="number"
              value={inputs.pagesLicence}
              onChange={(e) => setInputs(prev => ({ ...prev, pagesLicence: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Plan Pages</label>
            <input
              type="number"
              value={inputs.pagesPlan}
              onChange={(e) => setInputs(prev => ({ ...prev, pagesPlan: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Quality Distribution */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Quality Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Good Quality %</label>
            <input
              type="number"
              step={0.01}
              value={inputs.qGood}
              onChange={(e) => setInputs(prev => ({ ...prev, qGood: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Medium Quality %</label>
            <input
              type="number"
              step={0.01}
              value={inputs.qMed}
              onChange={(e) => setInputs(prev => ({ ...prev, qMed: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Poor Quality %</label>
            <input
              type="number"
              step={0.01}
              value={inputs.qPoor}
              onChange={(e) => setInputs(prev => ({ ...prev, qPoor: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Review Rate Good</label>
            <input
              type="number"
              step={0.01}
              value={inputs.rGood}
              onChange={(e) => setInputs(prev => ({ ...prev, rGood: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Review Rate Medium</label>
            <input
              type="number"
              step={0.01}
              value={inputs.rMed}
              onChange={(e) => setInputs(prev => ({ ...prev, rMed: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Review Rate Poor</label>
            <input
              type="number"
              step={0.01}
              value={inputs.rPoor}
              onChange={(e) => setInputs(prev => ({ ...prev, rPoor: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Conflict Mins/Site</label>
            <input
              type="number"
              value={inputs.conflictMinutes}
              onChange={(e) => setInputs(prev => ({ ...prev, conflictMinutes: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Our Manual Review %</label>
            <input
              type="number"
              value={inputs.ourManualReviewPct}
              onChange={(e) => setInputs(prev => ({ ...prev, ourManualReviewPct: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
              min="0"
              max="100"
              title="% of flagged reviews we handle (default 10% - client does 90%)"
            />
            <span className="text-xs text-slate-500">Client does {100 - inputs.ourManualReviewPct}%</span>
          </div>
        </div>
      </div>

      {/* Unit Costs */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Unit Costs</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Azure OCR £/1000 pages</label>
            <input
              type="number"
              step={0.01}
              value={inputs.ocrCostPer1000}
              onChange={(e) => setInputs(prev => ({ ...prev, ocrCostPer1000: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tokens per page</label>
            <input
              type="number"
              step={1}
              min={0}
              value={inputs.tokensPerPage}
              onChange={(e) => setInputs(prev => ({ ...prev, tokensPerPage: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">AI Extraction Cost</label>
            <input
              type="number"
              step={0.01}
              min={0}
              value={inputs.llmCostPerMTokens}
              onChange={(e) => setInputs(prev => ({ ...prev, llmCostPerMTokens: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Pipeline passes</label>
            <input
              type="number"
              step={1}
              min={1}
              value={inputs.pipelinePasses}
              onChange={(e) => setInputs(prev => ({ ...prev, pipelinePasses: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Build Team Days */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Build Team (Days)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">SA Days</label>
            <input
              type="number"
              value={inputs.saDays}
              onChange={(e) => setInputs(prev => ({ ...prev, saDays: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ML Days</label>
            <input
              type="number"
              value={inputs.mlDays}
              onChange={(e) => setInputs(prev => ({ ...prev, mlDays: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">BE Days</label>
            <input
              type="number"
              value={inputs.beDays}
              onChange={(e) => setInputs(prev => ({ ...prev, beDays: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">FE Days</label>
            <input
              type="number"
              value={inputs.feDays}
              onChange={(e) => setInputs(prev => ({ ...prev, feDays: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">DevOps Days</label>
            <input
              type="number"
              value={inputs.devopsDays}
              onChange={(e) => setInputs(prev => ({ ...prev, devopsDays: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">QA Days</label>
            <input
              type="number"
              value={inputs.qaDays}
              onChange={(e) => setInputs(prev => ({ ...prev, qaDays: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">PM Days</label>
            <input
              type="number"
              value={inputs.pmDays}
              onChange={(e) => setInputs(prev => ({ ...prev, pmDays: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Pen-Test £</label>
            <input
              type="number"
              value={inputs.penTest}
              onChange={(e) => setInputs(prev => ({ ...prev, penTest: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* OPEX Assumptions */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">OPEX Assumptions (Monthly)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Azure Search £</label>
            <input
              type="number"
              value={inputs.azureSearch}
              onChange={(e) => setInputs(prev => ({ ...prev, azureSearch: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hosting £</label>
            <input
              type="number"
              value={inputs.appHosting}
              onChange={(e) => setInputs(prev => ({ ...prev, appHosting: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Monitoring £</label>
            <input
              type="number"
              value={inputs.monitoring}
              onChange={(e) => setInputs(prev => ({ ...prev, monitoring: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Support Hours</label>
            <input
              type="number"
              value={inputs.supportHours}
              onChange={(e) => setInputs(prev => ({ ...prev, supportHours: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Support Rate £/hr</label>
            <input
              type="number"
              value={inputs.supportRate}
              onChange={(e) => setInputs(prev => ({ ...prev, supportRate: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Benchmarks */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Competitive Benchmarks</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Manual £/doc</label>
            <input
              type="number"
              value={inputs.benchmarkManualPerDoc}
              onChange={(e) => setInputs(prev => ({ ...prev, benchmarkManualPerDoc: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Competitor £/doc</label>
            <input
              type="number"
              value={inputs.benchmarkCompetitorPerDoc}
              onChange={(e) => setInputs(prev => ({ ...prev, benchmarkCompetitorPerDoc: Number(e.target.value) }))}
              className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAssumptions;
