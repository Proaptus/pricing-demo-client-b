import React from 'react';

/**
 * IngestionCapexTable - Displays the Ingestion CAPEX breakdown table
 *
 * @param {Object} model - The computed pricing model object
 * @param {Object} inputs - User input parameters
 * @param {Function} formatGBP - Currency formatting function
 * @param {React.Component} CostPriceRow - Row component for displaying cost/price items
 */
const IngestionCapexTable = ({ model, inputs, formatGBP, CostPriceRow }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
        Ingestion CAPEX Breakdown
      </h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-slate-300">
            <th className="text-left py-3 px-4 text-sm font-bold text-slate-900">Line Item</th>
            <th className="text-left py-3 px-4 text-sm font-bold text-slate-900">Calculation</th>
            <th className="text-right py-3 px-4 text-sm font-bold text-slate-900">Cost</th>
            <th className="text-center py-3 px-4 text-sm font-bold text-slate-900">Margin</th>
            <th className="text-right py-3 px-4 text-sm font-bold text-slate-900">Price</th>
          </tr>
        </thead>
        <tbody>
          {model.ingestionLineItems.map(item => (
            <CostPriceRow
              key={item.id}
              label={item.description}
              calculation={`${typeof item.quantity === 'number' ? item.quantity.toLocaleString() : item.quantity} ${item.unit} × £${item.unitRate}${item.unit === 'M tokens' ? ' per 1M tokens' : ''}`}
              cost={item.cost}
              margin={`${(item.margin * 100).toFixed(0)}%`}
              price={item.price}
              note={item.notes}
            />
          ))}
          <CostPriceRow
            label="Total Ingestion CAPEX"
            calculation={`For ${inputs.nSites.toLocaleString()} sites`}
            cost={model.ingestionTotalCost}
            markup="—"
            price={model.ingestionTotalPrice}
            isTotal
          />
        </tbody>
      </table>
    </div>
  );
};

export default IngestionCapexTable;
