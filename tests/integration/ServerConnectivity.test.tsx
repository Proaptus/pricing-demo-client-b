import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RedPegasusPricingCalculator from '../../src/components/RedPegasusPricingCalculator';

// Mock fetch globally
const originalFetch = global.fetch;

/**
 * INTEGRATION TESTS - Server Connectivity
 *
 * These tests verify error handling when the API server is unavailable:
 * - Connection error states and error messages
 * - "No projects found" empty state
 * - Project list population when connection succeeds
 * - Retry functionality
 *
 * STATUS: Tests are SKIPPED until error state UI components are fully implemented.
 * Requires: Error message displays, retry buttons, and empty state screens.
 * Mock infrastructure is ready to support these tests immediately.
 */
describe.skip('Server Connectivity - Integration Tests', () => {
  beforeEach(() => {
    // Clear any stored data
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should show "Server connection lost" error when API server is down', async () => {
    // Mock fetch to simulate server down (connection refused)
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    render(<RedPegasusPricingCalculator onLogout={() => {}} />);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/server connection lost/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should NOT show default hardcoded project data
    expect(screen.queryByText(/simpson travel/i)).not.toBeInTheDocument();
  });

  it('should show "No projects found" when server returns empty projects list', async () => {
    // Mock fetch to return empty projects object
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}) // Empty projects
    });

    render(<RedPegasusPricingCalculator onLogout={() => {}} />);

    // Wait for empty state message
    await waitFor(() => {
      expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show "Create New Project" button
    expect(screen.getByText(/create new project/i)).toBeInTheDocument();

    // Should NOT show any hardcoded project data
    expect(screen.queryByText(/simpson travel/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hubspot/i)).not.toBeInTheDocument();
  });

  it('should load projects from server when connection is successful', async () => {
    const mockProject = {
      id: 'test-uuid-123',
      name: 'Test Project from Server',
      clientName: 'Test Client',
      soldDays: 30,
      clientRate: 1000,
      deliverables: [],
      lastModified: new Date().toISOString()
    };

    // Mock successful server response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        'test-uuid-123': mockProject
      })
    });

    render(<RedPegasusPricingCalculator onLogout={() => {}} />);

    // Wait for project to load from server
    await waitFor(() => {
      expect(screen.getByText('Test Project from Server')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should NOT show any hardcoded default data
    expect(screen.queryByText(/simpson travel/i)).not.toBeInTheDocument();
  });

  it('should retry connection when server comes back online', async () => {
    let callCount = 0;

    // First call fails (server down), second call succeeds (server back)
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Failed to fetch'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          'test-id': {
            id: 'test-id',
            name: 'Reconnected Project',
            clientRate: 950,
            soldDays: 45,
            deliverables: []
          }
        })
      });
    });

    render(<RedPegasusPricingCalculator onLogout={() => {}} />);

    // Should show error initially
    await waitFor(() => {
      expect(screen.getByText(/server connection lost/i)).toBeInTheDocument();
    });

    // Should show retry button
    const retryButton = screen.getByRole('button', { name: /retry connection/i });
    expect(retryButton).toBeInTheDocument();

    // Click retry
    retryButton.click();

    // Should load data after retry
    await waitFor(() => {
      expect(screen.getByText('Reconnected Project')).toBeInTheDocument();
    });

    // Error should be gone
    expect(screen.queryByText(/server connection lost/i)).not.toBeInTheDocument();
  });
});
