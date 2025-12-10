import React from 'react';
import formatGBP from './shared/formatGBP';

/**
 * RedPegasusQuoteReport Component
 * Client-facing quote report showing deliverables, pricing, and terms only
 * Classification: DETAILED QUOTE - CLIENT PROPOSAL / CLIENT-READY
 */
const RedPegasusQuoteReport = ({ 
  model, 
  inputs, 
  formatGBP: formatCurrency = formatGBP,
  projectName = '',
  clientName = '',
  startDate = '',
  endDate = '',
  projectCode = '',
  accountManager = ''
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

  const totalRevenue = model.totalRevenue || 0;

  return (
    <div className="red-pegasus-quote-report bg-white text-slate-900" style={{ fontSize: '11pt', fontFamily: 'Arial, sans-serif' }}>
      {/* PAGE 1: TITLE PAGE */}
      <div className="page" style={{ padding: '40px' }}>
        {/* Proaptus Logo Area */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>Proaptus</div>
        </div>

        {/* Classification Banner */}
        <div style={{ textAlign: 'center', padding: '12px 24px', marginBottom: '40px', borderTop: '2px solid #000', borderBottom: '2px solid #000', backgroundColor: '#f5f5f5' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.1em', margin: 0 }}>DETAILED QUOTE - CLIENT PROPOSAL</p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32pt', fontWeight: 'bold', margin: '0 0 16px 0' }}>
            {projectName || 'Project Quote'}
          </h1>
          <p style={{ fontSize: '16pt', color: '#64748b', margin: '8px 0' }}>Professional Services Engagement</p>
          {clientName && (
            <p style={{ fontSize: '14pt', color: '#64748b', margin: '8px 0', fontWeight: '500' }}>
              For: {clientName}
            </p>
          )}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '30px', lineHeight: '1.8' }}>
          <p style={{ margin: '4px 0', color: '#475569' }}>
            <strong>Quote Date:</strong> {reportDate}
          </p>
          {(startDate || endDate) && (
            <p style={{ margin: '4px 0', color: '#475569' }}>
              <strong>Project Timeline:</strong> {startDate && endDate ? `${startDate} to ${endDate}` : startDate || endDate}
            </p>
          )}
          <p style={{ margin: '4px 0', color: '#475569' }}>
            <strong>Engagement Model:</strong> Deliverable-based pricing
          </p>
        </div>

        {/* Pricing Summary Box */}
        <div style={{ backgroundColor: '#f5f5f5', border: '2px solid #000', padding: '20px', borderRadius: '0px', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0' }}>TOTAL DELIVERABLES</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{(model.deliverables || []).length} items</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0' }}>TOTAL QUOTE AMOUNT</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{safeFormatGBP(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* PAGE 2: DELIVERABLES */}
      <div className="page" style={{ padding: '40px' }}>
        <h2 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>Deliverables & Scope</h2>

        <p style={{ color: '#475569', marginBottom: '16px', lineHeight: '1.6' }}>
          This engagement includes the following deliverables, scheduled to be completed over the project timeline:
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '10pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #000' }}>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Deliverable</th>
              <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Days</th>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Acceptance Criteria</th>
              <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {(model.deliverables || []).map((deliverable, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '10px', fontWeight: '500' }}>{deliverable.name}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>{deliverable.days}</td>
                <td style={{ padding: '10px' }}>{deliverable.acceptance || 'Completion verification'}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{safeFormatGBP(deliverable.revenue)}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#f5f5f5', borderTop: '2px solid #000', fontWeight: 'bold' }}>
              <td colSpan="3" style={{ padding: '10px' }}>TOTAL</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{safeFormatGBP(totalRevenue)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderLeft: '2px solid #000', borderRadius: '0px', fontSize: '9pt' }}>
          <p style={{ margin: 0 }}>
            <strong>Note:</strong> Deliverables are estimated based on current scope and assumptions. Any significant scope changes will be discussed and may impact the timeline and pricing.
          </p>
        </div>
      </div>

      {/* PAGE 3: PRICING & TERMS */}
      <div className="page" style={{ padding: '40px' }}>
        <h2 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>Pricing & Terms</h2>

        {/* Pricing Summary */}
        <div style={{ backgroundColor: '#f5f5f5', border: '2px solid #000', padding: '20px', borderRadius: '0px', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '10px', fontWeight: 'bold', margin: '0 0 4px 0' }}>TOTAL QUOTE AMOUNT</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{safeFormatGBP(totalRevenue)}</p>
          </div>
        </div>

        {/* Pricing Notes */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '12px' }}>Pricing Approach</h3>
          <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderLeft: '2px solid #000', fontSize: '9pt' }}>
            <p style={{ margin: 0 }}>This quote is based on defined deliverables and estimated effort. Pricing is fixed for the scope defined above and includes all resources required to complete the deliverables to the specified acceptance criteria.</p>
          </div>
        </div>

        {/* Payment Terms */}
        <h3 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '12px', backgroundColor: '#f5f5f5', padding: '8px 12px', borderBottom: '2px solid #000' }}>Payment Terms</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '8px', fontWeight: 'bold', width: '180px', backgroundColor: '#f5f5f5' }}>Invoice Schedule:</td>
              <td style={{ padding: '8px' }}>Milestone-based invoicing as deliverables are completed</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Payment Terms:</td>
              <td style={{ padding: '8px' }}>Net 30 days from invoice date</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Currency:</td>
              <td style={{ padding: '8px' }}>British Pounds Sterling (GBP)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PAGE 4: TERMS & CONDITIONS */}
      <div className="page" style={{ padding: '40px' }}>
        <h2 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>Terms & Conditions</h2>

        <div style={{ fontSize: '9pt', color: '#475569', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '0 0 4px 0' }}>Scope & Changes</h3>
            <p style={{ margin: '0' }}>
              This quote is based on the scope discussed and documented. Any changes to scope, timeline, or deliverables will be communicated in writing and may impact the quoted price.
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '0 0 4px 0' }}>Timeline</h3>
            <p style={{ margin: '0' }}>
              The estimated effort is based on current availability and understanding of requirements. Actual timeline will be confirmed upon project initiation.
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '0 0 4px 0' }}>Assumptions</h3>
            <ul style={{ margin: '0', paddingLeft: '20px' }}>
              <li>Client will provide timely feedback and approvals</li>
              <li>Requirements remain as currently understood</li>
              <li>Team resources are available as planned</li>
              <li>No major external dependencies or blockers</li>
            </ul>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '0 0 4px 0' }}>Acceptance & Sign-Off</h3>
            <p style={{ margin: '0' }}>
              Deliverables will be considered accepted upon meeting the documented acceptance criteria and client sign-off.
            </p>
          </div>

          <div style={{ backgroundColor: '#f5f5f5', padding: '12px', borderLeft: '2px solid #000', marginTop: '16px', borderRadius: '0px' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>Quote Validity</p>
            <p style={{ margin: 0 }}>
              This quote is valid for 30 days from the date shown above. Please contact us to discuss if you require a different timeline.
            </p>
          </div>
        </div>
      </div>

      {/* PAGE 5: CONTACT & NEXT STEPS */}
      <div className="page" style={{ padding: '40px' }}>
        <h2 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>Next Steps</h2>

        <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderLeft: '2px solid #000', borderRadius: '0px', marginBottom: '20px', fontSize: '9pt' }}>
          <h3 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '0 0 8px 0' }}>To Proceed:</h3>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Review this proposal and confirm scope</li>
            <li>Approve the quoted pricing and terms</li>
            <li>Confirm project start date and timeline</li>
            <li>Sign the engagement agreement (if required)</li>
            <li>Begin project planning and kickoff</li>
          </ol>
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '2px', fontSize: '9pt' }}>
          <h3 style={{ fontSize: '11pt', fontWeight: 'bold', margin: '0 0 8px 0' }}>Have Questions?</h3>
          <p style={{ margin: '0 0 8px 0', color: '#475569' }}>
            If you have any questions about this proposal, need clarification on any items, or would like to discuss alternatives, please don't hesitate to reach out.
          </p>
          <p style={{ margin: '0 0 4px 0', color: '#475569' }}>
            <strong>Company:</strong> Proaptus
          </p>
          <p style={{ margin: 0, color: '#475569' }}>
            <strong>Contact:</strong> Your Proaptus representative
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '9pt', color: '#64748b' }}>
          <p style={{ margin: 0 }}>We look forward to partnering with you on this engagement.</p>
        </div>
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
          .red-pegasus-quote-report {
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

export default RedPegasusQuoteReport;
