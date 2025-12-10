import { describe, it, expect } from 'vitest';
import { validateInputs, getValidationWarnings } from './validation.js';

/**
 * Test suite for validation functions
 * Based on Red Pegasus handover document specifications
 */
describe('validateInputs', () => {
  const DEFAULT_ROLE_WEIGHTS = {
    'Sales': 1.8,
    'Solution Architect': 1.4,
    'Project Management': 1.2,
    'Development': 1.0,
    'QA': 0.8,
    'Junior': 0.6
  };

  it('should return valid for correct inputs', () => {
    const inputs = { clientRate: 950, soldDays: 45 };
    const deliverables = [
      { id: 1, name: 'Development', owner: 'RPG', role: 'Development', days: 10 }
    ];
    const roleWeights = DEFAULT_ROLE_WEIGHTS;

    const result = validateInputs(inputs, deliverables, roleWeights);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should error when client rate is zero or negative', () => {
    const inputs = { clientRate: 0 };
    const deliverables = [{ id: 1, name: 'Dev', owner: 'RPG', role: 'Development', days: 10 }];
    const roleWeights = DEFAULT_ROLE_WEIGHTS;

    const result = validateInputs(inputs, deliverables, roleWeights);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Client rate must be greater than zero');
  });

  it('should error when role weight is negative', () => {
    const inputs = { clientRate: 950 };
    const deliverables = [{ id: 1, name: 'Dev', owner: 'RPG', role: 'Development', days: 10 }];
    const roleWeights = { ...DEFAULT_ROLE_WEIGHTS, 'Development': -0.5 };

    const result = validateInputs(inputs, deliverables, roleWeights);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Development weight cannot be negative');
  });

  it('should error when deliverable has no name', () => {
    const inputs = { clientRate: 950 };
    const deliverables = [{ id: 1, name: '', owner: 'RPG', role: 'Development', days: 10 }];
    const roleWeights = DEFAULT_ROLE_WEIGHTS;

    const result = validateInputs(inputs, deliverables, roleWeights);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Deliverable 1 must have a name');
  });

  it('should error when deliverable has zero or negative days', () => {
    const inputs = { clientRate: 950 };
    const deliverables = [{ id: 1, name: 'Dev', owner: 'RPG', role: 'Development', days: 0 }];
    const roleWeights = DEFAULT_ROLE_WEIGHTS;

    const result = validateInputs(inputs, deliverables, roleWeights);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Deliverable "Dev" must have days > 0');
  });

  it('should error when deliverable has no role', () => {
    const inputs = { clientRate: 950 };
    const deliverables = [{ id: 1, name: 'Dev', owner: 'RPG', role: '', days: 10 }];
    const roleWeights = DEFAULT_ROLE_WEIGHTS;

    const result = validateInputs(inputs, deliverables, roleWeights);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Deliverable "Dev" must have a role assigned');
  });

  it('should error when deliverable has no owner', () => {
    const inputs = { clientRate: 950 };
    const deliverables = [{ id: 1, name: 'Dev', owner: '', role: 'Development', days: 10 }];
    const roleWeights = DEFAULT_ROLE_WEIGHTS;

    const result = validateInputs(inputs, deliverables, roleWeights);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Deliverable "Dev" must have an owner assigned');
  });

  it('should error when deliverables list is empty', () => {
    const inputs = { clientRate: 950 };
    const deliverables = [];
    const roleWeights = DEFAULT_ROLE_WEIGHTS;

    const result = validateInputs(inputs, deliverables, roleWeights);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least one deliverable is required');
  });

  it('should return all errors when multiple validation failures occur', () => {
    const inputs = { clientRate: -100 };
    const deliverables = [
      { id: 1, name: '', owner: '', role: '', days: -5 }
    ];
    const roleWeights = { ...DEFAULT_ROLE_WEIGHTS, 'Sales': -1.0 };

    const result = validateInputs(inputs, deliverables, roleWeights);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3);
  });
});

