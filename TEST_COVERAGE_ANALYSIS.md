# Red Pegasus Test Coverage Analysis

**Generated**: 2025-10-31
**Status**: CRITICAL GAPS IDENTIFIED - Test coverage is insufficient for production quality

---

## Executive Summary

**Coverage Level**: ~5% (1 test running out of 20+ defined)
**Critical Issues Found**: 1 (Fixed: undefined `api` variable)
**High Priority Gaps**: 8 major functional areas
**Recommendation**: IMMEDIATE - Implement comprehensive test suite before production

---

## Current Test Status

### Active Tests
- ✅ `RedPegasusPricingCalculator.test.jsx` - **1 test running** (basic render without crashing)
  - No form interaction testing
  - No calculation validation
  - No state management testing

### Skipped Tests
- ⏭️ `RedPegasusPricingCalculator.spec.jsx` - **37 tests SKIPPED** (aspirational feature tests)
- ⏭️ `ProjectManagement.test.jsx` - **All tests SKIPPED** (save/load/autosave integration)
- ⏭️ Unit tests for individual components

---

## Critical Issue Found & Fixed

### ❌ Issue: Undefined `api` Variable
**Severity**: HIGH (Runtime Error)
**File**: `RedPegasusPricingCalculator.jsx:494`
**Function**: `saveRoleWeightsChanges()`
**Problem**: Code called `api.saveRoleWeights()` but `api` was never imported or defined
**Impact**: Role weights save feature would fail at runtime if user tried to edit weights
**Status**: ✅ FIXED - Changed to use `saveRoleWeightsToGCS()` which is properly imported

**Root Cause**: Function was written but never tested. Only caught because user attempted to edit role weights during manual testing.

---

## Test Coverage Gaps Analysis

### 1. ❌ Form Input Handling (Not Tested)
**Components Affected**:
- Project Information form
- Project Revenue inputs (clientRate, soldDays)
- Role Weights editor
- Deliverables table (add, edit, delete)
- Acceptance Criteria textarea

**Missing Tests**:
- Input validation (empty values, invalid numbers, negative values)
- Form state updates on input change
- Tab navigation through form fields
- Edit/Done toggle functionality
- Alert messages on validation errors

**Example Vulnerability**: User enters `-100` for client rate → should reject, but not tested

---

### 2. ❌ Project Lifecycle Operations (Not Tested)
**Components Affected**:
- Create New Project
- Load Project from Library
- Save Project
- Delete Project
- Autosave to GCS

**Missing Tests**:
- Create project → loads empty form ✗
- Save project → updates GCS ✗
- Load project → populates all fields ✗
- Delete project → removes from library ✗
- Autosave → triggers every 5s ✗
- Autosave error handling ✗
- Concurrent saves handling ✗

**Risk**: Data loss if autosave fails silently or saves corrupt data

---

### 3. ❌ GCS Integration (Partially Tested)
**Components Affected**:
- `loadProjectsFromGCS()`
- `saveProjectsToGCS()`
- `saveRoleWeightsToGCS()`
- `loadRoleWeightsFromGCS()`
- JWT authentication

**Missing Tests**:
- Network failures during read ✗
- Network failures during write ✗
- Corrupt JSON recovery ✗
- Concurrent saves race condition ✗
- GCS credentials not found ✗
- Token refresh on expiry ✗
- Empty project library ✗
- Large project file handling ✗

**Risk**: Data corruption if network fails mid-save

---

### 4. ❌ Calculation & Model Logic (Not Tested)
**Components Affected**:
- `calculateRedPegasusModel()` - Core calculation engine
- Revenue allocation by value-days
- Role weight multipliers
- Account manager 10% uplift

**Missing Tests**:
- Value-days calculation (days × role weight) ✗
- Revenue allocation accuracy ✗
- Account manager uplift applied correctly ✗
- Edge cases (0 days, 0 weight, no deliverables) ✗
- Large numbers don't overflow ✗
- Negative value handling ✗

