# Red Pegasus Testing Implementation Handover

**Created**: 2025-10-31
**For**: Next Agent/Developer
**Status**: READY FOR HANDOFF
**Estimated Effort**: 80-100 hours (4 weeks, 1 developer)

---

## 🎯 Mission Summary

Implement comprehensive test coverage for Red Pegasus Pricing Calculator to achieve **85%+ coverage** and catch runtime errors before production.

**Current State**: ~5% coverage (1 test running)
**Target State**: 85%+ coverage across all critical paths
**Success Criteria**: All Phase 1-3 tests passing + no regressions

---

## 📋 Prerequisites & Dependencies

### Required Knowledge
- ✅ React testing with Vitest + React Testing Library
- ✅ GCS (Google Cloud Storage) API integration
- ✅ Mock patterns (vi.mock, vi.spyOn)
- ✅ Async/await testing patterns
- ✅ Red Pegasus calculation model (value-days, role weights, revenue allocation)

### Required Tools
- ✅ Node.js 22+
- ✅ npm 10+
- ✅ Vitest (already installed)
- ✅ React Testing Library (already installed)
- ✅ @testing-library/jest-dom (already installed)

### Files to Understand FIRST
1. `src/components/RedPegasusPricingCalculator.jsx` (1685 lines - main component)
2. `src/components/RedPegasusPricingCalculator.test.jsx` (105 lines - existing tests)
3. `src/components/RedPegasusPricingCalculator.spec.jsx` (338 lines - skipped tests)
4. `src/services/gcsStorage.js` (282 lines - GCS integration)
5. `tests/setup.js` (mock infrastructure)
6. `src/components/pricing/shared/validation.js` (validation logic)

### Context Documents
- 📖 Read: `TEST_COVERAGE_ANALYSIS.md` (this repo)
- 📖 Read: `CLAUDE.md` (project patterns)
- 📖 Reference: `package.json` for test scripts

---

## 🏗️ Project Structure

```
red-pegasus/
├── src/
│   ├── components/
│   │   ├── RedPegasusPricingCalculator.jsx          [MAIN COMPONENT]
│   │   ├── RedPegasusPricingCalculator.test.jsx     [ACTIVE TESTS]
│   │   ├── RedPegasusPricingCalculator.spec.jsx     [SKIPPED - ASPIRATIONAL]
│   │   ├── pricing/
│   │   │   ├── MarginAnalysis.jsx
│   │   │   ├── MarginAnalysis.test.jsx              [TO IMPLEMENT]
│   │   │   ├── InfoIcon.jsx                         [NEW - NEEDS TESTS]
│   │   │   ├── HelpModal.jsx                        [NEW - NEEDS TESTS]
│   │   │   ├── helpContent.jsx                      [NEW - NEEDS TESTS]
│   │   │   └── shared/
│   │   │       ├── validation.js                    [100% COVERED]
│   │   │       ├── formatGBP.js                     [100% COVERED]
│   │   │       └── validation.test.js               [REFERENCE]
│   ├── services/
│   │   └── gcsStorage.js                            [NEEDS INTEGRATION TESTS]
│   └── main.jsx
├── tests/
│   ├── setup.js                                      [MOCK INFRASTRUCTURE]
│   ├── integration/
│   │   ├── ProjectManagement.test.jsx               [SKIPPED - TO IMPLEMENT]
│   │   ├── NewProjectCreation.test.tsx              [SKIPPED]
│   │   ├── RedPegasusPricingCalculator.test.tsx     [SKIPPED]
│   │   └── ServerConnectivity.test.tsx              [SKIPPED]
│   └── unit/
│       └── ProjectOperations.test.js                [SKELETON]
├── TEST_COVERAGE_ANALYSIS.md                        [ANALYSIS DOCUMENT]
├── TESTING_HANDOVER.md                              [THIS FILE]
├── package.json                                      [TEST SCRIPTS]
└── vitest.config.js                                 [TEST CONFIG]
```

---

## 📅 Implementation Timeline: 4-Week Plan

### Week 1: Phase 1 - Critical Path (50% Coverage)
**Goal**: Test GCS integration, calculations, deliverables CRUD

