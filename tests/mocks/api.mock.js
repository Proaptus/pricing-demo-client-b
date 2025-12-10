/**
 * Mock API and GCS storage for testing
 * Intercepts all fetch calls and provides test data
 */

import { vi } from 'vitest';

// Mock project data store (in-memory)
let projectStore = {
  'test-project-1': {
    id: 'test-project-1',
    name: 'Test Project 1',
    description: 'First test project',
    clientRate: 950,
    soldDays: 45,
    deliverables: [],
    roleWeights: {
      'Sales': 1.8,
      'Solution Architect': 1.4,
      'Project Management': 1.2,
      'Development': 1.0,
      'QA': 0.8,
      'Junior': 0.6
    },
    accountManagerParty: 'RPG',
    lastModified: new Date().toISOString()
  }
};

let roleWeightsStore = {
  'Sales': 1.8,
  'Solution Architect': 1.4,
  'Project Management': 1.2,
  'Development': 1.0,
  'QA': 0.8,
  'Junior': 0.6
};

/**
 * Mock fetch implementation
 * Handles all API endpoints used by the application
 */
export function createMockFetch() {
  return vi.fn((url, options = {}) => {
    console.log(`[MOCK] ${options.method || 'GET'} ${url}`);

    // GCS credentials request - return 404 to skip GCS initialization
    if (url.includes('gcs-credentials') || url.includes('.json')) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({})
      });
    }

    // GET /api/projects - Load all projects
    if (url.includes('/api/projects') && (!options.method || options.method === 'GET')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => projectStore
      });
    }

    // POST /api/generate-id - Generate unique ID
    if (url.includes('/api/generate-id') && options.method === 'POST') {
      const newId = 'uuid-' + Math.random().toString(36).substr(2, 9);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ id: newId })
      });
    }

    // PUT /api/projects/:id - Save/update project
    if (url.match(/\/api\/projects\/[^/]+$/) && options.method === 'PUT') {
      const projectId = url.split('/').pop();
      try {
        const projectData = JSON.parse(options.body);
        projectStore[projectId] = {
          ...projectData,
          id: projectId,
          lastModified: new Date().toISOString()
        };
        console.log(`[MOCK] Saved project ${projectId}`);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, id: projectId })
        });
      } catch (error) {
        return Promise.reject(new Error('Invalid project data'));
      }
    }

    // DELETE /api/projects/:id - Delete project
    if (url.match(/\/api\/projects\/[^/]+$/) && options.method === 'DELETE') {
      const projectId = url.split('/').pop();
      delete projectStore[projectId];
      console.log(`[MOCK] Deleted project ${projectId}`);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });
    }

    // GET /api/role-weights - Get role weights
    if (url.includes('/api/role-weights') && (!options.method || options.method === 'GET')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => roleWeightsStore
      });
    }

    // PUT /api/role-weights - Save role weights
    if (url.includes('/api/role-weights') && options.method === 'PUT') {
      try {
        roleWeightsStore = JSON.parse(options.body);
        console.log(`[MOCK] Saved role weights`);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        });
      } catch (error) {
        return Promise.reject(new Error('Invalid role weights'));
      }
    }

    // Health check endpoint
    if (url.includes('/api/health')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', timestamp: new Date().toISOString() })
      });
    }

    // Unhandled requests
    console.warn(`[MOCK] Unhandled fetch: ${options.method || 'GET'} ${url}`);
    return Promise.reject(new Error(`Unhandled fetch: ${url}`));
  });
}

/**
 * Reset mock data for next test
 */
export function resetMockData() {
  projectStore = {
    'test-project-1': {
      id: 'test-project-1',
      name: 'Test Project 1',
      description: 'First test project',
      clientRate: 950,
      soldDays: 45,
      deliverables: [],
      roleWeights: {
        'Sales': 1.8,
        'Solution Architect': 1.4,
        'Project Management': 1.2,
        'Development': 1.0,
        'QA': 0.8,
        'Junior': 0.6
      },
      accountManagerParty: 'RPG',
      lastModified: new Date().toISOString()
    }
  };

  roleWeightsStore = {
    'Sales': 1.8,
    'Solution Architect': 1.4,
    'Project Management': 1.2,
    'Development': 1.0,
    'QA': 0.8,
    'Junior': 0.6
  };
}

/**
 * Get current mock data (for test assertions)
 */
export function getMockData() {
  return {
    projects: projectStore,
    roleWeights: roleWeightsStore
  };
}

/**
 * Add test project to mock store
 */
export function addTestProject(projectId, projectData) {
  projectStore[projectId] = {
    ...projectData,
    id: projectId,
    lastModified: new Date().toISOString()
  };
}
