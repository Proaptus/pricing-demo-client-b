import React from 'react';
import { X } from 'lucide-react';

/**
 * HelpModal Component
 *
 * A reusable modal that displays help content for pricing model sections.
 * Shows explanations, calculations, and usage guidance.
 *
 * @param {Object} props
 * @param {string} props.title - Modal title
 * @param {string|React.ReactNode} props.content - Main help content (supports JSX)
 * @param {string|React.ReactNode} [props.example] - Optional example or use case
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {boolean} [props.isOpen] - Whether modal is visible
 */
const HelpModal = ({ title, content, example, onClose, isOpen = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-start">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-500 hover:text-slate-700 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close help modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Content */}
          <div className="prose prose-sm max-w-none">
            <div className="text-slate-700 leading-relaxed">
              {typeof content === 'string' ? (
                <p>{content}</p>
              ) : (
                content
              )}
            </div>
          </div>

          {/* Example Section (if provided) */}
          {example && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Example</h3>
              <div className="text-sm text-blue-800 leading-relaxed">
                {typeof example === 'string' ? (
                  <p>{example}</p>
                ) : (
                  example
                )}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
