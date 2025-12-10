import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

/**
 * ValidationAlert - Component that displays validation status with errors/warnings
 * Note: This component is also referenced as ValidationBadge in the main pricing model
 * @param {Object} props
 * @param {Object} props.validation - Validation result from validateInputs()
 * @param {string[]} props.warnings - Warning messages from getValidationWarnings()
 */
const ValidationAlert = ({ validation, warnings }) => {
  const hasErrors = !validation.isValid;
  const hasWarnings = validation.isValid && warnings.length > 0;

  // Don't show anything if inputs are valid and no warnings
  if (!hasErrors && !hasWarnings) {
    return (
      <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium text-sm">All inputs valid</span>
      </div>
    );
  }

  // Show errors (red)
  if (hasErrors) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-4">
        <div className="flex items-start gap-2 mb-2">
          <XCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-900 text-sm mb-1">Validation Errors</h3>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, idx) => (
                <li key={idx} className="text-sm text-red-800">{error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show warnings (yellow)
  if (hasWarnings) {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
        <div className="flex items-start gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 text-sm mb-1">Input Warnings</h3>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, idx) => (
                <li key={idx} className="text-sm text-amber-800">{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ValidationAlert;
