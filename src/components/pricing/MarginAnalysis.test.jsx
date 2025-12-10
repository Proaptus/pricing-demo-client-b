import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MarginAnalysis from './MarginAnalysis.jsx';
import formatGBP from './shared/formatGBP.js';

/**
 * Integration test suite for MarginAnalysis component
 * Tests REAL component rendering (not mocked)
 */
describe('MarginAnalysis', () => {
  const mockModel = {
    total: {
      valueDays: 66.4,
      revenue: 42750
    },
    rpg: {
      valueDays: 25.0,
      share: 37.65,
      revenue: 16092
    },
    proaptus: {
      valueDays: 41.4,
      share: 62.35,
      revenue: 26658
    }
  };

  it('should render without crashing', () => {
    render(<MarginAnalysis model={mockModel} formatGBP={formatGBP} />);

    // Component should render the title
    expect(screen.getByText(/revenue allocation summary/i)).toBeTruthy();
  });

  it('should display total revenue correctly', () => {
    render(<MarginAnalysis model={mockModel} formatGBP={formatGBP} />);

    // Should show total revenue
    expect(screen.getByText(/total revenue/i)).toBeTruthy();
    expect(screen.getByText('£42,750')).toBeTruthy();
  });

  it('should display total value-days correctly', () => {
    render(<MarginAnalysis model={mockModel} formatGBP={formatGBP} />);

    // Should show total value-days
    expect(screen.getByText(/total value-days/i)).toBeTruthy();
    expect(screen.getByText('66.4')).toBeTruthy();
  });

  it('should calculate and display blended effective rate', () => {
    render(<MarginAnalysis model={mockModel} formatGBP={formatGBP} />);

    // Blended rate = 42750 / 66.4 = £644/day (approx)
    expect(screen.getByText(/blended rate/i)).toBeTruthy();
    expect(screen.getByText(/£644/)).toBeTruthy();
  });

  it('should display RPG party allocation', () => {
    render(<MarginAnalysis model={mockModel} formatGBP={formatGBP} />);

    // Should show RPG section
    expect(screen.getByText('RPG')).toBeTruthy();
    expect(screen.getByText('£16,092')).toBeTruthy();
    expect(screen.getByText('37.65%')).toBeTruthy();
  });

  it('should display Proaptus party allocation', () => {
    render(<MarginAnalysis model={mockModel} formatGBP={formatGBP} />);

    // Should show Proaptus section
    expect(screen.getByText('Proaptus')).toBeTruthy();
    expect(screen.getByText('£26,658')).toBeTruthy();
    expect(screen.getByText('62.35%')).toBeTruthy();
  });

  it('should have professional dashboard styling', () => {
    const { container } = render(<MarginAnalysis model={mockModel} formatGBP={formatGBP} />);

    // Should have white background with slate text for professional appearance
    const mainDiv = container.firstChild;
    expect(mainDiv.className).toContain('bg-white');
    expect(mainDiv.className).toContain('shadow-md');
    expect(mainDiv.className).toContain('rounded-lg');
  });

  it('should handle zero revenue gracefully', () => {
    const zeroModel = {
      total: {
        valueDays: 0,
        revenue: 0
      },
      rpg: { valueDays: 0, share: 0, revenue: 0 },
      proaptus: { valueDays: 0, share: 0, revenue: 0 }
    };

    render(<MarginAnalysis model={zeroModel} formatGBP={formatGBP} />);

    // Should render without errors
    expect(screen.getByText(/revenue allocation summary/i)).toBeTruthy();
    // Multiple £0 values expected (total revenue, blended rate, party revenues)
    const zeroValues = screen.getAllByText('£0');
    expect(zeroValues.length).toBeGreaterThan(0);
  });
});