#### Day 1-2: Setup & GCS Tests
- [ ] Create `tests/unit/gcsStorage.test.js`
  - Test `saveProjectsToGCS()` with mock fetch
  - Test `loadProjectsFromGCS()` success/failure
  - Test `saveRoleWeightsToGCS()`
  - Test `loadRoleWeightsFromGCS()`
  - Test error handling (network failures, invalid JSON)

#### Day 3-4: Calculation Tests
- [ ] Create `tests/unit/calculations.test.js`
  - Test `calculateRedPegasusModel()` core logic
  - Test value-days calculation (days × role weight)
  - Test revenue allocation
  - Test account manager 10% uplift
  - Test edge cases (0 days, no deliverables, etc.)

#### Day 5: Deliverables Tests
- [ ] Create `tests/unit/deliverables.test.js`
  - Test deliverable CRUD operations
  - Test role weight application
  - Test deliverable validation
  - Test deliverable total calculations

**Target**: 50% coverage, Phase 1 complete

---

### Week 2: Phase 2 - Form Handling (70% Coverage)
**Goal**: Test form inputs, state management, edit toggles

#### Day 1-2: Input Validation Tests
- [ ] Create `tests/integration/FormInputs.test.jsx`
  - Test each form field (clientRate, soldDays, projectName, etc.)
  - Test validation on invalid inputs
  - Test number input boundaries
  - Test text input sanitization

#### Day 3-4: State Management Tests
- [ ] Create `tests/integration/FormState.test.jsx`
  - Test form state updates on input change
  - Test edit/done toggle functionality
  - Test concurrent field edits
  - Test state persistence

#### Day 5: Edit Toggle Tests
- [ ] Expand `FormState.test.jsx`
  - Test Edit button enables form
  - Test Done button saves and disables form
  - Test Cancel functionality

**Target**: 70% coverage, Phase 2 complete

---

### Week 3: Phase 3 - Help System & UI (85% Coverage)
**Goal**: Test help icons, modals, UI interactions

#### Day 1-2: Info Icon Tests
- [ ] Create `tests/unit/InfoIcon.test.jsx`
  - Test info icon renders next to headers
  - Test click opens help modal
  - Test icon styling and hover states
  - Test accessibility (aria-labels)

#### Day 3: Help Modal Tests
- [ ] Create `tests/unit/HelpModal.test.jsx`
  - Test modal displays correct content
  - Test modal close button
  - Test ESC key closes modal
  - Test content sections render properly

#### Day 4: UI State Tests
- [ ] Create `tests/integration/UIState.test.jsx`
  - Test section expand/collapse
  - Test modal visibility
  - Test validation alert display
  - Test multiple UI states don't conflict

#### Day 5: Help Content Tests
- [ ] Create `tests/unit/helpContent.test.js`
  - Test help content structure
  - Test all sections have content
  - Test example sections format correctly

**Target**: 85% coverage, Phase 3 complete

---

### Week 4: Phase 4 - Edge Cases & Polish (95% Coverage)
**Goal**: Test error recovery, race conditions, large data

#### Day 1-2: Error Recovery Tests
- [ ] Create `tests/integration/ErrorHandling.test.jsx`
  - Test GCS read failure fallback
  - Test GCS write failure recovery
  - Test network timeout handling
  - Test corrupt data handling

#### Day 3: Race Condition Tests
- [ ] Create `tests/integration/RaceConditions.test.jsx`
  - Test concurrent saves (last-write-wins)
  - Test concurrent edit + autosave
  - Test duplicate form submissions

#### Day 4-5: Edge Cases & Polish
- [ ] Create `tests/unit/EdgeCases.test.js`
  - Test very large deliverable lists
  - Test very large numbers (revenue overflow)
  - Test empty project state
  - Test cleanup on component unmount

**Target**: 95% coverage, All phases complete

---

## 🧪 Test Implementation Guide

### Test File Structure Template

```javascript
// tests/unit/[feature].test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * [Feature] Tests
 *
 * Coverage:
 * - ✅ Happy path scenarios
 * - ✅ Error handling
 * - ✅ Edge cases
 * - ✅ Integration points
 */
describe('[Feature Name]', () => {
  // Setup/teardown
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  describe('[Functionality 1]', () => {
    it('should [specific behavior]', () => {
      // Arrange
      const input = {...};

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expectedValue);
    });

    it('should handle error case', () => {
      // Arrange: set up error condition

      // Act & Assert
      expect(() => functionUnderTest(invalidInput))
        .toThrow(ExpectedError);
    });
  });

  describe('[Functionality 2]', () => {
    // More tests...
  });
});
```

