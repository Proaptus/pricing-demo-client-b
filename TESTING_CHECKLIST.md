# Red Pegasus Testing Implementation Checklist

**For**: Next Agent/Developer
**Duration**: 4 weeks
**Current Status**: Phase 0 (0% → Ready for Phase 1)

---

## 🚀 Quick Start (Do First)

- [ ] Read `TESTING_HANDOVER.md` (main guide)
- [ ] Read `TEST_COVERAGE_ANALYSIS.md` (problem analysis)
- [ ] Read `CLAUDE.md` (project patterns)
- [ ] Run `npm test` (see current test suite)
- [ ] Run `npm test -- --coverage` (see coverage report)
- [ ] Review `src/services/gcsStorage.js` (understand GCS integration)
- [ ] Review `src/components/RedPegasusPricingCalculator.jsx` (understand component)

---

## 📅 PHASE 1: Critical Path Testing (Week 1)

**Target**: 50% coverage
**Time**: 40 hours
**Success**: All Phase 1 tests passing, 50% coverage

### Task 1.1: GCS Integration Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/unit/gcsStorage.test.js
Tests: 8 tests (save, load, errors, empty data)
Success: All GCS operations tested
```

- [ ] Setup file structure and mocks
- [ ] Write `saveProjectsToGCS()` tests
  - [ ] Happy path (save and return success)
  - [ ] Network error handling
  - [ ] HTTP error handling (403, 404)
- [ ] Write `loadProjectsFromGCS()` tests
  - [ ] Happy path (load valid data)
  - [ ] Empty project list
  - [ ] Invalid JSON error
  - [ ] HTTP errors
- [ ] Write `saveRoleWeightsToGCS()` tests
- [ ] Write `loadRoleWeightsFromGCS()` tests
- [ ] Run tests: `npm test tests/unit/gcsStorage.test.js`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 6 hours

---

### Task 1.2: Calculation Model Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/unit/calculations.test.js
Tests: 12 tests (revenue, value-days, allocations, edge cases)
Success: All calculations validated
```

- [ ] Setup file structure
- [ ] **Revenue Calculation Tests** (3 tests)
  - [ ] Total revenue = clientRate × soldDays
  - [ ] Zero days → zero revenue
  - [ ] Large numbers don't overflow
- [ ] **Value-Days Tests** (2 tests)
  - [ ] Value-days = days × role weight
  - [ ] Unknown roles use default weight 1.0
- [ ] **Party Allocation Tests** (4 tests)
  - [ ] Revenue allocated by party
  - [ ] 10% uplift applied to account manager party
  - [ ] Other parties get no uplift
  - [ ] Percentages total 100%
- [ ] **Edge Cases** (3 tests)
  - [ ] Zero deliverables
  - [ ] Negative clientRate
  - [ ] Deliverables with zero days
- [ ] Run tests: `npm test tests/unit/calculations.test.js`
- [ ] Verify: All tests pass ✅
- [ ] **NOTE**: May need to export `calculateRedPegasusModel` first!

**Estimated Time**: 8 hours

---

### Task 1.3: Deliverables CRUD Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/unit/deliverables.test.js
Tests: 8 tests (create, read, update, delete, validation)
Success: All deliverable operations tested
```

- [ ] Setup file structure and test data
- [ ] **Create Tests** (2 tests)
  - [ ] Add deliverable to project
  - [ ] New deliverable has required fields
- [ ] **Read Tests** (2 tests)
  - [ ] Get deliverable by ID
  - [ ] Get all deliverables by party
- [ ] **Update Tests** (2 tests)
  - [ ] Update deliverable fields (name, days, role)
  - [ ] Updated values persist in state
- [ ] **Delete Tests** (2 tests)
  - [ ] Delete deliverable removes it
  - [ ] Delete updates totals correctly
- [ ] Run tests: `npm test tests/unit/deliverables.test.js`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 6 hours

---

### Task 1.4: Phase 1 Quality Check
```
Status: ⬜ NOT STARTED
Work: Verify Phase 1 completeness
```

- [ ] Run full test suite: `npm test`
- [ ] Check coverage report: `npm test -- --coverage`
- [ ] Verify coverage is ~50%+
- [ ] All Phase 1 tests passing
- [ ] No flaky tests (run 3x, all pass)
- [ ] Build still works: `npm run build`
- [ ] Create commit with Phase 1 tests

**Commit Message**:
```
test: Implement Phase 1 - GCS, Calculations, Deliverables

