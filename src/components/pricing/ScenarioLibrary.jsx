import React from 'react';
import { Trash2, Download, FolderOpen } from 'lucide-react';

/**
 * ScenarioLibrary Component
 * Displays saved scenarios/projects with load, export, and delete actions
 *
 * @param {Array<Object>} scenarios - Array of saved scenario/project objects
 * @param {Function} onLoad - Callback when user clicks load
 * @param {Function} onDelete - Callback when user clicks delete
 * @param {Function} onClose - Callback when user closes modal
 * @param {boolean} isProjectMode - Whether in project mode or scenario mode
 */
const ScenarioLibrary = ({
  scenarios,
  onLoad,
  onDelete,
  onClose,
  isProjectMode = false
}) => {
  const itemType = isProjectMode ? 'project' : 'scenario';
  const itemTypePlural = isProjectMode ? 'projects' : 'scenarios';

  const emptyContent = (
    <div className="text-center p-8">
      <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-slate-700 mb-2">
        No Saved {isProjectMode ? 'Projects' : 'Scenarios'}
      </h3>
      <p className="text-slate-600">
        Save your current {itemType} to build a library for comparison and reuse.
      </p>
    </div>
  );

  const renderItems = () => {
    return scenarios.map((scenario) => (
      <div
        key={scenario.id}
        className="flex items-start justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group"
      >
        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800 truncate">{scenario.name}</h3>
          </div>
          {scenario.description && (
            <p className="text-sm text-slate-600 mb-1">{scenario.description}</p>
          )}
          <div className="text-xs text-slate-500">
            Saved: {new Date(scenario.timestamp).toLocaleDateString()} at{' '}
            {new Date(scenario.timestamp).toLocaleTimeString()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onLoad(scenario)}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
            title={`Load this ${itemType}`}
          >
            Load
          </button>

          <button
            onClick={() => {
              if (confirm(`Delete ${itemType} "${scenario.name}"?`)) {
                onDelete(scenario.id);
              }
            }}
            className="p-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
            title={`Delete this ${itemType}`}
            aria-label={`Delete ${scenario.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    ));
  };

  const renderSummary = () => {
    return (
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>{scenarios.length}</strong> {itemType}{scenarios.length !== 1 ? 's' : ''} saved •{' '}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => {
              const allData = {
                [itemTypePlural]: scenarios,
                exportedAt: new Date().toISOString(),
                count: scenarios.length,
              };
              const blob = new Blob([JSON.stringify(allData, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `all_${itemTypePlural}_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export all {itemTypePlural}
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg md:text-xl font-bold text-slate-800">
            {isProjectMode ? 'Project Library' : 'Saved Scenarios'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {!scenarios || scenarios.length === 0 ? emptyContent : (
          <>
            <div className="space-y-2 mb-4">{renderItems()}</div>
            {renderSummary()}
          </>
        )}
      </div>
    </div>
  );
};

export default ScenarioLibrary;