describe('getValidationWarnings', () => {
  it('should return no warnings for balanced allocation', () => {
    const inputs = { clientRate: 950 };
    const partyAllocation = {
      rpg: { percentage: 40 },
      proaptus: { percentage: 60 }
    };
    const deliverables = [
      { id: 1, name: 'Dev1', owner: 'RPG', role: 'Development', days: 10 },
      { id: 2, name: 'Dev2', owner: 'Proaptus', role: 'Development', days: 15 },
      { id: 3, name: 'Dev3', owner: 'RPG', role: 'QA', days: 5 }
    ];
    const roleWeights = {
      'Sales': 1.8,
      'Development': 1.0,
      'QA': 0.8
    };

    const warnings = getValidationWarnings(inputs, partyAllocation, deliverables, roleWeights);

    expect(warnings).toEqual([]);
  });

  it('should warn when one party dominates (>90%)', () => {
    const inputs = { clientRate: 950 };
    const partyAllocation = {
      rpg: { percentage: 95 },
      proaptus: { percentage: 5 }
    };
    const deliverables = [
      { id: 1, name: 'Dev', owner: 'RPG', role: 'Development', days: 10 }
    ];
    const roleWeights = { 'Development': 1.0 };

    const warnings = getValidationWarnings(inputs, partyAllocation, deliverables, roleWeights);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('RPG has 95');
    expect(warnings[0]).toContain('consider rebalancing');
  });

  it('should warn when role weight deviates significantly from default', () => {
    const inputs = { clientRate: 950 };
    const partyAllocation = {
      rpg: { percentage: 50 },
      proaptus: { percentage: 50 }
    };
    const deliverables = [
      { id: 1, name: 'Dev', owner: 'RPG', role: 'Sales', days: 10 }
    ];
    const roleWeights = {
      'Sales': 5.0  // Default is 1.8, this is way off
    };

    const warnings = getValidationWarnings(inputs, partyAllocation, deliverables, roleWeights);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.includes('Sales weight'))).toBe(true);
  });

  it('should warn when deliverables count is very low (<3)', () => {
    const inputs = { clientRate: 950 };
    const partyAllocation = {
      rpg: { percentage: 50 },
      proaptus: { percentage: 50 }
    };
    const deliverables = [
      { id: 1, name: 'Dev', owner: 'RPG', role: 'Development', days: 10 }
    ];
    const roleWeights = { 'Development': 1.0 };

    const warnings = getValidationWarnings(inputs, partyAllocation, deliverables, roleWeights);

    expect(warnings.some(w => w.includes('more granular deliverables'))).toBe(true);
  });

  it('should warn when client rate is extremely high (>£2000)', () => {
    const inputs = { clientRate: 2500 };
    const partyAllocation = {
      rpg: { percentage: 50 },
      proaptus: { percentage: 50 }
    };
    const deliverables = [
      { id: 1, name: 'Dev1', owner: 'RPG', role: 'Development', days: 10 },
      { id: 2, name: 'Dev2', owner: 'Proaptus', role: 'Development', days: 10 },
      { id: 3, name: 'Dev3', owner: 'RPG', role: 'Development', days: 10 }
    ];
    const roleWeights = { 'Development': 1.0 };

    const warnings = getValidationWarnings(inputs, partyAllocation, deliverables, roleWeights);

    expect(warnings.some(w => w.includes('extremely high'))).toBe(true);
  });

  it('should warn when client rate is very low (<£300)', () => {
    const inputs = { clientRate: 200 };
    const partyAllocation = {
      rpg: { percentage: 50 },
      proaptus: { percentage: 50 }
    };
    const deliverables = [
      { id: 1, name: 'Dev1', owner: 'RPG', role: 'Development', days: 10 },
      { id: 2, name: 'Dev2', owner: 'Proaptus', role: 'Development', days: 10 },
      { id: 3, name: 'Dev3', owner: 'RPG', role: 'Development', days: 10 }
    ];
    const roleWeights = { 'Development': 1.0 };

    const warnings = getValidationWarnings(inputs, partyAllocation, deliverables, roleWeights);

    expect(warnings.some(w => w.includes('very low'))).toBe(true);
  });
});
