import React from 'react';

/**
 * BuildCapexTable - Displays the Build CAPEX breakdown table
 *
 * @param {Object} model - The computed pricing model object
 * @param {Function} formatGBP - Currency formatting function
 * @param {React.Component} CostPriceRow - Row component for displaying cost/price items
 */
const BuildCapexTable = ({ model, formatGBP, CostPriceRow }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
        Build CAPEX Breakdown
      </h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-slate-300">
            <th className="text-left py-3 px-4 text-sm font-bold text-slate-900">Role</th>
            <th className="text-left py-3 px-4 text-sm font-bold text-slate-900">Calculation</th>
            <th className="text-right py-3 px-4 text-sm font-bold text-slate-900">Cost</th>
            <th className="text-center py-3 px-4 text-sm font-bold text-slate-900">Margin</th>
            <th className="text-right py-3 px-4 text-sm font-bold text-slate-900">Price</th>
          </tr>
        </thead>
        <tbody>
          {model.buildLineItems.map(item => (
            <CostPriceRow
              key={item.id}
              label={item.description}
              calculation={`${typeof item.quantity === 'number' ? item.quantity.toLocaleString() : item.quantity} ${item.unit} × £${item.unitRate}`}
              cost={item.cost}
              margin={`${(item.margin * 100).toFixed(0)}%`}
              price={item.price}
              note={item.notes}
            />
          ))}
          <CostPriceRow
            label="Total Build CAPEX"
            calculation="One-time platform cost"
            cost={model.buildTotalCost}
            margin="—"
            price={model.buildTotalPrice}
            isTotal
          />
        </tbody>
      </table>
    </div>
  );
};

export default BuildCapexTable;
