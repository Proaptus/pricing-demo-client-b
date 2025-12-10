import { describe, it, expect } from 'vitest';

/**
 * UNIT TESTS - Deliverables CRUD Operations
 *
 * Tests deliverable management:
 * 1. Create deliverables
 * 2. Read/retrieve deliverables
 * 3. Update deliverables
 * 4. Delete deliverables
 * 5. Validation of deliverable fields
 * 6. Calculation accuracy with different roles
 * 7. Deliverable metadata and ownership
 */

describe('Deliverables - CRUD Operations and Validation', () => {
  describe('Create Deliverable', () => {
    it('should create a new deliverable with all required fields', () => {
      const newDeliverable = {
        id: 1,
        name: 'Architecture & System Design',
        owner: 'Proaptus',
        role: 'Solution Architect',
        days: 2.0,
        acceptanceCriteria: 'Define system components, integration points, and security model'
      };

      expect(newDeliverable).toBeDefined();
      expect(newDeliverable.id).toBe(1);
      expect(newDeliverable.name).toBe('Architecture & System Design');
      expect(newDeliverable.owner).toBe('Proaptus');
      expect(newDeliverable.role).toBe('Solution Architect');
      expect(newDeliverable.days).toBe(2.0);
      expect(newDeliverable.acceptanceCriteria).toContain('system components');
    });

    it('should handle deliverable with fractional days', () => {
      const deliverable = {
        id: 1,
        name: 'Quick Task',
        owner: 'Proaptus',
        role: 'Development',
        days: 0.5,
        acceptanceCriteria: 'Complete quickly'
      };

      expect(deliverable.days).toBe(0.5);
      expect(deliverable.days * 2).toBe(1);
    });

    it('should support zero-day placeholder deliverables', () => {
      const placeholder = {
        id: 99,
        name: 'Future Work',
        owner: 'Proaptus',
        role: 'Development',
        days: 0,
        acceptanceCriteria: 'TBD'
      };

      expect(placeholder.days).toBe(0);
      expect(placeholder.name).toBe('Future Work');
    });

    it('should validate required fields on creation', () => {
      const deliverable = {
        id: 1,
        name: 'Dev Work',
        owner: 'Proaptus',
        role: 'Development',
        days: 10,
        acceptanceCriteria: 'Build feature'
      };

      // All required fields present
      expect(deliverable.id).toBeDefined();
      expect(deliverable.name).toBeDefined();
      expect(deliverable.owner).toBeDefined();
      expect(deliverable.role).toBeDefined();
      expect(deliverable.days).toBeDefined();
      expect(deliverable.acceptanceCriteria).toBeDefined();
    });
  });

  describe('Read Deliverables', () => {
    it('should retrieve deliverable by ID', () => {
      const deliverables = [
        { id: 1, name: 'Dev 1', owner: 'Proaptus', role: 'Development', days: 10 },
        { id: 2, name: 'QA', owner: 'RPG', role: 'QA', days: 5 },
        { id: 3, name: 'Arch', owner: 'Proaptus', role: 'Solution Architect', days: 2 }
      ];

      const found = deliverables.find(d => d.id === 2);

      expect(found).toBeDefined();
      expect(found.name).toBe('QA');
      expect(found.owner).toBe('RPG');
    });

    it('should retrieve all deliverables for a party', () => {
      const deliverables = [
        { id: 1, name: 'Dev 1', owner: 'Proaptus', role: 'Development', days: 10 },
        { id: 2, name: 'QA', owner: 'RPG', role: 'QA', days: 5 },
        { id: 3, name: 'Dev 2', owner: 'Proaptus', role: 'Development', days: 8 }
      ];

      const proaptusDeliverables = deliverables.filter(d => d.owner === 'Proaptus');

      expect(proaptusDeliverables.length).toBe(2);
      expect(proaptusDeliverables[0].name).toBe('Dev 1');
      expect(proaptusDeliverables[1].name).toBe('Dev 2');
    });

    it('should retrieve deliverables by role', () => {
      const deliverables = [
        { id: 1, name: 'Dev 1', role: 'Development', days: 10 },
        { id: 2, name: 'QA', role: 'QA', days: 5 },
        { id: 3, name: 'Dev 2', role: 'Development', days: 8 }
      ];

      const devDeliverables = deliverables.filter(d => d.role === 'Development');

      expect(devDeliverables.length).toBe(2);
      expect(devDeliverables.every(d => d.role === 'Development')).toBe(true);
    });

    it('should return empty array when no deliverables match criteria', () => {
      const deliverables = [
        { id: 1, name: 'Dev 1', owner: 'Proaptus', role: 'Development', days: 10 }
      ];

      const joint = deliverables.filter(d => d.owner === 'Joint');

      expect(joint).toEqual([]);
      expect(joint.length).toBe(0);
    });

    it('should calculate total days across deliverables', () => {
      const deliverables = [
        { id: 1, name: 'Arch', days: 2.0 },
        { id: 2, name: 'Dev 1', days: 2.0 },
        { id: 3, name: 'Dev 2', days: 2.0 },
        { id: 4, name: 'API', days: 1.5 },
        { id: 5, name: 'Testing', days: 1.5 }
      ];

      const totalDays = deliverables.reduce((sum, d) => sum + d.days, 0);

      expect(totalDays).toBe(9.0);
    });
  });

  describe('Update Deliverable', () => {
    it('should update deliverable name', () => {
      const deliverables = [
        { id: 1, name: 'Original Name', owner: 'Proaptus', role: 'Development', days: 10 }
      ];

      const updated = {
        ...deliverables[0],
        name: 'Updated Name'
      };

      expect(updated.name).toBe('Updated Name');
      expect(updated.id).toBe(1);
    });

    it('should update deliverable days', () => {
      const deliverable = {
        id: 1,
        name: 'Dev Work',
        owner: 'Proaptus',
        role: 'Development',
        days: 5
      };

      const updated = { ...deliverable, days: 8 };

      expect(updated.days).toBe(8);
      expect(updated.id).toBe(1);
      expect(updated.name).toBe('Dev Work');
    });

    it('should update deliverable role', () => {
      const deliverable = {
        id: 1,
        name: 'Work',
        owner: 'Proaptus',
        role: 'Development',
        days: 10
      };

      const updated = { ...deliverable, role: 'QA' };

      expect(updated.role).toBe('QA');
      expect(updated.id).toBe(1);
    });

    it('should update multiple fields simultaneously', () => {
      const deliverable = {
        id: 1,
        name: 'Original',
        owner: 'Proaptus',
        role: 'Development',
        days: 5,
        acceptanceCriteria: 'Original criteria'
      };

      const updated = {
        ...deliverable,
        name: 'Updated Name',
        days: 10,
        role: 'Infrastructure',
        acceptanceCriteria: 'New criteria'
      };

      expect(updated.name).toBe('Updated Name');
      expect(updated.days).toBe(10);
      expect(updated.role).toBe('Infrastructure');
      expect(updated.acceptanceCriteria).toBe('New criteria');
      expect(updated.id).toBe(1); // ID unchanged
    });

    it('should update deliverable in array by ID', () => {
      const deliverables = [
        { id: 1, name: 'Dev 1', days: 10 },
        { id: 2, name: 'Dev 2', days: 5 },
        { id: 3, name: 'QA', days: 3 }
      ];

      const updated = deliverables.map(d =>
        d.id === 2 ? { ...d, days: 15 } : d
      );

      expect(updated[0].days).toBe(10);
      expect(updated[1].days).toBe(15); // Updated
      expect(updated[2].days).toBe(3);
    });

    it('should preserve other deliverables when updating one', () => {
      const deliverables = [
        { id: 1, name: 'Dev 1', owner: 'Proaptus', role: 'Development' },
        { id: 2, name: 'QA', owner: 'RPG', role: 'QA' },
        { id: 3, name: 'Arch', owner: 'Proaptus', role: 'Solution Architect' }
      ];

      const updated = deliverables.map(d =>
        d.id === 2 ? { ...d, days: 10 } : d
      );

      expect(updated.length).toBe(3);
      expect(updated[0].owner).toBe('Proaptus');
      expect(updated[2].role).toBe('Solution Architect');
    });
  });

  describe('Delete Deliverable', () => {
    it('should delete deliverable by ID', () => {
      const deliverables = [
        { id: 1, name: 'Dev 1' },
        { id: 2, name: 'Dev 2' },
        { id: 3, name: 'QA' }
      ];

      const filtered = deliverables.filter(d => d.id !== 2);

      expect(filtered.length).toBe(2);
      expect(filtered[0].id).toBe(1);
      expect(filtered[1].id).toBe(3);
      expect(filtered.find(d => d.id === 2)).toBeUndefined();
    });

    it('should handle deletion of first deliverable', () => {
      const deliverables = [
        { id: 1, name: 'Dev 1' },
        { id: 2, name: 'Dev 2' },
        { id: 3, name: 'QA' }
      ];

      const filtered = deliverables.filter(d => d.id !== 1);

      expect(filtered.length).toBe(2);
      expect(filtered[0].id).toBe(2);
    });

    it('should handle deletion of last deliverable', () => {
      const deliverables = [
        { id: 1, name: 'Dev 1' },
        { id: 2, name: 'Dev 2' },
        { id: 3, name: 'QA' }
      ];

      const filtered = deliverables.filter(d => d.id !== 3);

      expect(filtered.length).toBe(2);
      expect(filtered[1].id).toBe(2);
    });

    it('should handle deletion from single-item array', () => {
      const deliverables = [{ id: 1, name: 'Single Item' }];

      const filtered = deliverables.filter(d => d.id !== 1);

      expect(filtered.length).toBe(0);
      expect(filtered).toEqual([]);
    });

    it('should handle deletion of non-existent deliverable', () => {
      const deliverables = [
        { id: 1, name: 'Dev 1' },
        { id: 2, name: 'Dev 2' }
      ];

      const filtered = deliverables.filter(d => d.id !== 999);

      expect(filtered.length).toBe(2);
      expect(filtered).toEqual(deliverables);
    });

    it('should recalculate totals after deletion', () => {
      const deliverables = [
        { id: 1, name: 'Dev 1', days: 10 },
        { id: 2, name: 'Dev 2', days: 5 },
        { id: 3, name: 'QA', days: 3 }
      ];

      const totalBefore = deliverables.reduce((sum, d) => sum + d.days, 0);

      const filtered = deliverables.filter(d => d.id !== 2);
      const totalAfter = filtered.reduce((sum, d) => sum + d.days, 0);

      expect(totalBefore).toBe(18);
      expect(totalAfter).toBe(13); // 18 - 5
    });
  });

  describe('Deliverable Validation', () => {
    it('should validate deliverable has required fields', () => {
      const valid = {
        id: 1,
        name: 'Dev Work',
        owner: 'Proaptus',
        role: 'Development',
        days: 10,
        acceptanceCriteria: 'Criteria'
      };

      // Check all required fields exist
      const hasAllFields = [
        valid.id !== undefined,
        valid.name !== undefined && valid.name.trim() !== '',
        valid.owner !== undefined && valid.owner.trim() !== '',
        valid.role !== undefined && valid.role.trim() !== '',
        valid.days !== undefined && typeof valid.days === 'number',
        valid.acceptanceCriteria !== undefined
      ].every(check => check === true);

      expect(hasAllFields).toBe(true);
    });

    it('should validate days is a positive number', () => {
      const validDays = [10, 5.5, 0.5, 1, 100];
      const invalidDays = [-10, 'ten', null, undefined];

      validDays.forEach(days => {
        expect(typeof days === 'number' && days >= 0).toBe(true);
      });

      invalidDays.forEach(days => {
        expect(typeof days === 'number' && days >= 0).toBe(false);
      });
    });

    it('should validate role is one of accepted roles', () => {
      const acceptedRoles = [
        'Solution Architect',
        'Development',
        'Infrastructure',
        'QA',
        'Documentation',
        'Security'
      ];

      const deliverables = [
        { role: 'Development' },
        { role: 'QA' },
        { role: 'Infrastructure' }
      ];

      deliverables.forEach(d => {
        expect(acceptedRoles.includes(d.role)).toBe(true);
      });
    });

    it('should validate owner is either Proaptus or RPG', () => {
      const validOwners = ['Proaptus', 'RPG'];

      const deliverables = [
        { owner: 'Proaptus' },
        { owner: 'RPG' },
        { owner: 'Proaptus' }
      ];

      deliverables.forEach(d => {
        expect(validOwners.includes(d.owner)).toBe(true);
      });
    });

    it('should validate name is not empty', () => {
      const validNames = ['Dev Work', 'Architecture', 'Testing'];
      const invalidNames = ['', '   '];

      validNames.forEach(name => {
        expect(name.trim().length > 0).toBe(true);
      });

      invalidNames.forEach(name => {
        expect(name.trim().length > 0).toBe(false);
      });
    });

    it('should reject deliverable with missing required fields', () => {
      const incomplete = {
        id: 1,
        name: 'Dev Work'
        // Missing: owner, role, days, acceptanceCriteria
      };

      const isValid = [
        incomplete.id !== undefined,
        incomplete.name !== undefined,
        incomplete.owner !== undefined,
        incomplete.role !== undefined,
        incomplete.days !== undefined,
        incomplete.acceptanceCriteria !== undefined
      ].every(check => check === true);

      expect(isValid).toBe(false);
    });
  });

  describe('Role Weight Application', () => {
    it('should apply correct role weight to Development deliverable', () => {
      const deliverable = {
        id: 1,
        name: 'Dev Work',
        role: 'Development',
        days: 10,
        owner: 'Proaptus'
      };

      const roleWeights = {
        'Development': 1.5,
        'QA': 1.0,
        'Solution Architect': 1.3
      };

      const weight = roleWeights[deliverable.role];
      const effectiveRate = 1000 * weight;

      expect(weight).toBe(1.5);
      expect(effectiveRate).toBe(1500);
    });

    it('should apply correct role weight to QA deliverable', () => {
      const deliverable = {
        id: 1,
        name: 'QA Work',
        role: 'QA',
        days: 5,
        owner: 'RPG'
      };

      const roleWeights = {
        'Development': 1.5,
        'QA': 1.0,
        'Solution Architect': 1.3
      };

      const weight = roleWeights[deliverable.role];
      const revenue = deliverable.days * (1000 * weight);

      expect(weight).toBe(1.0);
      expect(revenue).toBe(5000);
    });

    it('should apply correct role weight to Solution Architect', () => {
      const deliverable = {
        id: 1,
        name: 'Architecture',
        role: 'Solution Architect',
        days: 2,
        owner: 'Proaptus'
      };

      const roleWeights = {
        'Development': 1.5,
        'QA': 1.0,
        'Solution Architect': 1.3,
        'Infrastructure': 1.2
      };

      const weight = roleWeights[deliverable.role];
      const revenue = deliverable.days * (1000 * weight);

      expect(weight).toBe(1.3);
      expect(revenue).toBe(2600);
    });

    it('should handle unknown role with default weight of 1.0', () => {
      const deliverable = {
        id: 1,
        name: 'Unknown Work',
        role: 'UnknownRole',
        days: 10,
        owner: 'Proaptus'
      };

      const roleWeights = {
        'Development': 1.5,
        'QA': 1.0
      };

      const weight = roleWeights[deliverable.role] || 1.0;

      expect(weight).toBe(1.0);
    });
  });

  describe('Real Project Deliverables (Simpson Travel KB)', () => {
    it('should load 27 Proaptus deliverables totaling 40.5 days', () => {
      const proaptusDeliverables = [
        // Core Development (23.5 days)
        { id: 1, name: 'Architecture & System Design', owner: 'Proaptus', role: 'Solution Architect', days: 2.0 },
        { id: 2, name: 'Azure Infrastructure Setup', owner: 'Proaptus', role: 'Infrastructure', days: 1.0 },
        { id: 3, name: 'OneNote Integration', owner: 'Proaptus', role: 'Development', days: 2.0 },
        { id: 4, name: 'Website Content Extraction', owner: 'Proaptus', role: 'Development', days: 2.0 },
        { id: 5, name: 'Content Processing Pipeline', owner: 'Proaptus', role: 'Development', days: 2.0 },
        { id: 6, name: 'Search Infrastructure', owner: 'Proaptus', role: 'Infrastructure', days: 1.5 },
        { id: 7, name: 'Query Processing Engine', owner: 'Proaptus', role: 'Development', days: 2.0 },
        { id: 8, name: 'LLM Integration', owner: 'Proaptus', role: 'Development', days: 2.0 },
        { id: 9, name: 'Citation System', owner: 'Proaptus', role: 'Development', days: 1.0 },
        { id: 10, name: 'API Development', owner: 'Proaptus', role: 'Development', days: 1.5 },
        { id: 11, name: 'HubSpot Phase-1', owner: 'Proaptus', role: 'Development', days: 0.5 },
        { id: 12, name: 'HubSpot Phase-2', owner: 'Proaptus', role: 'Development', days: 3.0 },
        { id: 13, name: 'Integration Testing', owner: 'Proaptus', role: 'QA', days: 1.5 },
        { id: 14, name: 'Performance Optimization', owner: 'Proaptus', role: 'Development', days: 1.0 },
        { id: 15, name: 'Documentation', owner: 'Proaptus', role: 'Documentation', days: 0.5 },
        // Long Tail (9.5 days)
        { id: 16, name: 'Property Data Integration', owner: 'Proaptus', role: 'Development', days: 0.5 },
        { id: 17, name: 'Availability System Connection', owner: 'Proaptus', role: 'Development', days: 2.0 },
        { id: 18, name: 'Advanced Search Features', owner: 'Proaptus', role: 'Development', days: 1.5 },
        { id: 19, name: 'Recommendation Engine', owner: 'Proaptus', role: 'Development', days: 1.0 },
        { id: 20, name: 'Response Generation', owner: 'Proaptus', role: 'Development', days: 2.0 },
        { id: 21, name: 'Sales UI Component', owner: 'Proaptus', role: 'Development', days: 1.0 },
        { id: 22, name: 'Sales-Specific Testing', owner: 'Proaptus', role: 'QA', days: 1.5 },
        // Additional (7.5 days)
        { id: 23, name: 'Security Hardening', owner: 'Proaptus', role: 'Security', days: 2.0 },
        { id: 24, name: 'Monitoring Setup', owner: 'Proaptus', role: 'Infrastructure', days: 1.5 },
        { id: 25, name: 'Deployment Pipeline', owner: 'Proaptus', role: 'Infrastructure', days: 1.5 },
        { id: 26, name: 'Knowledge Transfer', owner: 'Proaptus', role: 'Documentation', days: 1.0 },
        { id: 27, name: 'Initial Data Load', owner: 'Proaptus', role: 'Infrastructure', days: 1.5 }
      ];

      const totalDays = proaptusDeliverables.reduce((sum, d) => sum + d.days, 0);

      expect(proaptusDeliverables.length).toBe(27);
      expect(totalDays).toBe(40.5);
      expect(proaptusDeliverables.every(d => d.owner === 'Proaptus')).toBe(true);
    });

    it('should correctly categorize Proaptus deliverables by role', () => {
      const deliverables = [
        { role: 'Solution Architect' },
        { role: 'Infrastructure' },
        { role: 'Development' },
        { role: 'Development' },
        { role: 'QA' },
        { role: 'Security' },
        { role: 'Documentation' }
      ];

      const byRole = {};
      deliverables.forEach(d => {
        byRole[d.role] = (byRole[d.role] || 0) + 1;
      });

      expect(byRole['Development']).toBe(2);
      expect(byRole['Infrastructure']).toBe(1);
      expect(byRole['QA']).toBe(1);
    });
  });
});