- Implement GCS integration tests (8 tests)
- Implement calculation model tests (12 tests)
- Implement deliverables CRUD tests (8 tests)
- Achieve 50% coverage

Coverage: 5% → 50%
```

**Estimated Time**: 2 hours

---

## 📅 PHASE 2: Form Handling Testing (Week 2)

**Target**: 70% coverage
**Time**: 40 hours
**Success**: Form inputs and state management fully tested

### Task 2.1: Input Validation Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/integration/FormInputs.test.jsx
Tests: 10+ tests (validate each form field)
```

- [ ] Create test file
- [ ] Test each form input field:
  - [ ] Project Name (text input)
  - [ ] Client Name (text input)
  - [ ] Client Day Rate (number, must be > 0)
  - [ ] Sold Days (number, must be > 0)
  - [ ] Project Code (text)
  - [ ] Account Manager (text)
  - [ ] Status dropdown
  - [ ] Account Manager Party dropdown
  - [ ] Overview textarea
- [ ] Test validation errors display
- [ ] Test validation warnings display
- [ ] Run: `npm test tests/integration/FormInputs.test.jsx`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 8 hours

---

### Task 2.2: Form State Management Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/integration/FormState.test.jsx
Tests: 8 tests (state updates, editing, clearing)
```

- [ ] Test state updates on input change
- [ ] Test Edit button enables form
- [ ] Test Done button saves and disables form
- [ ] Test Cancel button reverts changes
- [ ] Test form clears on new project
- [ ] Test concurrent edits handled properly
- [ ] Test state persists through navigation
- [ ] Run: `npm test tests/integration/FormState.test.jsx`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 6 hours

---

### Task 2.3: Project Operations Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/integration/ProjectOperations.test.jsx
Tests: 10+ tests (create, save, load, delete)
```

- [ ] Test create new project
  - [ ] Form clears
  - [ ] Defaults loaded
  - [ ] New ID generated
- [ ] Test save project
  - [ ] Calls saveProjectsToGCS
  - [ ] Updates projectLibrary
  - [ ] Shows success alert
- [ ] Test load project
  - [ ] All fields populated
  - [ ] Form disabled
  - [ ] Correct project loaded
- [ ] Test delete project
  - [ ] Shows confirmation
  - [ ] Removes from library
  - [ ] Switches to another project
- [ ] Run: `npm test tests/integration/ProjectOperations.test.jsx`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 8 hours

---

### Task 2.4: Phase 2 Quality Check
```
Status: ⬜ NOT STARTED
```

- [ ] Run full suite: `npm test`
- [ ] Check coverage: ~70%+
- [ ] All Phase 1 + Phase 2 tests passing
- [ ] No regressions in Phase 1
- [ ] Build works: `npm run build`
- [ ] Create commit

**Commit Message**:
```
test: Implement Phase 2 - Form Handling and Project Operations

- Implement form input validation tests (10 tests)
- Implement form state management tests (8 tests)
- Implement project operations tests (10 tests)
- Achieve 70% coverage

Coverage: 50% → 70%
```

**Estimated Time**: 2 hours

---

## 📅 PHASE 3: Help System & UI Testing (Week 3)

**Target**: 85% coverage
**Time**: 30 hours
**Success**: Help system and UI interactions tested

### Task 3.1: InfoIcon Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/unit/InfoIcon.test.jsx
Tests: 5 tests
```

- [ ] Test icon renders
- [ ] Test click opens modal
- [ ] Test hover styles
- [ ] Test accessibility (aria-label)
- [ ] Test keyboard focus
- [ ] Run: `npm test tests/unit/InfoIcon.test.jsx`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 3 hours

---

### Task 3.2: HelpModal Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/unit/HelpModal.test.jsx
Tests: 6 tests
```

- [ ] Test modal displays
- [ ] Test title renders
- [ ] Test content renders
- [ ] Test close button works
- [ ] Test ESC key closes modal
- [ ] Test example section (if provided)
- [ ] Run: `npm test tests/unit/HelpModal.test.jsx`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 3 hours

---

### Task 3.3: Help Content Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/unit/helpContent.test.js
Tests: 8 tests
```

- [ ] Test all help sections exist:
  - [ ] projectInformation
  - [ ] projectRevenue
  - [ ] roleWeights
  - [ ] deliverables
  - [ ] profitSplitAnalysis
  - [ ] valueDays
  - [ ] scenarioSelector
  - [ ] keyAssumptions
- [ ] Test each section has content
- [ ] Test each section has example (if applicable)
- [ ] Test content is non-empty string
- [ ] Run: `npm test tests/unit/helpContent.test.js`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 3 hours

---

### Task 3.4: UI State Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/integration/UIState.test.jsx
Tests: 8 tests
```

