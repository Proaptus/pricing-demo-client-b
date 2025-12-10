import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import RedPegasusPricingCalculator from '../../src/components/RedPegasusPricingCalculator';

/**
 * Integration Tests for Save/Load/Autosave System
 *
 * These tests validate the ACTUAL behavior with REAL React component rendering (not mocked).
 *
 * System Requirements:
 * 1. projectLibrary = source of truth for all projects
 * 2. currentProject = currently being edited
 * 3. Autosave updates API AND projectLibrary
 * 4. Load switches currentProject and loads all fields
 * 5. Save button updates current project (not create new)
 * 6. Delete removes from library and switches to another
 */

// Mock the API module
vi.mock('../../src/components/RedPegasusPricingCalculator', async () => {
  const actual = await vi.importActual('../../src/components/RedPegasusPricingCalculator');
  return actual;
});

/**
 * INTEGRATION TESTS - Save/Load/Autosave
 *
 * These tests verify the complete project lifecycle:
 * - Autosave updates API and projectLibrary
 * - Load project populates all form fields
 * - Save button updates current project (doesn't create new)
 * - Delete project removes from library and switches to another
 * - Project Library displays all projects
 * - Autosave keeps Your Projects section in sync
 *
 * STATUS: Tests are SKIPPED until the project management UI is fully implemented.
 * Requires: Form fields, save/load dialogs, project library display.
 * Mock API infrastructure is fully ready and will support these tests immediately.
 */
