import React from 'react';

/**
 * ReportVariantSelector Component
 * Allows user to choose report type before printing
 *
 * @param {Function} onSelect - Callback when variant is selected
 * @param {Function} onClose - Callback to close the modal
 */
const ReportVariantSelector = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-8 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-slate-900">Select Report Variant</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm md:text-base text-slate-600 mb-4 md:mb-6">
          Select which report variant to generate when you print. Each variant is designed for different audiences and purposes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* INTERNAL Report */}
          <button
            onClick={() => onSelect('INTERNAL')}
            className="p-4 md:p-6 rounded-lg border-2 border-blue-200 hover:border-blue-600 hover:bg-blue-50 transition text-left cursor-pointer"
          >
            <div className="font-bold text-slate-900 mb-2 md:mb-3 text-base md:text-lg">Internal Report</div>
            <div className="text-sm text-slate-600 space-y-1">
              <p>✓ Full financial analysis</p>
              <p>✓ All deliverables detailed</p>
              <p>✓ Role weights & allocations</p>
              <p>✓ Party revenue breakdown</p>
              <p>✓ Account manager uplift shown</p>
              <p className="text-red-600 font-semibold mt-2">CONFIDENTIAL</p>
            </div>
          </button>

          {/* Detailed Quote Report */}
          <button
            onClick={() => onSelect('DETAILED_QUOTE')}
            className="p-6 rounded-lg border-2 border-purple-200 hover:border-purple-600 hover:bg-purple-50 transition text-left cursor-pointer"
          >
            <div className="font-bold text-slate-900 mb-3 text-lg">Detailed Quote</div>
            <div className="text-sm text-slate-600 space-y-1">
              <p>✓ Client-facing proposal</p>
              <p>✓ Deliverables & timeline</p>
              <p>✓ Pricing summary</p>
              <p>✓ Payment terms included</p>
              <p>✓ No internal details</p>
              <p className="text-purple-600 font-semibold mt-2">CLIENT-READY</p>
            </div>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 md:mt-8 p-3 md:p-4 bg-blue-50 border border-blue-200 rounded text-xs md:text-sm text-blue-800">
          <strong>Tip:</strong> <strong>Internal Report</strong> shows complete financial breakdown with role weights and party allocations. <strong>Detailed Quote</strong> shows client-facing proposal with pricing and terms only.
        </div>
      </div>
    </div>
  );
};

export default ReportVariantSelector;