- [ ] Test section expand/collapse
- [ ] Test validation alert display
- [ ] Test multiple modals don't conflict
- [ ] Test edit toggles don't break other states
- [ ] Test help modal doesn't conflict with form modal
- [ ] Test error modal displays
- [ ] Test alert messages
- [ ] Run: `npm test tests/integration/UIState.test.jsx`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 4 hours

---

### Task 3.5: Phase 3 Quality Check
```
Status: ⬜ NOT STARTED
```

- [ ] Run full suite: `npm test`
- [ ] Check coverage: ~85%+
- [ ] All phases 1-3 passing
- [ ] No regressions
- [ ] Build works: `npm run build`
- [ ] Create commit

**Commit Message**:
```
test: Implement Phase 3 - Help System and UI State

- Implement InfoIcon tests (5 tests)
- Implement HelpModal tests (6 tests)
- Implement help content tests (8 tests)
- Implement UI state management tests (8 tests)
- Achieve 85% coverage

Coverage: 70% → 85%
```

**Estimated Time**: 2 hours

---

## 📅 PHASE 4: Edge Cases & Production Ready (Week 4)

**Target**: 95% coverage
**Time**: 30 hours
**Success**: Production-ready test suite

### Task 4.1: Error Recovery Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/integration/ErrorRecovery.test.jsx
Tests: 8 tests
```

- [ ] Test GCS read failure → fallback to cache
- [ ] Test GCS write failure → show error message
- [ ] Test network timeout → show error
- [ ] Test corrupt JSON → graceful error
- [ ] Test retry mechanism
- [ ] Test error clearing after fix
- [ ] Test user can retry save
- [ ] Run: `npm test tests/integration/ErrorRecovery.test.jsx`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 6 hours

---

### Task 4.2: Race Condition Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/integration/RaceConditions.test.jsx
Tests: 6 tests
```

- [ ] Test concurrent saves (last-write-wins)
- [ ] Test concurrent edit + autosave
- [ ] Test double-click save button
- [ ] Test autosave during edit
- [ ] Test delete while loading
- [ ] Run: `npm test tests/integration/RaceConditions.test.jsx`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 6 hours

---

### Task 4.3: Edge Cases & Boundary Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/unit/EdgeCases.test.js
Tests: 10 tests
```

- [ ] Test very large deliverable list (1000+ items)
- [ ] Test very large revenue numbers
- [ ] Test empty project (no deliverables)
- [ ] Test empty role weights
- [ ] Test single deliverable
- [ ] Test special characters in names
- [ ] Test very long strings
- [ ] Test cleanup on unmount
- [ ] Test memory leaks (setInterval cleanup)
- [ ] Test localStorage quota exceeded
- [ ] Run: `npm test tests/unit/EdgeCases.test.js`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 6 hours

---

### Task 4.4: Performance & Regression Tests
```
Status: ⬜ NOT STARTED
Work: Create tests/integration/Performance.test.jsx
Tests: 4 tests
```

- [ ] Test component renders in < 500ms
- [ ] Test calculation with 100 deliverables
- [ ] Test GCS operations complete in < 5s
- [ ] Test no memory leaks (check refs cleanup)
- [ ] Run: `npm test tests/integration/Performance.test.jsx`
- [ ] Verify: All tests pass ✅

**Estimated Time**: 4 hours

---

### Task 4.5: Final Quality Check & Production Ready
```
Status: ⬜ NOT STARTED
```

- [ ] Run full test suite: `npm test`
- [ ] Check final coverage: 95%+
- [ ] All tests passing (no skipped tests)
- [ ] Run 2x to verify no flaky tests
- [ ] Generate coverage report: `npm test -- --coverage`
- [ ] Run build: `npm run build` ✅
- [ ] Review TEST_COVERAGE_ANALYSIS.md
- [ ] No console warnings/errors
- [ ] All tests fast (< 100ms each)

**Estimated Time**: 4 hours

---

### Task 4.6: Documentation & Handoff
```
Status: ⬜ NOT STARTED
```

- [ ] Document test patterns used
- [ ] Create test data fixtures file
- [ ] Add comments to complex tests
- [ ] Update this checklist with final status
- [ ] Create summary of test coverage
- [ ] Create next-developer guide

**Final Commit Message**:
```
test: Implement Phase 4 - Edge Cases and Production Readiness