---

## 🎯 Phase 1: GCS Integration Tests (DETAILED)

### File: `tests/unit/gcsStorage.test.js`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveProjectsToGCS,
  loadProjectsFromGCS,
  saveRoleWeightsToGCS,
  loadRoleWeightsFromGCS,
  initializeGCS
} from '../../src/services/gcsStorage';

describe('GCS Storage Integration', () => {
  const mockCredentials = {
    client_email: 'test@test.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
  };

  const mockProject = {
    id: 'test-project',
    name: 'Test Project',
    deliverables: [
      { id: 1, name: 'Dev', owner: 'RPG', role: 'Development', days: 5 }
    ],
    clientRate: 950,
    soldDays: 45
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  describe('saveProjectsToGCS', () => {
    it('should save projects and return success', async () => {
      // Arrange
      const projectsData = { 'test-project': mockProject };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      // Act
      const result = await saveProjectsToGCS(projectsData);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('red-pegasus-pricing-data'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toBeTruthy();
    });

    it('should throw error on network failure', async () => {
      // Arrange
      global.fetch.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(saveProjectsToGCS({}))
        .rejects.toThrow('Network error');
    });

    it('should throw error on GCS HTTP error', async () => {
      // Arrange
      global.fetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      // Act & Assert
      await expect(saveProjectsToGCS({}))
        .rejects.toThrow();
    });
  });

  describe('loadProjectsFromGCS', () => {
    it('should load projects from GCS', async () => {
      // Arrange
      const projectsData = { 'test-project': mockProject };
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(projectsData))
      });

      // Act
      const result = await loadProjectsFromGCS();

      // Assert
      expect(result).toEqual(projectsData);
      expect(result['test-project'].name).toBe('Test Project');
    });

    it('should handle empty project list', async () => {
      // Arrange
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({}))
      });

      // Act
      const result = await loadProjectsFromGCS();

      // Assert
      expect(result).toEqual({});
    });

    it('should throw error on invalid JSON', async () => {
      // Arrange
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('{ invalid json')
      });

      // Act & Assert
      await expect(loadProjectsFromGCS())
        .rejects.toThrow();
    });

    it('should throw error on GCS 404', async () => {
      // Arrange
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      // Act & Assert
      await expect(loadProjectsFromGCS())
        .rejects.toThrow();
    });
  });

  describe('saveRoleWeightsToGCS', () => {
    it('should save role weights', async () => {
      // Arrange
      const roleWeights = { Development: 1.5, QA: 1.0 };
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      // Act
      const result = await saveRoleWeightsToGCS(roleWeights);

      // Assert
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });
  });

  describe('loadRoleWeightsFromGCS', () => {
    it('should load role weights', async () => {
      // Arrange
      const roleWeights = { Development: 1.5, QA: 1.0 };
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(roleWeights))
      });

      // Act
      const result = await loadRoleWeightsFromGCS();

      // Assert
      expect(result).toEqual(roleWeights);
    });
  });
});
```

**Acceptance Criteria for Phase 1 GCS Tests**:
- ✅ All 4 GCS functions tested (save/load for projects and role weights)
- ✅ Success paths covered
- ✅ Error cases covered (network, 404, 403, invalid JSON)
- ✅ Mock fetch properly configured
- ✅ Tests run without errors: `npm test tests/unit/gcsStorage.test.js`

---

## 🧮 Phase 1: Calculation Tests (DETAILED)

### File: `tests/unit/calculations.test.js`

```javascript
import { describe, it, expect } from 'vitest';

// This function needs to be exported from RedPegasusPricingCalculator.jsx
import { calculateRedPegasusModel } from '../../src/components/RedPegasusPricingCalculator';

