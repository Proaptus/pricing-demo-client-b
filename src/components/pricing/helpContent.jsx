/**
 * Help Content for Red Pegasus Pricing Model
 *
 * This file contains all help text, explanations, and examples
 * for each section of the pricing model.
 */

export const helpContent = {
  projectInformation: {
    title: 'Project Information',
    content: `This section captures the core metadata about your project. It helps organize and track project details for reporting and reference purposes.`,
    example: `Example: A project for "Simpson Travel" with code "ST-KB-2025-Q1" assigned to account manager "Colin from RPG" with status "Active".`
  },

  projectRevenue: {
    title: 'Project Revenue',
    content: (
      <div className="space-y-3">
        <p>
          <strong>Client Day Rate:</strong> The daily rate charged to the client for the work. This is the base rate that gets multiplied by role weights to calculate individual deliverable rates.
        </p>
        <p>
          <strong>Sold Days:</strong> The total number of days you've committed to the client for this project. This is the ceiling for all deliverable days across the project.
        </p>
        <p className="font-semibold text-blue-900">
          Total Project Value = Client Day Rate × Sold Days
        </p>
      </div>
    ),
    example: `If your client day rate is £1,000 and you've sold 20 days, your total project value is £20,000. This revenue gets distributed among deliverables based on their role-weighted days.`
  },

  roleWeights: {
    title: 'Role Weights Configuration',
    content: (
      <div className="space-y-3">
        <p>
          Role weights are multipliers applied to your base client day rate for each role. They reflect the relative value and cost of different types of work.
        </p>
        <p>
          <strong>How it works:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>A weight of 1.0 means the role is billed at the base client day rate</li>
          <li>A weight &gt; 1.0 (e.g., 1.5) means the role is more valuable and billed higher</li>
          <li>A weight &lt; 1.0 (e.g., 0.75) means the role is less complex and billed lower</li>
        </ul>
        <p className="font-semibold text-blue-900">
          Effective Rate = Client Day Rate × Role Weight
        </p>
      </div>
    ),
    example: `Example: Client day rate is £1,000. If "Development" has a weight of 1.5, then a development day costs £1,500. If "Support" has a weight of 0.8, then a support day costs £800.`
  },

  deliverables: {
    title: 'Deliverables & Work Allocation',
    content: (
      <div className="space-y-3">
        <p>
          Deliverables are the individual pieces of work within your project. Each deliverable specifies:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li><strong>Name:</strong> Description of what will be delivered</li>
          <li><strong>Owner:</strong> Which party (RPG or Proaptus) is responsible</li>
          <li><strong>Role:</strong> Type of work (e.g., Development, Design, QA)</li>
          <li><strong>Days:</strong> Number of days required to complete this deliverable</li>
          <li><strong>Acceptance Criteria:</strong> What success looks like for this deliverable</li>
        </ul>
        <p className="font-semibold text-blue-900">
          Deliverable Revenue = Days × (Client Day Rate × Role Weight)
        </p>
      </div>
    ),
    example: `A deliverable "Homepage Design" owned by RPG, using Design role (weight 1.2), taking 5 days:
  • Revenue = 5 days × (£1,000 × 1.2) = £6,000`
  },

  profitSplitAnalysis: {
    title: 'Profit Split & Revenue Allocation',
    content: (
      <div className="space-y-3">
        <p>
          This section shows how the total project revenue is distributed between parties (RPG and Proaptus) based on their deliverable allocations.
        </p>
        <p>
          <strong>Allocation Process:</strong>
        </p>
        <ol className="list-decimal list-inside space-y-1 text-slate-700">
          <li>Calculate revenue for each deliverable (days × effective rate)</li>
          <li>Sum deliverables by party to get party subtotal</li>
          <li>Apply 10% uplift to account manager party's share</li>
          <li>Calculate final percentages and splits</li>
        </ol>
        <p className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2 mt-2 text-yellow-900">
          ⚠️ <strong>Account Manager Uplift:</strong> The party designated as account manager receives a 10% revenue bonus on top of their earned share.
        </p>
      </div>
    ),
    example: `If RPG has 12 value-days earning £12,000, and they're the account manager:
  • Earned revenue: £12,000
  • With 10% uplift: £12,000 × 1.1 = £13,200
  • If total project is £20,000: RPG gets 66% (£13,200)`
  },

  valueDays: {
    title: 'Value-Days Explained',
    content: (
      <div className="space-y-3">
        <p>
          "Value-Days" is a weighted measure of work effort. It combines actual days with role complexity to give a true picture of work distribution.
        </p>
        <p className="font-semibold text-blue-900">
          Value-Days = Days × Role Weight
        </p>
        <p>
          This allows fair allocation even when different roles have different costs.
        </p>
      </div>
    ),
    example: `Two deliverables, both taking 5 days:
  • Development (weight 1.5): 5 × 1.5 = 7.5 value-days
  • Support (weight 0.8): 5 × 0.8 = 4 value-days
  • Even though both are 5 calendar days, Development represents more valuable work`
  },

  scenarioSelector: {
    title: 'Pricing Scenarios',
    content: (
      <div className="space-y-3">
        <p>
          Scenarios allow you to model different pricing strategies for the same project scope. Each scenario can have different assumptions and configurations.
        </p>
        <p>
          <strong>Common Scenarios:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li><strong>Conservative:</strong> Lower rates, higher contingency for risk</li>
          <li><strong>Standard:</strong> Expected baseline pricing</li>
          <li><strong>Aggressive:</strong> Premium pricing, optimized delivery</li>
        </ul>
      </div>
    ),
    example: `Same project scope with three pricing approaches:
  • Conservative: £1,000/day base rate
  • Standard: £1,200/day base rate
  • Aggressive: £1,500/day base rate`
  },

  keyAssumptions: {
    title: 'Key Assumptions',
    content: (
      <div className="space-y-3">
        <p>
          Key assumptions are the fundamental inputs that drive your pricing model. They should be clearly documented and agreed with stakeholders.
        </p>
        <p>
          Typical assumptions include:
        </p>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          <li>Client day rate and its basis (daily, hourly, etc.)</li>
          <li>Total project days/timeline</li>
          <li>Team composition and roles</li>
          <li>Contingency buffer</li>
          <li>Party allocations and responsibilities</li>
        </ul>
      </div>
    ),
    example: `Example assumptions for a project:
  • Base rate: £1,200/day (market rate for this type of work)
  • Duration: 20 days (agreed with client)
  • Team: 1 Senior Dev, 1 Designer, 1 QA tester
  • Contingency: 10% buffer for unknowns`
  }
};

export default helpContent;