- Implement error recovery tests (8 tests)
- Implement race condition tests (6 tests)
- Implement edge case tests (10 tests)
- Implement performance tests (4 tests)
- Achieve 95% coverage

Coverage: 85% → 95%
Tests: 75+ passing
All critical paths covered
Production-ready ✅
```

**Estimated Time**: 4 hours

---

## 📊 Coverage Goals By File

| File | Current | Target | Phase | Status |
|------|---------|--------|-------|--------|
| gcsStorage.js | 0% | 90% | 1 | ⬜ |
| RedPegasusPricingCalculator.jsx | 5% | 85% | 1-4 | ⬜ |
| MarginAnalysis.jsx | 0% | 80% | 3 | ⬜ |
| InfoIcon.jsx | 0% | 90% | 3 | ⬜ |
| HelpModal.jsx | 0% | 90% | 3 | ⬜ |
| helpContent.jsx | 0% | 85% | 3 | ⬜ |
| validation.js | 100% | 100% | N/A | ✅ |
| formatGBP.js | 100% | 100% | N/A | ✅ |

---

## 🎯 Weekly Checklist

### Week 1 Checklist (Phase 1)
- [ ] Day 1-2: GCS tests complete
- [ ] Day 3-4: Calculation tests complete
- [ ] Day 5: Deliverables tests complete
- [ ] Friday: Phase 1 complete, 50% coverage
- [ ] Commit: `test: Phase 1 complete`

### Week 2 Checklist (Phase 2)
- [ ] Day 1-2: Input validation tests
- [ ] Day 3-4: Form state tests
- [ ] Day 5: Project operations tests
- [ ] Friday: Phase 2 complete, 70% coverage
- [ ] Commit: `test: Phase 2 complete`

### Week 3 Checklist (Phase 3)
- [ ] Day 1: InfoIcon + HelpModal tests
- [ ] Day 2: Help content tests
- [ ] Day 3: UI state tests
- [ ] Day 4: Integration verification
- [ ] Friday: Phase 3 complete, 85% coverage
- [ ] Commit: `test: Phase 3 complete`

### Week 4 Checklist (Phase 4)
- [ ] Day 1-2: Error recovery tests
- [ ] Day 2: Race condition tests
- [ ] Day 3: Edge cases + performance
- [ ] Day 4: Final QA and polish
- [ ] Friday: All phases complete, 95% coverage
- [ ] Commit: `test: Phase 4 complete - 95% coverage`

---

## ✅ Final Verification Checklist

Before declaring "DONE":

- [ ] 95%+ coverage achieved
- [ ] 75+ tests passing
- [ ] 0 flaky tests (run 3x, all pass)
- [ ] All critical paths tested
- [ ] Build succeeds: `npm run build`
- [ ] No console errors/warnings
- [ ] Tests run in < 30 seconds
- [ ] Each test < 100ms
- [ ] Code is documented
- [ ] Commit history is clean
- [ ] Next developer can understand tests
- [ ] TEST_COVERAGE_ANALYSIS.md updated
- [ ] TESTING_CHECKLIST.md marked complete

---

## 🚨 If Stuck

**GCS Integration Issues?**
- Review: `tests/setup.js` for mock patterns
- Review: `src/services/gcsStorage.js` for function signatures
- Example: `tests/unit/validation.test.js` for test structure

**Calculation Logic Confusing?**
- Review: `calculateRedPegasusModel()` in main component (lines 57-116)
- Read: Model explanation in component JSDoc
- Trace: Manual calculation for test data

**React Testing Issues?**
- Review: `RedPegasusPricingCalculator.test.jsx`
- Reference: React Testing Library docs
- Check: `@testing-library/jest-dom` for matchers

**Build/Dependency Issues?**
- Run: `npm install`
- Run: `npm run build`
- Check: `package.json` for all deps

---

## 📞 Success Handoff

When complete, hand off to QA/Production with:

1. ✅ This checklist marked 100% complete
2. ✅ TEST_COVERAGE_ANALYSIS.md with final numbers
3. ✅ Coverage report (npm test -- --coverage)
4. ✅ List of all test files created
5. ✅ Commit history showing 4-week progression
6. ✅ Note about any production findings

---

**Start Date**: _____________
**Completion Date**: _____________
**Final Coverage**: _____________
**Total Tests**: _____________
**Notes**:

---

*Last Updated: 2025-10-31*
*Status: Ready for handoff*
*Good luck! 🚀*
