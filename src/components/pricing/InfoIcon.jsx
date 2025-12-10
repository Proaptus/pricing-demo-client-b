import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * InfoIcon Component
 *
 * A clickable help icon that opens a modal with explanation text.
 * Positioned next to section headers to provide context-sensitive help.
 *
 * @param {Object} props
 * @param {Function} props.onClick - Callback when icon is clicked
 * @param {string} [props.className] - Optional CSS classes
 */
const InfoIcon = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center justify-center ml-2 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 ${className}`}
      title="Click for help and explanation"
      aria-label="Help information"
    >
      <HelpCircle size={18} strokeWidth={1.5} />
    </button>
  );
};

export default InfoIcon;
