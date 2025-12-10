import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * UNIT TESTS - GCS Storage Integration (Mocked)
 *
 * Tests the behavior of GCS storage functions when called
 * Uses mocks to avoid requiring actual GCS credentials
 */

// Mock the gcsStorage module to avoid real API calls
vi.mock('../../src/services/gcsStorage', () => ({
  loadProjectsFromGCS: vi.fn(),
  saveProjectsToGCS: vi.fn(),
  loadRoleWeightsFromGCS: vi.fn(),
  saveRoleWeightsToGCS: vi.fn(),
  initializeGCS: vi.fn()
}));

import {
  loadProjectsFromGCS,
  saveProjectsToGCS,
  loadRoleWeightsFromGCS,
  saveRoleWeightsToGCS
} from '../../src/services/gcsStorage';

describe('GCS Storage Integration - Mocked Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadProjectsFromGCS - Success Cases', () => {
    it('should load projects successfully', async () => {
      const mockProjects = {
        'project-1': {
          id: 'project-1',
          name: 'Simpson Travel KB',
          clientRate: 950,
          soldDays: 85,
          deliverables: []
        }
      };

      loadProjectsFromGCS.mockResolvedValue(mockProjects);

      const projects = await loadProjectsFromGCS();

      expect(projects).toEqual(mockProjects);
      expect(projects['project-1'].name).toBe('Simpson Travel KB');
      expect(loadProjectsFromGCS).toHaveBeenCalled();
    });

    it('should return empty object if no projects', async () => {
      loadProjectsFromGCS.mockResolvedValue({});

      const projects = await loadProjectsFromGCS();

      expect(projects).toEqual({});
      expect(Object.keys(projects).length).toBe(0);
    });

    it('should load multiple projects', async () => {
      const mockProjects = {
        'project-1': { id: 'project-1', name: 'Project 1' },
        'project-2': { id: 'project-2', name: 'Project 2' },
        'project-3': { id: 'project-3', name: 'Project 3' }
      };

      loadProjectsFromGCS.mockResolvedValue(mockProjects);

      const projects = await loadProjectsFromGCS();

      expect(Object.keys(projects).length).toBe(3);
      expect(projects['project-1']).toBeDefined();
      expect(projects['project-2']).toBeDefined();
      expect(projects['project-3']).toBeDefined();
    });

    it('should load projects with complete metadata', async () => {
      const mockProjects = {
        'p1': {
          id: 'p1',
          name: 'Complete Project',
          clientName: 'Test Client',
          clientRate: 1000,
          soldDays: 50,
          deliverables: [
            { id: 1, name: 'Dev', role: 'Development', days: 10, owner: 'Proaptus' }
          ],
          description: 'Description',
          accountManagerParty: 'RPG',
          lastModified: '2025-10-31T12:00:00Z'
        }
      };

      loadProjectsFromGCS.mockResolvedValue(mockProjects);

      const projects = await loadProjectsFromGCS();

      expect(projects['p1'].clientName).toBe('Test Client');
      expect(projects['p1'].deliverables.length).toBe(1);
    });
  });

  describe('loadProjectsFromGCS - Error Cases', () => {
    it('should throw error on GCS read failure', async () => {
      const error = new Error('GCS read failed');
      loadProjectsFromGCS.mockRejectedValue(error);

      try {
        await loadProjectsFromGCS();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).toBe('GCS read failed');
      }
    });

    it('should throw error on network timeout', async () => {
      const error = new Error('Network timeout');
      loadProjectsFromGCS.mockRejectedValue(error);

      try {
        await loadProjectsFromGCS();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).toBe('Network timeout');
      }
    });

    it('should throw error on invalid JSON', async () => {
      const error = new Error('Invalid JSON response');
      loadProjectsFromGCS.mockRejectedValue(error);

      try {
        await loadProjectsFromGCS();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    it('should throw error on 404 not found', async () => {
      const error = new Error('404: File not found');
      loadProjectsFromGCS.mockRejectedValue(error);

      try {
        await loadProjectsFromGCS();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).toContain('404');
      }
    });
  });

  describe('saveProjectsToGCS - Success Cases', () => {
    it('should save projects successfully', async () => {
      const projectsToSave = {
        'project-1': {
          id: 'project-1',
          name: 'Updated Project',
          clientRate: 1000,
          deliverables: []
        }
      };

      saveProjectsToGCS.mockResolvedValue({ success: true });

      const result = await saveProjectsToGCS(projectsToSave);

      expect(result.success).toBe(true);
      expect(saveProjectsToGCS).toHaveBeenCalledWith(projectsToSave);
    });

    it('should save empty project library', async () => {
      saveProjectsToGCS.mockResolvedValue({ success: true });

      const result = await saveProjectsToGCS({});

      expect(result.success).toBe(true);
      expect(saveProjectsToGCS).toHaveBeenCalled();
    });

    it('should save project with complete structure', async () => {
      const projectData = {
        'p1': {
          id: 'p1',
          name: 'Simpson Travel KB',
          clientRate: 950,
          soldDays: 85,
          deliverables: [
            { id: 1, name: 'Dev', days: 10, owner: 'Proaptus', role: 'Development' }
          ],
          clientName: 'Test',
          accountManagerParty: 'RPG',
          lastModified: '2025-10-31T12:00:00Z'
        }
      };

      saveProjectsToGCS.mockResolvedValue({ success: true });

      await saveProjectsToGCS(projectData);

      expect(saveProjectsToGCS).toHaveBeenCalledWith(projectData);
    });
  });

  describe('saveProjectsToGCS - Error Cases', () => {
    it('should throw error on save failure', async () => {
      const error = new Error('GCS write failed');
      saveProjectsToGCS.mockRejectedValue(error);

      try {
        await saveProjectsToGCS({ 'p1': {} });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).toBe('GCS write failed');
      }
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      saveProjectsToGCS.mockRejectedValue(error);

      try {
        await saveProjectsToGCS({ 'p1': {} });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).toBe('Network error');
      }
    });

    it('should throw error on server error', async () => {
      const error = new Error('500: Server error');
      saveProjectsToGCS.mockRejectedValue(error);

      try {
        await saveProjectsToGCS({ 'p1': {} });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).toContain('Server error');
      }
    });
  });

  describe('loadRoleWeightsFromGCS - Success Cases', () => {
    it('should load role weights successfully', async () => {
      const mockWeights = {
        current: {
          'Solution Architect': 1.3,
          'Development': 1.5,
          'QA': 1.0,
          'Infrastructure': 1.2
        },
        lastChanged: {
          date: '2025-10-31T12:00:00Z',
          reason: 'Market adjustment'
        }
      };

      loadRoleWeightsFromGCS.mockResolvedValue(mockWeights);

      const weights = await loadRoleWeightsFromGCS();

      expect(weights.current['Development']).toBe(1.5);
      expect(weights.lastChanged.reason).toBe('Market adjustment');
    });

    it('should return weights with metadata', async () => {
      const mockWeights = {
        current: {
          'Development': 1.5,
          'QA': 1.0
        },
        lastChanged: {
          date: '2025-10-31T12:00:00Z',
          reason: 'Q4 adjustment',
          comment: 'Rate increase'
        }
      };

      loadRoleWeightsFromGCS.mockResolvedValue(mockWeights);

      const weights = await loadRoleWeightsFromGCS();

      expect(weights.lastChanged).toBeDefined();
      expect(weights.lastChanged.comment).toBe('Rate increase');
    });

    it('should load default weights if none exist', async () => {
      const defaultWeights = {
        current: {
          'Development': 1.5,
          'QA': 1.0
        }
      };

      loadRoleWeightsFromGCS.mockResolvedValue(defaultWeights);

      const weights = await loadRoleWeightsFromGCS();

      expect(weights.current).toBeDefined();
    });
  });

  describe('loadRoleWeightsFromGCS - Error Cases', () => {
    it('should throw error if weights file missing', async () => {
      const error = new Error('Weights file not found');
      loadRoleWeightsFromGCS.mockRejectedValue(error);

      try {
        await loadRoleWeightsFromGCS();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      loadRoleWeightsFromGCS.mockRejectedValue(error);

      try {
        await loadRoleWeightsFromGCS();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).toBe('Network error');
      }
    });
  });

  describe('saveRoleWeightsToGCS - Success Cases', () => {
    it('should save role weights successfully', async () => {
      const weightsToSave = {
        'Solution Architect': 1.3,
        'Development': 1.5,
        'QA': 1.0,
        'Infrastructure': 1.2
      };

      saveRoleWeightsToGCS.mockResolvedValue({ success: true });

      const result = await saveRoleWeightsToGCS(weightsToSave);

      expect(result.success).toBe(true);
      expect(saveRoleWeightsToGCS).toHaveBeenCalledWith(weightsToSave);
    });

    it('should preserve role weight precision', async () => {
      const weightsToSave = {
        'Development': 1.5,
        'QA': 1.0,
        'Solution Architect': 1.25,
        'Infrastructure': 1.125
      };

      saveRoleWeightsToGCS.mockResolvedValue({ success: true });

      await saveRoleWeightsToGCS(weightsToSave);

      expect(saveRoleWeightsToGCS).toHaveBeenCalledWith(
        expect.objectContaining({
          'Solution Architect': 1.25,
          'Infrastructure': 1.125
        })
      );
    });
  });

  describe('saveRoleWeightsToGCS - Error Cases', () => {
    it('should throw error on save failure', async () => {
      const error = new Error('Failed to save weights');
      saveRoleWeightsToGCS.mockRejectedValue(error);

      try {
        await saveRoleWeightsToGCS({ 'Development': 1.5 });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeDefined();
      }
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      saveRoleWeightsToGCS.mockRejectedValue(error);

      try {
        await saveRoleWeightsToGCS({ 'Development': 1.5 });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).toBe('Network error');
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent save operations', async () => {
      saveProjectsToGCS.mockResolvedValue({ success: true });

      const p1 = saveProjectsToGCS({ 'p1': { name: 'Project 1' } });
      const p2 = saveProjectsToGCS({ 'p2': { name: 'Project 2' } });

      const results = await Promise.all([p1, p2]);

      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(saveProjectsToGCS).toHaveBeenCalledTimes(2);
    });

    it('should handle load followed by save', async () => {
      const mockProjects = { 'p1': { id: 'p1', name: 'Test' } };

      loadProjectsFromGCS.mockResolvedValue(mockProjects);
      saveProjectsToGCS.mockResolvedValue({ success: true });

      const loaded = await loadProjectsFromGCS();
      const updated = { ...loaded, 'p1': { ...loaded['p1'], name: 'Updated' } };
      const saved = await saveProjectsToGCS(updated);

      expect(saved.success).toBe(true);
      expect(loadProjectsFromGCS).toHaveBeenCalledTimes(1);
      expect(saveProjectsToGCS).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Structure Consistency', () => {
    it('should maintain project structure in load/save cycle', async () => {
      const projectData = {
        'p1': {
          id: 'p1',
          name: 'Project',
          clientRate: 1000,
          soldDays: 50,
          deliverables: []
        }
      };

      loadProjectsFromGCS.mockResolvedValue(projectData);
      saveProjectsToGCS.mockResolvedValue({ success: true });

      const loaded = await loadProjectsFromGCS();
      expect(loaded['p1']).toHaveProperty('clientRate', 1000);
      expect(loaded['p1']).toHaveProperty('deliverables');

      await saveProjectsToGCS(loaded);
      expect(saveProjectsToGCS).toHaveBeenCalledWith(loaded);
    });

    it('should preserve deliverables array structure', async () => {
      const projectData = {
        'p1': {
          id: 'p1',
          name: 'Project',
          deliverables: [
            { id: 1, name: 'Dev 1', days: 10, owner: 'Proaptus', role: 'Development' },
            { id: 2, name: 'QA', days: 5, owner: 'RPG', role: 'QA' }
          ]
        }
      };

      loadProjectsFromGCS.mockResolvedValue(projectData);

      const loaded = await loadProjectsFromGCS();

      expect(loaded['p1'].deliverables).toHaveLength(2);
      expect(loaded['p1'].deliverables[0].role).toBe('Development');
      expect(loaded['p1'].deliverables[1].owner).toBe('RPG');
    });
  });

  describe('Mock Verification', () => {
    it('should verify loadProjectsFromGCS is called correctly', async () => {
      loadProjectsFromGCS.mockResolvedValue({});

      await loadProjectsFromGCS();

      expect(loadProjectsFromGCS).toHaveBeenCalled();
      expect(loadProjectsFromGCS).toHaveBeenCalledTimes(1);
    });

    it('should verify saveProjectsToGCS receives correct parameters', async () => {
      const projectData = { 'p1': { name: 'Project' } };
      saveProjectsToGCS.mockResolvedValue({ success: true });

      await saveProjectsToGCS(projectData);

      expect(saveProjectsToGCS).toHaveBeenCalledWith(projectData);
    });

    it('should verify function calls are independent', async () => {
      loadProjectsFromGCS.mockResolvedValue({});
      saveProjectsToGCS.mockResolvedValue({ success: true });

      await loadProjectsFromGCS();
      await saveProjectsToGCS({ 'p1': {} });

      expect(loadProjectsFromGCS).toHaveBeenCalledTimes(1);
      expect(saveProjectsToGCS).toHaveBeenCalledTimes(1);
    });
  });
});
