import React from 'react';
import formatGBP from './shared/formatGBP';

/**
 * RedPegasusInternalReport Component
 * Internal financial report showing full breakdown with all costs, margins, and allocations
 * Classification: INTERNAL USE ONLY - CONFIDENTIAL
 */
const RedPegasusInternalReport = ({ 
  model, 
  inputs, 
  formatGBP: formatCurrency = formatGBP,
  projectName = '',
  projectDescription = '',
  projectBackground = '',
  clientName = '',
  overview = '',
  startDate = '',
  endDate = '',
  projectCode = '',
  accountManager = '',
  accountManagerParty = 'RPG',
  status = ''
}) => {
  if (!model || !inputs) {
    return (
      <div className="p-8 bg-white text-slate-700">
        Missing required data for report generation
      </div>
    );
  }

  const safeFormatGBP = (value) => {
    if (value === null || value === undefined) return '£0.00';
    try {
      return formatCurrency(value);
    } catch {
      return '£0.00';
    }
  };

  const reportDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate deliverables by party
  const deliverablesByParty = {};
  (model.deliverables || []).forEach(d => {
    const party = d.owner || 'Unknown';
    if (!deliverablesByParty[party]) {
      deliverablesByParty[party] = [];
    }
    deliverablesByParty[party].push(d);
  });

  // Calculate price vs revenue for each party
  const totalWeightedRevenue = model.totalWeightedRevenue || model.totalRevenue;
  const partyDetails = Object.entries(model.partyAllocations || {}).map(([party, allocation]) => {
    const pricePercentage = totalWeightedRevenue > 0 
      ? (allocation.revenue / totalWeightedRevenue) * 100 
      : 0;
    const revenuePercentage = Number.isFinite(allocation.percentage) ? allocation.percentage : 0;
    const effectiveBlendedRate = allocation.days > 0 ? allocation.finalRevenue / allocation.days : 0;
    const price = allocation.revenue;
    const cost = price * 0.5; // 50% of price
    const revenue = allocation.finalRevenue;
    const margin = revenue - cost;
    const marginPercentage = revenue > 0 ? (margin / revenue) * 100 : 0;
    
    return {
      party,
      ...allocation,
      pricePercentage,
      revenuePercentage,
      effectiveBlendedRate,
      price,
      cost,
      margin,
      marginPercentage,
      hasUplift: allocation.upliftFactor > 1.0
    };
  });

  return (
    <div className="red-pegasus-internal-report bg-white text-slate-900" style={{ fontSize: '11pt', fontFamily: 'Arial, sans-serif' }}>
      {/* Page 1: Header & Project Information */}
      <div className="page" style={{ padding: '40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '28pt', fontWeight: 'bold', margin: '0 0 16px 0' }}>Red Pegasus Pricing Report</h1>
          <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '12px 24px', marginTop: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em', margin: 0 }}>INTERNAL USE ONLY - CONFIDENTIAL</p>
          </div>
        </div>

        {/* Project Information */}
        {(projectName || clientName || projectCode || accountManager || startDate || endDate || status) && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>Project Information</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
              <tbody>
                {projectName && (
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', width: '200px', backgroundColor: '#f5f5f5' }}>Project Name:</td>
                    <td style={{ padding: '8px' }}>{projectName}</td>
                  </tr>
                )}
                {clientName && (
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Client:</td>
                    <td style={{ padding: '8px' }}>{clientName}</td>
                  </tr>
                )}
                {projectCode && (
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Project Code:</td>
                    <td style={{ padding: '8px' }}>{projectCode}</td>
                  </tr>
                )}
                {accountManager && (
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Account Manager:</td>
                    <td style={{ padding: '8px' }}>{accountManager} ({accountManagerParty})</td>
                  </tr>
                )}
                {startDate && (
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Start Date:</td>
                    <td style={{ padding: '8px' }}>{startDate}</td>
                  </tr>
                )}
                {endDate && (
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>End Date:</td>
                    <td style={{ padding: '8px' }}>{endDate}</td>
                  </tr>
                )}
                {status && (
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Status:</td>
                    <td style={{ padding: '8px' }}>{status}</td>
                  </tr>
                )}
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Report Date:</td>
                  <td style={{ padding: '8px' }}>{reportDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Project Description & Background */}
        {(projectDescription || projectBackground || overview) && (
          <div style={{ marginBottom: '30px' }}>
            {projectDescription && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8px' }}>Project Description</h3>
                <p style={{ fontSize: '10pt', lineHeight: '1.6', color: '#475569', margin: 0 }}>{projectDescription}</p>
              </div>
            )}
            {projectBackground && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8px' }}>Background</h3>
                <p style={{ fontSize: '10pt', lineHeight: '1.6', color: '#475569', margin: 0 }}>{projectBackground}</p>
              </div>
            )}
            {overview && (
              <div>
                <h3 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '8px' }}>Overview</h3>
                <p style={{ fontSize: '10pt', lineHeight: '1.6', color: '#475569', margin: 0 }}>{overview}</p>
              </div>
            )}
          </div>
        )}

        {/* Financial Summary */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>Financial Summary</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '8px', fontWeight: 'bold', width: '200px', backgroundColor: '#f5f5f5' }}>Client Rate:</td>
                <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>{safeFormatGBP(model.clientRate)}/day</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Sold Days:</td>
                <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>{model.soldDays || inputs.soldDays}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Total Deliverable Days:</td>
                <td style={{ padding: '8px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold' }}>{model.totalDays}</td>
              </tr>
              <tr style={{ borderTop: '2px solid #000' }}>
                <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Total Revenue:</td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold' }}>{safeFormatGBP(model.totalRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Page 2: All Deliverables & Role Weights */}
      <div className="page" style={{ padding: '40px' }}>
        {/* All Deliverables Table */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>All Deliverables Breakdown</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Deliverable</th>
                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Owner</th>
                <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Role</th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>Days</th>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Role Weight</th>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Effective Rate</th>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(model.deliverables || []).map((d, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '8px' }}>{d.name}</td>
                  <td style={{ padding: '8px' }}>{d.owner || 'Unknown'}</td>
                  <td style={{ padding: '8px' }}>{d.role || 'N/A'}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{d.days}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{d.roleWeight ? d.roleWeight.toFixed(2) + 'x' : '1.00x'}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{safeFormatGBP(d.effectiveRate || model.clientRate)}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{safeFormatGBP(d.revenue)}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#f5f5f5', borderTop: '2px solid #000', fontWeight: 'bold' }}>
                <td colSpan="3" style={{ padding: '8px' }}>TOTAL</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{model.totalDays}</td>
                <td colSpan="2" style={{ padding: '8px' }}></td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{safeFormatGBP(model.totalRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Role Weights Table */}
        {model.roleWeights && Object.keys(model.roleWeights).length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>Role Weights Configuration</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Role</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Weight</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Base Rate</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Effective Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(model.roleWeights).map(([role, weight]) => (
                  <tr key={role} style={{ borderBottom: '1px solid #ccc' }}>
                    <td style={{ padding: '8px' }}>{role}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{Number(weight).toFixed(2)}x</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{safeFormatGBP(model.clientRate)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{safeFormatGBP(model.clientRate * Number(weight))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Page 3: Deliverables by Party */}
      {Object.keys(deliverablesByParty).length > 0 && (
        <div className="page" style={{ padding: '40px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>Deliverables by Party</h2>
          {Object.entries(deliverablesByParty).map(([party, deliverables]) => {
            const partyTotalDays = deliverables.reduce((sum, d) => sum + (d.days || 0), 0);
            const partyTotalRevenue = deliverables.reduce((sum, d) => sum + (d.revenue || 0), 0);
            
            return (
              <div key={party} style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', backgroundColor: '#f5f5f5', padding: '8px', borderBottom: '2px solid #000' }}>
                  {party} ({deliverables.length} deliverables)
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Deliverable</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>Role</th>
                      <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>Days</th>
                      <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliverables.map((d, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '8px' }}>{d.name}</td>
                        <td style={{ padding: '8px' }}>{d.role || 'N/A'}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>{d.days}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{safeFormatGBP(d.revenue)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f5f5f5', borderTop: '2px solid #000', fontWeight: 'bold' }}>
                      <td colSpan="2" style={{ padding: '8px' }}>TOTAL</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{partyTotalDays}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{safeFormatGBP(partyTotalRevenue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* Page 4: Profit Split Analysis */}
      <div className="page" style={{ padding: '40px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>Profit Split Analysis</h2>
        <p style={{ fontSize: '9pt', color: '#475569', marginBottom: '20px', lineHeight: '1.6' }}>
          Revenue allocation based on internal weighting with <strong>{accountManagerParty}</strong> receiving a 10% uplift for account management responsibilities. 
          Price represents calculated value before normalization; Revenue shows final allocation after uplift and normalization.
        </p>
        
        {partyDetails.map((partyData) => (
          <div key={partyData.party} style={{ marginBottom: '24px', border: '1px solid #ccc', padding: '16px', backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{partyData.party}</h3>
              {partyData.hasUplift && (
                <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                  +10% Uplift
                </span>
              )}
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px', fontWeight: 'bold', width: '180px', backgroundColor: '#f5f5f5' }}>Final Revenue:</td>
                  <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', fontSize: '12pt' }}>{safeFormatGBP(partyData.finalRevenue)}</td>
                  <td style={{ padding: '6px', textAlign: 'right', color: '#64748b' }}>({partyData.revenuePercentage.toFixed(1)}% of total)</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Days Allocated:</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>{partyData.days.toFixed(2)} days</td>
                  <td style={{ padding: '6px' }}></td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Effective Blended Rate:</td>
                  <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{safeFormatGBP(partyData.effectiveBlendedRate, 0)}/day</td>
                  <td style={{ padding: '6px' }}></td>
                </tr>
                <tr style={{ borderTop: '1px solid #ccc' }}>
                  <td style={{ padding: '6px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Price (Before Norm):</td>
                  <td style={{ padding: '6px', textAlign: 'right' }}>{safeFormatGBP(partyData.price)}</td>
                  <td style={{ padding: '6px', textAlign: 'right', color: '#64748b' }}>({partyData.pricePercentage.toFixed(1)}%)</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Revenue (After Norm):</td>
                  <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>{safeFormatGBP(partyData.finalRevenue)}</td>
                  <td style={{ padding: '6px', textAlign: 'right', color: '#64748b' }}>({partyData.revenuePercentage.toFixed(1)}%)</td>
                </tr>
                {Math.abs(partyData.revenuePercentage - partyData.pricePercentage) > 0.1 && (
                  <tr>
                    <td style={{ padding: '6px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Difference:</td>
                    <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold', color: partyData.revenuePercentage > partyData.pricePercentage ? '#059669' : '#dc2626' }}>
                      {(partyData.revenuePercentage > partyData.pricePercentage ? '+' : '')}{(partyData.revenuePercentage - partyData.pricePercentage).toFixed(1)}%
                    </td>
                    <td style={{ padding: '6px' }}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Page 5: Margin Analysis */}
      <div className="page" style={{ padding: '40px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>Gross Margin Analysis</h2>
        <div style={{ backgroundColor: '#e0f2fe', borderLeft: '4px solid #0284c7', padding: '12px', marginBottom: '20px', fontSize: '9pt' }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#075985' }}>Assumption:</p>
          <p style={{ margin: 0, color: '#475569' }}>
            Resource costs are 50% of the price (before normalization). Cost = 50% × Price • Margin = Revenue - Cost • Margin % = (Margin ÷ Revenue) × 100
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #000' }}>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Party</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Price</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Cost (50%)</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Revenue</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Margin</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Margin %</th>
            </tr>
          </thead>
          <tbody>
            {partyDetails.map((partyData) => (
              <tr key={partyData.party} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>
                  {partyData.party}
                  {partyData.hasUplift && <span style={{ fontSize: '8pt', color: '#3b82f6', marginLeft: '8px' }}>(+10%)</span>}
                </td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{safeFormatGBP(partyData.price)}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{safeFormatGBP(partyData.cost)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{safeFormatGBP(partyData.finalRevenue)}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: partyData.margin >= 0 ? '#059669' : '#dc2626' }}>
                  {safeFormatGBP(partyData.margin)}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: partyData.marginPercentage >= 0 ? '#059669' : '#dc2626' }}>
                  {partyData.marginPercentage.toFixed(1)}%
                </td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#f5f5f5', borderTop: '2px solid #000', fontWeight: 'bold' }}>
              <td style={{ padding: '10px' }}>TOTAL</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{safeFormatGBP(partyDetails.reduce((sum, p) => sum + p.price, 0))}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{safeFormatGBP(partyDetails.reduce((sum, p) => sum + p.cost, 0))}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{safeFormatGBP(model.totalRevenue)}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                {safeFormatGBP(partyDetails.reduce((sum, p) => sum + p.margin, 0))}
              </td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                {model.totalRevenue > 0 ? ((partyDetails.reduce((sum, p) => sum + p.margin, 0) / model.totalRevenue) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            float: none !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-only-report {
            display: block !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
          }
          .red-pegasus-internal-report {
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            box-sizing: border-box;
            position: static !important;
            left: auto !important;
            top: auto !important;
          }
          /* Page setup with proper margins */
          @page {
            size: A4;
            margin: 20mm; /* Ensures margins on all printed pages */
          }
          .page {
            width: 100%;
            padding: 0 !important; /* Remove padding - @page margins handle spacing */
            box-sizing: border-box;
            page-break-after: auto;
            page-break-inside: auto;
          }
          /* Force page break between .page sections */
          .page + .page {
            page-break-before: always;
            break-before: always;
          }
          /* Keep component sections together */
          .page > div {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 16px;
          }
          /* Tables can span pages but keep rows together */
          table {
            page-break-inside: auto;
            break-inside: auto;
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 16px;
          }
          thead {
            display: table-header-group;
          }
          tbody {
            display: table-row-group;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Keep headers with following content */
          h1, h2, h3 {
            page-break-after: avoid;
            break-after: avoid;
            margin-top: 20px;
            margin-bottom: 12px;
          }
          /* First heading on page shouldn't have top margin */
          .page > div:first-child h1,
          .page > div:first-child h2,
          .page > div:first-child h3 {
            margin-top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default RedPegasusInternalReport;