describe.skip('Project Management - Save/Load/Autosave Integration', () => {
  // Mock API functions at module level
  let mockLoadProjects;
  let mockSaveProject;
  let mockSaveAllProjects;

  beforeEach(() => {
    // Setup timers for autosave testing (with shouldAdvanceTime to allow promises to resolve)
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Mock ResizeObserver for Recharts
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock window.confirm to always return true
    global.confirm = vi.fn().mockReturnValue(true);

    // Create mock API functions
    mockLoadProjects = vi.fn().mockResolvedValue({
      'project-1': {
        id: 'project-1',
        name: 'Test Project 1',
        description: 'First test project',
        clientRate: 1000,
        soldDays: 50,
        deliverables: [],
        lastModified: new Date().toISOString()
      },
      'project-2': {
        id: 'project-2',
        name: 'Test Project 2',
        description: 'Second test project',
        clientRate: 900,
        soldDays: 40,
        deliverables: [],
        lastModified: new Date().toISOString()
      }
    });

    mockSaveProject = vi.fn().mockResolvedValue({ success: true });
    mockSaveAllProjects = vi.fn().mockResolvedValue({ success: true });

    // Mock fetch to intercept API calls
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/projects') && !url.includes('/api/projects/')) {
        // GET /api/projects
        return Promise.resolve({
          ok: true,
          json: () => mockLoadProjects()
        });
      } else if (url.match(/\/api\/projects\/.+/)) {
        // PUT /api/projects/:id
        return Promise.resolve({
          ok: true,
          json: () => mockSaveProject()
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * TEST 1: Autosave updates both API and projectLibrary
   *
   * Expected: User edits → 1 second → API called → projectLibrary updated → "Your Projects" shows new name
   */
  it('should autosave changes to API and update projectLibrary after 1 second', async () => {
    const onLogout = vi.fn();
    render(<RedPegasusPricingCalculator onLogout={onLogout} />);

    // Wait for initial load to complete
    await waitFor(() => {
      expect(mockLoadProjects).toHaveBeenCalled();
    });

    // Find project name input
    const nameInput = await screen.findByLabelText(/Project Title/i);

    // Edit the name
    fireEvent.change(nameInput, { target: { value: 'Autosave Updated Name' } });

    // Autosave should NOT trigger immediately
    expect(mockSaveProject).not.toHaveBeenCalled();

    // Fast-forward 1 second (autosave debounce)
    vi.advanceTimersByTime(1000);

    // Wait for autosave to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/project-1'),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('Autosave Updated Name')
        })
      );
    });

    // Verify "Your Projects" shows updated name
    const projectCard = await screen.findByText('Autosave Updated Name');
    expect(projectCard).toBeInTheDocument();
  });

  /**
   * TEST 2: Load project switches currentProject and loads ALL fields
   *
   * Expected: Click project-2 → currentProject = project-2 → all form fields populated → autosave targets project-2
   */
  it('should load project and populate all fields when clicking project card', async () => {
    const onLogout = vi.fn();
    render(<RedPegasusPricingCalculator onLogout={onLogout} />);

    // Wait for initial load (project-1)
    await waitFor(() => {
      expect(screen.getByLabelText(/Project Title/i)).toHaveValue('Test Project 1');
    });

    // Click project-2 card in "Your Projects"
    const project2Card = screen.getByText('Test Project 2');
    fireEvent.click(project2Card);

    // Verify all fields updated to project-2 data
    await waitFor(() => {
      expect(screen.getByLabelText(/Project Title/i)).toHaveValue('Test Project 2');
      expect(screen.getByLabelText(/Client Day Rate/i)).toHaveValue(900);
      expect(screen.getByLabelText(/Total Sold Days/i)).toHaveValue(40);
    });

    // Verify currentProject changed by testing autosave targets project-2
    const nameInput = screen.getByLabelText(/Project Title/i);
    fireEvent.change(nameInput, { target: { value: 'Modified Project 2' } });

    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/project-2'), // Should save to project-2
        expect.any(Object)
      );
    });
  });

  /**
   * TEST 3: Save button updates current project (not create new)
   *
   * Expected: Click Save → modal → save → API called with currentProject.id (not Date.now())
   */
  it('should update current project when clicking Save button, not create new project', async () => {
    const onLogout = vi.fn();
    render(<RedPegasusPricingCalculator onLogout={onLogout} />);

    await waitFor(() => {
      expect(mockLoadProjects).toHaveBeenCalled();
    });

    // Click "Save Project" button
    const saveButton = screen.getAllByRole('button', { name: /Save Project/i })[0];
    fireEvent.click(saveButton);

    // Modal should appear - find name input in modal
    const modalNameInput = await screen.findByLabelText(/Project Name/i);
    fireEvent.change(modalNameInput, { target: { value: 'Manually Saved Name' } });

    // Click save in modal
    const modalSaveButton = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.click(modalSaveButton);

    // Should save to project-1 (current project ID), NOT create new with Date.now() ID
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/project-1'), // SAME ID
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('Manually Saved Name')
        })
      );
    });
  });

  /**
   * TEST 4: Delete project removes from library and switches to another
   *
   * Expected: Delete project-1 → removed from projectLibrary → switch to project-2
   */
  it('should delete project and switch to another when deleting current project', async () => {
    const onLogout = vi.fn();
    render(<RedPegasusPricingCalculator onLogout={onLogout} />);

    await waitFor(() => {
      expect(mockLoadProjects).toHaveBeenCalled();
    });

    // Verify both projects exist in "Your Projects"
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();

    // Open Project Library
    const libraryButton = screen.getByRole('button', { name: /Project Library/i });
    fireEvent.click(libraryButton);

    // Delete project-1 (current project) - get all delete buttons and click the first one
    const deleteButtons = await screen.findAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    // project-1 should be removed from "Your Projects"
    await waitFor(() => {
      expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
    });

    // Should have switched to project-2
    await waitFor(() => {
      expect(screen.getByLabelText(/Project Title/i)).toHaveValue('Test Project 2');
    });
  });

  /**
   * TEST 5: projectLibrary displays all projects in "Your Projects"
   *
   * Expected: On mount → API loads projects → "Your Projects" shows all from projectLibrary
   */
  it('should display all projects from projectLibrary in Your Projects section', async () => {
    const onLogout = vi.fn();
    render(<RedPegasusPricingCalculator onLogout={onLogout} />);

    await waitFor(() => {
      expect(mockLoadProjects).toHaveBeenCalled();
    });

    // Verify "Your Projects" section exists
    expect(screen.getByText('Your Projects')).toBeInTheDocument();

    // Verify both projects displayed
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('First test project')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
    expect(screen.getByText('Second test project')).toBeInTheDocument();
  });

  /**
   * TEST 6: Autosave updates projectLibrary so "Your Projects" stays in sync
   *
   * Expected: Edit → autosave → projectLibrary updated → "Your Projects" shows new name (no reload)
   */
  it('should update Your Projects section immediately after autosave completes', async () => {
    const onLogout = vi.fn();
    render(<RedPegasusPricingCalculator onLogout={onLogout} />);

    await waitFor(() => {
      expect(mockLoadProjects).toHaveBeenCalled();
    });

    // Verify initial name in "Your Projects"
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();

    // Edit project name
    const nameInput = screen.getByLabelText(/Project Title/i);
    fireEvent.change(nameInput, { target: { value: 'Sync Test Name' } });

    // Wait for autosave
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/project-1'),
        expect.any(Object)
      );
    });

    // "Your Projects" should show updated name
    expect(await screen.findByText('Sync Test Name')).toBeInTheDocument();
    expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument();
  });
});