**Risk**: Silent calculation errors leading to incorrect pricing

---

### 5. ❌ Deliverables Management (Not Tested)
**Components Affected**:
- Add deliverable button
- Edit deliverable fields
- Delete deliverable
- Deliverable validation
- Acceptance criteria display

**Missing Tests**:
- Add deliverable → appends to list ✗
- Edit deliverable → updates fields ✗
- Delete deliverable → removes from list ✗
- Role selection → updates effective rate ✗
- Days input → validates positive numbers ✗
- Acceptance criteria → saves/displays correctly ✗

**Risk**: Deliverables silently fail to save

---

### 6. ❌ Help System (Not Tested)
**Components Added**: Info icons + Help modals (TODAY)
**Missing Tests**:
- Info icon visible next to headers ✗
- Click info icon → opens modal ✗
- Modal displays correct content ✗
- Modal close button works ✗
- ESC key closes modal ✗
- Multiple modals don't conflict ✗

**Risk**: Help system may have UX bugs since just implemented

---

### 7. ❌ UI State Management (Not Tested)
**Components Affected**:
- Edit/Done toggles
- Expand/Collapse sections
- Modal visibility states
- Validation alert display

**Missing Tests**:
- Edit button toggles form editable state ✗
- Done button saves and disables form ✗
- Section expand toggles content visibility ✗
- Multiple edits in progress handled correctly ✗
- Validation alerts appear/disappear correctly ✗

**Risk**: UI state becomes inconsistent with data state

---

### 8. ❌ Error Recovery (Not Tested)
**Scenarios Not Covered**:
- GCS authentication fails → Show error message ✗
- GCS save fails → Retry mechanism ✗
- GCS read fails → Load from local cache ✗
- Invalid JSON from GCS → Graceful fallback ✗
- Network timeout → User notification ✗
- Concurrent saves → Last-write-wins ✗

**Risk**: Silent failures, user doesn't know data wasn't saved

---

## Pattern Analysis: Similar Potential Issues

### Pattern 1: Undefined Function/Variable References
**Found**: `api.saveRoleWeights()` (FIXED)
**Search Results**: No other instances found ✅

**Patterns to Watch**:
- Functions called but not imported
- Variables referenced before declaration
- `this.` references in arrow functions
- Typos in import paths

---

### Pattern 2: Unhandled Async Errors
**Status**: All async operations have try/catch ✅
**Pattern**: `await saveProjectsToGCS()` → has error handling
**Risk Level**: LOW - Good async handling

---

### Pattern 3: Missing State Validations
**Found**: Several places where state is set without validation
**Example**: `setInputs(prev => ({ ...prev, clientRate: value }))`
- No validation that clientRate > 0
- No validation that soldDays > 0
- No validation that deliverables array is valid

**Risk**: Invalid state could break calculations

---

### Pattern 4: Race Conditions
**Scenario**: What if user:
1. Clicks Save Project
2. Clicks Save Project again before first completes?
3. Edit role weights while autosave runs?

**Current State**: No duplicate save prevention, no mutex/lock

**Risk**: Concurrent GCS writes could corrupt data

---

## Component-by-Component Test Status

| Component | Render | Logic | Integration | Help | Status |
|-----------|--------|-------|-------------|------|--------|
| RedPegasusPricingCalculator | ✅ | ❌ | ❌ | ✅ (NEW) | 25% |
| MarginAnalysis | ❌ | ❌ | ❌ | ❌ | 0% |
| ValidationAlert | ❌ | ❌ | ❌ | ❌ | 0% |
| InfoIcon (NEW) | ❌ | ❌ | ❌ | ❌ | 0% |
| HelpModal (NEW) | ❌ | ❌ | ❌ | ❌ | 0% |
| formatGBP | ✅ | ✅ | ✅ | N/A | 100% |
| validation.js | ✅ | ✅ | ✅ | N/A | 100% |

---

## Recommended Test Implementation Plan

### Phase 1: Critical Path (Week 1)
**Priority**: MUST HAVE BEFORE PRODUCTION

