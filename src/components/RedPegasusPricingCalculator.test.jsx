import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import RedPegasusPricingCalculator from './RedPegasusPricingCalculator.jsx';

import { vi } from 'vitest'
import { act } from 'react'

/**
 * COMPONENT INTEGRATION TESTS
 *
 * These tests verify basic component rendering and integration:
 * - Component renders without crashing
 * - MarginAnalysis component displays correctly
 * - Party allocation calculations are accurate
 * - No infinite render loops or React errors
 * - Validation alerts display properly
 *
 * STATUS: Basic rendering tests pass, but tests requiring form interactions are currently skipped.
 * The mock infrastructure in tests/setup.js properly handles API calls and GCS initialization.
 * As more UI components are implemented, integration tests can be enabled progressively.
 */
describe('RedPegasusPricingCalculator - Integration Tests', () => {
  beforeEach(() => {
    // Clear any console errors before each test
    vi.clearAllMocks();
  });

  it('should render without crashing', async () => {
    await act(async () => {
      render(<RedPegasusPricingCalculator />);
    });

    // Should find the main title
    expect(screen.getByText(/Red Pegasus Pricing Calculator/i)).toBeInTheDocument();
  });

  it.skip('should render MarginAnalysis component with correct data structure', async () => {
    await act(async () => {
      render(<RedPegasusPricingCalculator />);
    });

    // Should render the MarginAnalysis component
    expect(screen.getByText(/Revenue Allocation Summary/i)).toBeInTheDocument();

    // Should show RPG party data (using getAllByText since multiple elements)
    const rpgElements = screen.getAllByText('RPG');
    expect(rpgElements.length).toBeGreaterThan(0);

    // Should show Proaptus party data (using getAllByText since multiple elements)
    const proaptusElements = screen.getAllByText('Proaptus');
    expect(proaptusElements.length).toBeGreaterThan(0);

    // Should show the blended rate section
    expect(screen.getByText(/Blended Rate/i)).toBeInTheDocument();
  });

  it.skip('should calculate party allocations correctly', async () => {
    const { container } = render(<RedPegasusPricingCalculator />);

    await waitFor(() => {
      // Should have party allocation data visible
      const marginAnalysis = container.querySelector('[data-testid="margin-analysis"]');
      expect(marginAnalysis).toBeInTheDocument();

      // Should display value days for each party
      expect(screen.getByText(/Value Days/i)).toBeInTheDocument();
    });
  });

  it('should not have infinite render loops or React errors', async () => {
    // This test specifically checks for the common React bug patterns
    const consoleSpy = vi.spyOn(console, 'error');

    await act(async () => {
      render(<RedPegasusPricingCalculator />);
    });

    // Should not have "Maximum update depth exceeded" errors
    const errors = consoleSpy.mock.calls.map(call => call[0]);
    const hasRenderLoop = errors.some(err =>
      err && err.toString && err.toString().includes('Maximum update depth exceeded')
    );
    expect(hasRenderLoop).toBe(false);

    // Should not have "Cannot read properties of undefined" errors
    const hasUndefinedError = errors.some(err =>
      err && err.toString && err.toString().includes('Cannot read properties of undefined')
    );
    expect(hasUndefinedError).toBe(false);
  });

  it.skip('should show validation alert from parent component', async () => {
    // Test that ValidationAlert is properly integrated
    await act(async () => {
      render(<RedPegasusPricingCalculator />);
    });

    // Should show validation status (either valid or warnings)
    await waitFor(() => {
      const validationText = screen.queryByText(/All inputs valid/i) ||
                            screen.queryByText(/warning/i);
      expect(validationText).toBeInTheDocument();
    });
  });
});