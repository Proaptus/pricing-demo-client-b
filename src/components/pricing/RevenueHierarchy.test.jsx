import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
// import RevenueHierarchy from './RevenueHierarchy';

/**
 * COMPONENT TEST - RevenueHierarchy
 * Note: Component file not yet created - skip these tests
 */
describe.skip('RevenueHierarchy', () => {
  const defaultAllocations = [
    { name: 'RPG Allocation', amount: 16284, percentage: 38.1, accent: 'blue' },
    { name: 'Proaptus Allocation', amount: 26466, percentage: 61.9, accent: 'green' },
  ];

  const renderComponent = (props = {}) => render(
    <RevenueHierarchy
      totalRevenue={42750}
      soldDays={45}
      dayRate={950}
      allocations={defaultAllocations}
      {...props}
    />
  );

  it('renders total revenue node with hierarchical child allocations', () => {
    renderComponent();

    const nodes = screen.getAllByTestId('revenue-node');
    expect(nodes).toHaveLength(3);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('£42,750')).toBeInTheDocument();
    expect(screen.getByText('45 days sold @ £950 per day')).toBeInTheDocument();

    defaultAllocations.forEach(({ name, amount, percentage }) => {
      expect(screen.getByText(name)).toBeInTheDocument();
      expect(screen.getByText(`£${amount.toLocaleString()}`)).toBeInTheDocument();
      expect(screen.getByText(`${percentage}% of revenue`)).toBeInTheDocument();
    });

    const connectors = screen.getAllByTestId('revenue-connector');
    expect(connectors).toHaveLength(defaultAllocations.length);
  });

  it('supports custom copy for total node', () => {
    renderComponent({ soldDays: 30, dayRate: 1200 });

    expect(screen.getByText('30 days sold @ £1,200 per day')).toBeInTheDocument();
  });
});