describe('Red Pegasus Calculation Model', () => {
  const baseInputs = {
    clientRate: 950,
    soldDays: 45,
    accountManagerParty: 'RPG',
    roleWeights: {
      'Development': 1.5,
      'Solution Architect': 1.2,
      'QA': 1.0,
      'Infrastructure': 1.1,
      'Security': 1.3,
      'Documentation': 0.8
    },
    deliverables: [
      {
        id: 1, name: 'Dev Task', owner: 'RPG', role: 'Development', days: 5
      },
      {
        id: 2, name: 'QA Task', owner: 'Proaptus', role: 'QA', days: 3
      }
    ]
  };

  describe('Revenue Calculation', () => {
    it('should calculate total revenue from clientRate and soldDays', () => {
      // Act
      const model = calculateRedPegasusModel(baseInputs);

      // Assert
      // Total Revenue = 950 × 45 = 42,750
      expect(model.totalRevenue).toBe(950 * 45);
    });

    it('should calculate revenue with zero days', () => {
      // Arrange
      const inputs = { ...baseInputs, soldDays: 0 };

      // Act
      const model = calculateRedPegasusModel(inputs);

      // Assert
      expect(model.totalRevenue).toBe(0);
    });

    it('should handle large client rates without overflow', () => {
      // Arrange
      const inputs = { ...baseInputs, clientRate: 1000000, soldDays: 1000 };

      // Act
      const model = calculateRedPegasusModel(inputs);

      // Assert
      expect(model.totalRevenue).toBe(1000000 * 1000);
      expect(Number.isFinite(model.totalRevenue)).toBe(true);
    });
  });

  describe('Value-Days Calculation', () => {
    it('should calculate value-days as days × role weight', () => {
      // Arrange: Dev task is 5 days × 1.5 weight = 7.5 value-days
      const inputs = {
        ...baseInputs,
        deliverables: [
          { id: 1, name: 'Dev', owner: 'RPG', role: 'Development', days: 5 }
        ]
      };

      // Act
      const model = calculateRedPegasusModel(inputs);

      // Assert
      // Should have calculated value-days internally
      expect(model.totalDays).toBe(5); // total actual days
      expect(model.deliverablesWithRevenue).toBeDefined();
      expect(model.deliverablesWithRevenue[0].roleWeight).toBe(1.5);
    });

    it('should handle unknown roles with weight 1.0', () => {
      // Arrange
      const inputs = {
        ...baseInputs,
        deliverables: [
          { id: 1, name: 'Unknown Role', owner: 'RPG', role: 'UnknownRole', days: 10 }
        ]
      };

      // Act
      const model = calculateRedPegasusModel(inputs);

      // Assert
      expect(model.deliverablesWithRevenue[0].roleWeight).toBe(1.0);
    });
  });

  describe('Party Allocations', () => {
    it('should allocate revenue by party', () => {
      // Act
      const model = calculateRedPegasusModel(baseInputs);

      // Assert
      expect(model.partyAllocations).toBeDefined();
      expect(model.partyAllocations['RPG']).toBeDefined();
      expect(model.partyAllocations['Proaptus']).toBeDefined();
    });

    it('should apply 10% uplift to account manager party', () => {
      // Arrange: RPG is account manager
      const inputs = { ...baseInputs, accountManagerParty: 'RPG' };

      // Act
      const model = calculateRedPegasusModel(inputs);

      // Assert
      const rpgAllocation = model.partyAllocations['RPG'];
      expect(rpgAllocation.upliftFactor).toBe(1.1);
      expect(rpgAllocation.adjustedRevenue).toBe(rpgAllocation.revenue * 1.1);
    });

    it('should not apply uplift to non-account-manager party', () => {
      // Arrange: RPG is account manager, so Proaptus should have 1.0
      const inputs = { ...baseInputs, accountManagerParty: 'RPG' };

      // Act
      const model = calculateRedPegasusModel(inputs);

      // Assert
      const proaptusAllocation = model.partyAllocations['Proaptus'];
      expect(proaptusAllocation.upliftFactor).toBe(1.0);
      expect(proaptusAllocation.adjustedRevenue).toBe(proaptusAllocation.revenue);
    });

    it('should calculate correct percentages', () => {
      // Act
      const model = calculateRedPegasusModel(baseInputs);

      // Assert
      const totalPercentage = Object.values(model.partyAllocations)
        .reduce((sum, a) => sum + (a.percentage || 0), 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero deliverables', () => {
      // Arrange
      const inputs = { ...baseInputs, deliverables: [] };

      // Act
      const model = calculateRedPegasusModel(inputs);

      // Assert
      expect(model.totalDays).toBe(0);
      expect(model.deliverablesWithRevenue.length).toBe(0);
    });

    it('should handle negative clientRate gracefully', () => {
      // Arrange: negative rate (should ideally be prevented at input level)
      const inputs = { ...baseInputs, clientRate: -100 };

      // Act - should not crash
      const model = calculateRedPegasusModel(inputs);

      // Assert
      expect(model).toBeDefined();
      expect(Number.isFinite(model.totalRevenue)).toBe(true);
    });

    it('should handle deliverables with zero days', () => {
      // Arrange
      const inputs = {
        ...baseInputs,
        deliverables: [
          { id: 1, name: 'Zero Day Task', owner: 'RPG', role: 'Development', days: 0 }
        ]
      };

      // Act
      const model = calculateRedPegasusModel(inputs);

      // Assert
      expect(model.deliverablesWithRevenue[0].days).toBe(0);
      expect(model.deliverablesWithRevenue[0].revenue).toBe(0);
    });
  });
});
```

**Acceptance Criteria for Calculation Tests**:
- ✅ Test revenue calculation (clientRate × soldDays)
- ✅ Test value-days calculation (days × role weight)
- ✅ Test party allocations
- ✅ Test 10% account manager uplift
- ✅ Test percentage calculations total 100%
- ✅ Test edge cases (0 days, unknown roles, etc.)
- ✅ Tests run: `npm test tests/unit/calculations.test.js`

**NOTE**: You may need to export `calculateRedPegasusModel` from the component first!

---

## 📋 Test Running Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/unit/gcsStorage.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode (auto-rerun on changes)
npm test -- --watch

# Run only failing tests
npm test -- --reporter=verbose
```

---

## 🔍 Quality Checklist for Each Test

Before considering a test complete, verify:

- [ ] **Arrange-Act-Assert Structure**: Clear setup, execution, verification
- [ ] **Descriptive Test Name**: `should [behavior] when [condition]`
- [ ] **Single Responsibility**: One test = one concept
- [ ] **No Flakiness**: Test passes consistently (no timing issues)
- [ ] **Proper Mocking**: External dependencies mocked, not real GCS calls
- [ ] **Error Cases**: Both happy path and error paths tested
- [ ] **Edge Cases**: Boundary values tested
- [ ] **No Console Errors**: Test doesn't generate warning messages
- [ ] **Fast Execution**: Tests complete in <100ms each
- [ ] **Documentation**: JSDoc or inline comments for complex tests

---

## 🚨 Common Pitfalls to Avoid

### ❌ Don't Do This:

```javascript
// BAD: Testing implementation details, not behavior
it('should call setInputs with object', () => {
  expect(setInputs).toHaveBeenCalledWith(expect.any(Object));
});

// BAD: Flaky test dependent on timing
it('should save project', async () => {
  await saveProject(data);
  // No wait! May not be saved yet
  expect(projectLibrary['test']).toBeDefined();
});

// BAD: Test too long, testing too many things
it('should create, save, load, and delete project', () => {
  // 50 lines of test code...
});

// BAD: Mock not properly configured
it('should load from GCS', async () => {
  // Forgot to mock global.fetch
  const result = await loadProjectsFromGCS();
});
```

### ✅ Do This Instead:

```javascript
// GOOD: Clear behavior verification
it('should populate form fields when project is loaded', () => {
  const project = { name: 'Test', clientRate: 950 };
  loadProject(project);
  expect(screen.getByDisplayValue('Test')).toBeTruthy();
  expect(screen.getByDisplayValue('950')).toBeTruthy();
});

// GOOD: Proper async handling
it('should update project library after save', async () => {
  await saveProject(data);
  await waitFor(() => {
    expect(projectLibrary['test']).toBeDefined();
  });
});

// GOOD: Single responsibility
it('should create new project with default values', () => {
  const project = createNewProject('Test');
  expect(project.name).toBe('Test');
  expect(project.clientRate).toBe(950);
});

// GOOD: Mocks properly configured
it('should load projects from GCS', async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(projectData))
    })
  );
  const result = await loadProjectsFromGCS();
  expect(result).toEqual(projectData);
});
```

---

## 📊 Success Metrics

### Coverage Targets by Phase

| Phase | Week | Target Coverage | Key Files | Passing Tests |
|-------|------|-----------------|-----------|---------------|
| 1 | 1 | 50% | GCS, Calculations, Deliverables | 25+ |
| 2 | 2 | 70% | Forms, Inputs, State | 45+ |
| 3 | 3 | 85% | Help System, UI | 60+ |
| 4 | 4 | 95% | Edge Cases, Recovery | 75+ |

### Performance Targets
- ✅ Each test < 100ms
- ✅ Full test suite < 30s
- ✅ No console warnings/errors in tests
- ✅ 0 flaky tests (100% reliable)

---

## 📚 Reference Documentation

### Files Already 100% Tested
```javascript
// These are good examples of well-tested code:
src/components/pricing/shared/validation.js      // 100% coverage
src/components/pricing/shared/formatGBP.js       // 100% coverage
tests/*/validation.test.js                       // Reference test style
```

### Mock Setup Reference
```javascript
// tests/setup.js contains global mock infrastructure
// Check this file for:
// - ResizeObserver mock
// - fetch mock patterns
// - window.confirm mock
// - localStorage mock
```

---

## 🎓 Learning Resources

### Within This Project
- `src/components/pricing/shared/validation.test.js` - Great example tests
- `tests/setup.js` - Mock patterns to copy
- `package.json` - Test scripts and dependencies

### Key Testing Concepts to Apply
1. **Mocking GCS**: `vi.fn()` to mock `fetch`, `saveProjectsToGCS()`
2. **Async Testing**: `await`, `waitFor()`, proper promise handling
3. **React Testing**: `render()`, `screen.getByText()`, `fireEvent`
4. **Error Testing**: `.rejects.toThrow()` for async errors

---

## 🔄 Handoff Checkpoints

**Before Starting Implementation**:
- [ ] Read all "Files to Understand FIRST" (Section 2)
- [ ] Run existing tests: `npm test`
- [ ] Review `TEST_COVERAGE_ANALYSIS.md`
- [ ] Understand Red Pegasus calculation model

**After Each Phase**:
- [ ] All tests in phase passing
- [ ] Coverage report generated
- [ ] No console errors
- [ ] Code review of test structure

**After All 4 Phases**:
- [ ] 95%+ coverage achieved
- [ ] All critical paths tested
- [ ] Performance targets met
- [ ] Code ready for production

---

## 👥 Questions? Escalation Path

### For Test Structure Questions:
Check `validation.test.js` in `shared/` folder - it's a gold standard example

### For GCS Integration Questions:
Review `src/services/gcsStorage.js` and existing mocks in `tests/setup.js`

### For React Testing Library Questions:
Consult `RedPegasusPricingCalculator.test.jsx` (existing integration tests)

### For Red Pegasus Model Questions:
See `calculateRedPegasusModel()` function in main component (lines 57-116)

---

## 📝 Commit Message Template

When committing test code, use this format:

```
test: Implement [Phase N] - [Feature] tests

- Add tests for [specific functionality]
- Achieve [X]% coverage for [component]
- Include [happy path + error cases + edge cases]
- All tests passing, no flaky tests

Coverage increase: X% → Y%
```

Example:
```
test: Implement Phase 1 - GCS Integration tests

- Add tests for save/load projects and role weights
- Achieve 50% coverage for gcsStorage.js
- Include success paths, network failures, invalid JSON
- All 12 GCS tests passing

Coverage increase: 5% → 50%
```

---

## 🎉 Final Success State

When all phases complete, you should have:

✅ 95%+ test coverage across critical paths
✅ 75+ passing unit & integration tests
✅ GCS operations fully tested
✅ Calculation logic validated
✅ Form handling covered
✅ Error recovery verified
✅ Help system tested (new components)
✅ Zero flaky tests
✅ Documentation for next developer
✅ Confidence in production deployment

---

**Status**: Ready for handoff
**Last Updated**: 2025-10-31
**Estimated Completion**: 4 weeks (1 developer, 20 hours/week)

Good luck! 🚀
