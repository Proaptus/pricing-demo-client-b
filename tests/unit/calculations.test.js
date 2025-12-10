import { describe, it, expect } from 'vitest';
import { calculateRedPegasusModel } from '../../src/components/RedPegasusPricingCalculator';

/**
 * UNIT TESTS - Red Pegasus Calculation Model
 *
 * Tests the core calculateRedPegasusModel function which handles:
 * 1. Revenue calculation (clientRate × soldDays)
 * 2. Value-days allocation (days × roleWeight)
 * 3. Party revenue distribution
 * 4. Account manager 10% uplift
 * 5. Edge cases and error handling
 */

describe('calculateRedPegasusModel - Core Calculation Logic', () => {
  describe('Basic Revenue Calculation', () => {
    it('should calculate total revenue as clientRate × soldDays', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [],
        accountManagerParty: 'RPG',
        roleWeights: {}
      });

      expect(model.totalRevenue).toBe(50000); // 1000 × 50
      expect(model.clientRate).toBe(1000);
      expect(model.soldDays).toBe(50);
    });

    it('should handle zero soldDays', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 0,
        deliverables: [],
        accountManagerParty: 'RPG',
        roleWeights: {}
      });

      expect(model.totalRevenue).toBe(0);
      expect(model.totalDays).toBe(0);
    });

    it('should handle very high client rates', () => {
      const model = calculateRedPegasusModel({
        clientRate: 5000,
        soldDays: 100,
        deliverables: [],
        accountManagerParty: 'RPG',
        roleWeights: {}
      });

      expect(model.totalRevenue).toBe(500000);
    });
  });

  describe('Value-Days and Deliverables Calculation', () => {
    it('should calculate deliverable revenue with role weight multiplier', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev Work', role: 'Development', days: 10, owner: 'Proaptus' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      const dev = model.deliverables[0];
      expect(dev.roleWeight).toBe(1.5);
      expect(dev.effectiveRate).toBe(1500); // 1000 × 1.5
      expect(dev.revenue).toBe(15000); // 10 × 1500
    });

    it('should apply default role weight of 1.0 if role not defined', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Work', role: 'UnknownRole', days: 5, owner: 'Proaptus' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      const work = model.deliverables[0];
      expect(work.roleWeight).toBe(1.0);
      expect(work.effectiveRate).toBe(1000);
      expect(work.revenue).toBe(5000);
    });

    it('should calculate total days from all deliverables', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 10, owner: 'Proaptus' },
          { id: 2, name: 'QA', role: 'QA', days: 5, owner: 'RPG' },
          { id: 3, name: 'Arch', role: 'Solution Architect', days: 3, owner: 'Proaptus' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5, QA: 1.0, 'Solution Architect': 1.2 }
      });

      expect(model.totalDays).toBe(18); // 10 + 5 + 3
    });

    it('should handle zero-day deliverables gracefully', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 0, owner: 'Proaptus' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      expect(model.deliverables[0].revenue).toBe(0);
      expect(model.totalDays).toBe(0);
    });
  });

  describe('Party Allocation Logic', () => {
    it('should allocate deliverables by owner (party)', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev 1', role: 'Development', days: 10, owner: 'Proaptus' },
          { id: 2, name: 'Dev 2', role: 'Development', days: 5, owner: 'RPG' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      expect(model.partyAllocations.Proaptus).toBeDefined();
      expect(model.partyAllocations.RPG).toBeDefined();
      expect(model.partyAllocations.Proaptus.days).toBe(10);
      expect(model.partyAllocations.RPG.days).toBe(5);
    });

    it('should calculate correct revenue for each party before uplift', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 10, owner: 'Proaptus' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      // 10 days × (1000 × 1.5) = 15000
      expect(model.partyAllocations.Proaptus.revenue).toBe(15000);
    });

    it('should handle multiple deliverables per party', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev 1', role: 'Development', days: 10, owner: 'Proaptus' },
          { id: 2, name: 'Dev 2', role: 'Development', days: 5, owner: 'Proaptus' },
          { id: 3, name: 'QA', role: 'QA', days: 3, owner: 'RPG' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5, QA: 1.0 }
      });

      // Proaptus: (10 + 5) × 1.5 = 22500
      expect(model.partyAllocations.Proaptus.revenue).toBe(22500);
      // RPG: 3 × 1.0 = 3000
      expect(model.partyAllocations.RPG.revenue).toBe(3000);
    });
  });

  describe('Account Manager 10% Uplift', () => {
    it('should apply 10% uplift to account manager party', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 10, owner: 'RPG' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      const rpg = model.partyAllocations.RPG;
      expect(rpg.upliftFactor).toBe(1.1);
      expect(rpg.adjustedRevenue).toBe(16500); // 15000 × 1.1
    });

    it('should NOT apply uplift to non-account-manager party', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 10, owner: 'Proaptus' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      const proaptus = model.partyAllocations.Proaptus;
      expect(proaptus.upliftFactor).toBe(1.0);
      expect(proaptus.adjustedRevenue).toBe(15000); // No uplift
    });

    it('should apply uplift to Proaptus if Proaptus is account manager', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 10, owner: 'Proaptus' }
        ],
        accountManagerParty: 'Proaptus',
        roleWeights: { Development: 1.5 }
      });

      const proaptus = model.partyAllocations.Proaptus;
      expect(proaptus.upliftFactor).toBe(1.1);
      expect(proaptus.adjustedRevenue).toBe(16500); // 15000 × 1.1
    });
  });

  describe('Revenue Share Normalization', () => {
    it('should normalize shares back to total revenue', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 20, owner: 'Proaptus' },
          { id: 2, name: 'QA', role: 'QA', days: 10, owner: 'RPG' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5, QA: 1.0 }
      });

      // Total revenue should equal sum of final revenues
      const totalFinalRevenue = Object.values(model.partyAllocations).reduce(
        (sum, p) => sum + p.finalRevenue,
        0
      );
      expect(totalFinalRevenue).toBeCloseTo(50000, 2); // Should equal soldDays × clientRate
    });

    it('should calculate percentage correctly', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 20, owner: 'Proaptus' },
          { id: 2, name: 'Dev', role: 'Development', days: 10, owner: 'RPG' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      // Verify percentages sum to ~100
      const totalPercentage = Object.values(model.partyAllocations).reduce(
        (sum, p) => sum + p.percentage,
        0
      );
      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('should handle zero revenue deliverables in normalization', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 20, owner: 'Proaptus' },
          { id: 2, name: 'Placeholder', role: 'Development', days: 0, owner: 'RPG' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      const totalFinalRevenue = Object.values(model.partyAllocations).reduce(
        (sum, p) => sum + p.finalRevenue,
        0
      );
      expect(totalFinalRevenue).toBeCloseTo(50000, 2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty deliverables array', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [],
        accountManagerParty: 'RPG',
        roleWeights: {}
      });

      expect(model.deliverables).toEqual([]);
      expect(model.totalDays).toBe(0);
      expect(model.totalWeightedRevenue).toBe(0);
    });

    it('should handle missing roleWeights parameter', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 10, owner: 'Proaptus' }
        ],
        accountManagerParty: 'RPG'
        // No roleWeights provided
      });

      expect(model.deliverables[0].roleWeight).toBe(1.0);
      expect(model.totalRevenue).toBe(50000);
    });

    it('should handle Simpson Travel KB project calculation', () => {
      // Real project: Simpson Travel KB
      // Proaptus: 40.5 days with role weights
      // RPG: some days
      // Total client rate: 950, sold days: ~85

      const model = calculateRedPegasusModel({
        clientRate: 950,
        soldDays: 85,
        deliverables: [
          { id: 1, name: 'Architecture', role: 'Solution Architect', days: 2, owner: 'Proaptus' },
          { id: 2, name: 'Infrastructure', role: 'Infrastructure', days: 1, owner: 'Proaptus' },
          { id: 3, name: 'Development', role: 'Development', days: 2, owner: 'Proaptus' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: {
          'Solution Architect': 1.3,
          'Infrastructure': 1.2,
          'Development': 1.5,
          'QA': 1.0
        }
      });

      // Verify basic calculations work
      expect(model.totalRevenue).toBe(80750); // 950 × 85
      expect(model.totalDays).toBe(5);
      expect(model.deliverables.length).toBe(3);
    });

    it('should handle very small fractional days', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Code Review', role: 'Development', days: 0.5, owner: 'RPG' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      expect(model.deliverables[0].revenue).toBe(750); // 0.5 × 1500
      expect(model.totalDays).toBe(0.5);
    });

    it('should calculate correct party allocations with multiple roles', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 60,
        deliverables: [
          { id: 1, name: 'Arch', role: 'Solution Architect', days: 2, owner: 'Proaptus' },
          { id: 2, name: 'Dev', role: 'Development', days: 20, owner: 'Proaptus' },
          { id: 3, name: 'QA', role: 'QA', days: 8, owner: 'RPG' },
          { id: 4, name: 'Infra', role: 'Infrastructure', days: 3, owner: 'RPG' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: {
          'Solution Architect': 1.3,
          'Development': 1.5,
          'QA': 1.0,
          'Infrastructure': 1.2
        }
      });

      // Proaptus: (2 × 1.3 + 20 × 1.5) × 1000 = (2600 + 30000) = 32600
      expect(model.partyAllocations.Proaptus.revenue).toBe(32600);
      // RPG: (8 × 1.0 + 3 × 1.2) × 1000 = (8000 + 3600) = 11600
      // With 10% uplift: 11600 × 1.1 = 12760
      expect(model.partyAllocations.RPG.adjustedRevenue).toBeCloseTo(12760, 2);
    });
  });

  describe('Data Structure and Return Values', () => {
    it('should return all required calculation properties', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 10, owner: 'Proaptus' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      // Input echoes
      expect(model.clientRate).toBe(1000);
      expect(model.soldDays).toBe(50);
      expect(model.accountManagerParty).toBe('RPG');

      // Calculations
      expect(model.totalRevenue).toBeDefined();
      expect(model.totalDays).toBeDefined();
      expect(model.totalWeightedRevenue).toBeDefined();
      expect(model.deliverables).toBeDefined();
      expect(model.partyAllocations).toBeDefined();

      // Chart data
      expect(model.partyChartData).toBeDefined();
      expect(model.roleData).toBeDefined();

      // Shortcuts
      expect(model.rpg).toBeDefined();
      expect(model.proaptus).toBeDefined();
      expect(model.total).toBeDefined();
    });

    it('should provide RPG and Proaptus shortcuts', () => {
      const model = calculateRedPegasusModel({
        clientRate: 1000,
        soldDays: 50,
        deliverables: [
          { id: 1, name: 'Dev', role: 'Development', days: 10, owner: 'RPG' },
          { id: 2, name: 'Dev', role: 'Development', days: 5, owner: 'Proaptus' }
        ],
        accountManagerParty: 'RPG',
        roleWeights: { Development: 1.5 }
      });

      // Should have both shortcuts
      expect(model.rpg).toBeDefined();
      expect(model.proaptus).toBeDefined();
      // Should have actual data
      expect(model.rpg.days).toBeGreaterThan(0);
      expect(model.proaptus.days).toBeGreaterThan(0);
    });
  });
});