1. **GCS Integration Tests**
   - Save project → verify in GCS
   - Load project → verify all fields populated
   - Delete project → verify removed
   - Error handling for network failures

2. **Calculation Tests**
   - Value-days calculation
   - Revenue allocation accuracy
   - Account manager uplift
   - Edge case handling

3. **Deliverables Tests**
   - CRUD operations on deliverables
   - Validation of inputs
   - Correct calculations with different roles

**Estimated Coverage**: 50%

### Phase 2: Form Handling (Week 2)
4. **Input Validation Tests**
5. **Form State Management Tests**
6. **Edit/Done Toggle Tests**

**Estimated Coverage**: 70%

### Phase 3: Help System & UI (Week 3)
7. **Info Icon Tests**
8. **Help Modal Tests**
9. **UI State Tests**

**Estimated Coverage**: 85%

### Phase 4: Edge Cases & Recovery (Week 4)
10. **Error Recovery Tests**
11. **Race Condition Tests**
12. **Large Data Handling Tests**

**Estimated Coverage**: 95%+

---

## Test Implementation Examples

### Example 1: GCS Save Test
```javascript
it('should save project to GCS and update library', async () => {
  // Setup
  const mockSave = vi.spyOn(saveProjectsToGCS, 'default');
  const projectData = { id: '123', name: 'Test', deliverables: [] };

  // Act
  await saveProject(projectData);

  // Assert
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({
    '123': projectData
  }));
  expect(projectLibrary['123']).toBeDefined();
});
```

### Example 2: Calculation Test
```javascript
it('should calculate value-days correctly', () => {
  const deliverables = [
    { id: 1, name: 'Dev', role: 'Development', days: 5 }
  ];
  const roleWeights = { Development: 1.5 };

  const model = calculateRedPegasusModel({
    deliverables,
    roleWeights,
    clientRate: 1000,
    soldDays: 20,
    accountManagerParty: 'RPG'
  });

  // 5 days × 1.5 weight = 7.5 value-days
  expect(model.totalValueDays).toBe(7.5);
  // 5 days × (1000 × 1.5) = 7500 revenue
  expect(model.totalRevenue).toBe(7500);
});
```

---

## Build Verification

✅ **Build Status**: PASSING (No TypeScript/JSX syntax errors)
- Fixed `api` undefined reference
- All imports resolved
- No compilation errors

⚠️ **Runtime Issues**: Not caught by build - only discovered at runtime
- This is why manual testing found the `api` bug

---

## Recommendations

### Immediate Actions (Do Today)
1. ✅ Fixed undefined `api` variable (DONE)
2. ☐ Add unit tests for calculation logic
3. ☐ Add GCS integration tests
4. ☐ Document test data fixtures

### Short Term (This Week)
5. ☐ Implement Phase 1 tests (50% coverage)
6. ☐ Set up test coverage reports
7. ☐ Add pre-commit hook to run tests

### Medium Term (This Month)
8. ☐ Implement remaining phases
9. ☐ Achieve 80%+ coverage
10. ☐ Add E2E tests with Playwright
11. ☐ Document test patterns

### Long Term
12. ☐ Maintain >85% coverage
13. ☐ Add performance benchmarks
14. ☐ Add accessibility tests

---

## Summary: Test Gaps by Criticality

| Severity | Count | Examples |
|----------|-------|----------|
| 🔴 CRITICAL | 3 | GCS integration, Calculation logic, Data persistence |
| 🟠 HIGH | 4 | Form handling, Deliverables CRUD, Error recovery |
| 🟡 MEDIUM | 2 | UI state, Help system |
| 🟢 LOW | 2 | Edge cases, Performance |

**Conclusion**: Red Pegasus needs immediate test coverage implementation before considering production-ready. The `api` bug demonstrates how gaps in testing can hide runtime errors.

---

*This analysis was generated by automated code review. Recommendations are based on industry best practices for React/TypeScript applications.*
