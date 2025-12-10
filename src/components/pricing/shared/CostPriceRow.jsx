import React from 'react';
import formatGBP from './formatGBP';

/**
 * CostPriceRow - Displays a row in the cost-to-price breakdown table
 * @param {Object} props
 * @param {string} props.label - Row label/description
 * @param {string} props.calculation - Formula or calculation description
 * @param {number} props.cost - Cost amount
 * @param {string} props.margin - Margin percentage or description
 * @param {number} props.price - Price amount
 * @param {string} props.note - Optional note to display below the row
 * @param {boolean} props.isSubtotal - Whether this is a subtotal row
 * @param {boolean} props.isTotal - Whether this is a total row
 */
const CostPriceRow = ({ label, calculation, cost, margin, price, note, isSubtotal, isTotal }) => (
  <>
    <tr className={`border-b border-slate-100 transition-colors align-middle ${
      isTotal ? 'bg-slate-900 font-bold border-t-2 border-b-2 border-slate-900' :
      isSubtotal ? 'bg-slate-50 font-semibold border-t border-slate-300' :
      'hover:bg-slate-50'
    }`}>
      <td className={`py-3 px-4 font-medium align-middle ${isTotal ? 'text-white' : 'text-slate-800'}`}>
        {label}
      </td>
      <td className={`py-3 px-4 text-sm font-mono align-middle ${isTotal ? 'text-slate-300' : 'text-slate-600'}`}>
        {calculation}
      </td>
      <td className={`py-3 px-4 text-right font-mono tabular-nums align-middle ${isTotal ? 'text-slate-200 font-bold' : 'text-slate-700'}`}>
        {formatGBP(cost, 2)}
      </td>
      <td className={`py-3 px-4 text-center text-sm font-semibold align-middle ${isTotal ? 'text-slate-300' : 'text-slate-600'}`}>
        {margin}
      </td>
      <td className={`py-3 px-4 text-right font-mono tabular-nums font-bold align-middle ${isTotal ? 'text-white text-lg' : 'text-slate-900'}`}>
        {formatGBP(price, 2)}
      </td>
    </tr>
    {note && (
      <tr className={`border-b border-slate-100 align-middle ${isTotal || isSubtotal ? 'bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'}`}>
        <td colSpan="5" className="py-2 px-4 pl-8 text-xs text-slate-600 italic align-middle">
          {note}
        </td>
      </tr>
    )}
  </>
);

export default CostPriceRow;
