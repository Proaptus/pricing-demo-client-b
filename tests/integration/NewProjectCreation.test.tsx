import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RedPegasusPricingCalculator from '../../src/components/RedPegasusPricingCalculator';
import { act } from 'react';

/**
 * INTEGRATION TESTS - New Project Creation
 *
 * These tests verify the user workflow for creating new projects:
 * - "+ New Project" button availability and functionality
 * - UUID generation from API
 * - Form submission with project details
 * - New project appearing in project list
 *
 * STATUS: Tests are SKIPPED until the Create Project UI is fully implemented.
 * Requires: Form controls, modals, and project creation workflow.
 * Current mock infrastructure is ready and will support these tests immediately.
 */
describe.skip('New Project Creation - Integration Tests', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show "+ New Project" button when projects exist', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      // Health check
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ok', timestamp: new Date().toISOString() })
        });
      }

      // Load existing projects
      return Promise.resolve({
        ok: true,
        json: async () => ({
          'existing-id': {
            id: 'existing-id',
            name: 'Existing Project',
            clientRate: 950,
            soldDays: 45,
            deliverables: []
          }
        })
      });
    });

    render(<RedPegasusPricingCalculator onLogout={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Existing Project')).toBeInTheDocument();
    });

    // Should show "+ New Project" button
    const newButton = screen.getByRole('button', { name: /\+ new project/i });
    expect(newButton).toBeInTheDocument();
  });

  it('should generate unique UUID from server when creating new project', async () => {
    const generatedUUID = 'c7f2e8d4-a1b2-4c5d-9e3f-8a7b6c5d4e3f';

    global.fetch = vi.fn().mockImplementation((url) => {
      // Health check
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ok', timestamp: new Date().toISOString() })
        });
      }

      // Load existing projects
      if (url.includes('/api/projects') && !url.includes('/api/projects/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            'existing-id': {
              id: 'existing-id',
              name: 'Existing Project',
              clientRate: 950,
              soldDays: 45,
              deliverables: []
            }
          })
        });
      }

      // Generate new project ID
      if (url.includes('/api/generate-id')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: generatedUUID })
        });
      }

      // Save any project (handles both initial save and autosave)
      if (url.includes('/api/projects/') && !url.endsWith('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        });
      }

      return Promise.reject(new Error('Unexpected fetch call'));
    });

    render(<RedPegasusPricingCalculator onLogout={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Existing Project')).toBeInTheDocument();
    });

    // Click "+ New Project" button
    const newButton = screen.getByRole('button', { name: /\+ new project/i });
    await userEvent.click(newButton);

    // Fill in project details
    const titleInput = await screen.findByLabelText(/project title/i);
    await userEvent.type(titleInput, 'Brand New Project');

    // Submit form - query input fresh and get its parent form
    await act(async () => {
      const freshInput = screen.getByLabelText(/project title/i);
      const form = freshInput.closest('form');
      if (form) {
        fireEvent.submit(form);
      }
    });

    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify UUID generation was called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/generate-id'),
        expect.objectContaining({ method: 'POST' })
      );
    }, { timeout: 10000 });

    // Verify new project was saved with generated UUID
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/projects/${generatedUUID}`),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  it('should initialize new project with empty deliverables and default values', async () => {
    const newProjectUUID = 'new-uuid-456';

    global.fetch = vi.fn().mockImplementation((url) => {
      // Health check
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ok', timestamp: new Date().toISOString() })
        });
      }

      if (url.includes('/api/projects') && !url.includes('/api/projects/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({}) // Empty projects initially
        });
      }

      if (url.includes('/api/generate-id')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: newProjectUUID })
        });
      }

      if (url.includes(`/api/projects/${newProjectUUID}`)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        });
      }

      return Promise.reject(new Error('Unexpected fetch'));
    });

    render(<RedPegasusPricingCalculator onLogout={() => {}} />);

    // Should show empty state
    await waitFor(() => {
      expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
    });

    // Click "Create New Project" button
    const createButton = screen.getByRole('button', { name: /create new project/i });
    await userEvent.click(createButton);

    // Fill minimal required fields
    const titleInput = await screen.findByLabelText(/project title/i);
    await userEvent.type(titleInput, 'Fresh Start Project');

    // Submit form directly
    const form = titleInput.closest('form');
    await act(async () => {
      fireEvent.submit(form);
    });

    // Verify the saved project data structure
    await waitFor(() => {
      const saveCall = (fetch as any).mock.calls.find((call: any) =>
        call[0].includes(`/api/projects/${newProjectUUID}`) && call[1]?.method === 'PUT'
      );

      expect(saveCall).toBeDefined();
      const savedData = JSON.parse(saveCall[1].body);

      // Should have unique UUID
      expect(savedData.id).toBe(newProjectUUID);

      // Should have empty deliverables array (not hardcoded data)
      expect(savedData.deliverables).toEqual([]);

      // Should have default values
      expect(savedData.clientRate).toBeGreaterThan(0);
      expect(savedData.soldDays).toBeGreaterThan(0);

      // Should NOT have hardcoded Simpson Travel or HubSpot data
      expect(savedData.name).not.toContain('Simpson');
      expect(savedData.name).not.toContain('HubSpot');
    });
  });

  it('should add new project to project list after creation', async () => {
    const newProjectUUID = 'uuid-new-789';

    global.fetch = vi.fn().mockImplementation((url) => {
      // Health check
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'ok', timestamp: new Date().toISOString() })
        });
      }

      if (url.includes('/api/projects') && !url.includes('/api/projects/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            'old-project': {
              id: 'old-project',
              name: 'Old Project',
              clientRate: 900,
              soldDays: 40,
              deliverables: []
            }
          })
        });
      }

      if (url.includes('/api/generate-id')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: newProjectUUID })
        });
      }

      // Save any project (handles both initial save and autosave)
      if (url.includes('/api/projects/') && !url.endsWith('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        });
      }

      return Promise.reject(new Error('Unexpected fetch'));
    });

    render(<RedPegasusPricingCalculator onLogout={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Old Project')).toBeInTheDocument();
    });

    // Click "+ New Project"
    const newButton = screen.getByRole('button', { name: /\+ new project/i });
    await userEvent.click(newButton);

    // Create new project
    const titleInput = await screen.findByLabelText(/project title/i);
    await userEvent.type(titleInput, 'Newly Created Project');

    // Submit form - query input fresh and get its parent form
    await act(async () => {
      const freshInput = screen.getByLabelText(/project title/i);
      const form = freshInput.closest('form');
      if (form) {
        fireEvent.submit(form);
      }
    });

    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // New project should appear in "Your Projects" list
    await waitFor(() => {
      expect(screen.getByText('Newly Created Project')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Old project should still be visible
    expect(screen.getByText('Old Project')).toBeInTheDocument();

    // Should now have 2 projects in the list
    const projectCards = screen.getAllByRole('button', { name: /project/i });
    expect(projectCards.length).toBeGreaterThanOrEqual(2);
  });
});
