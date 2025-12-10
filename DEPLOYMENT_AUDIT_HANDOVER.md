# Red Pegasus Pricing Calculator - Pre-Deployment Audit Handover

**Status**: ⚠️ CRITICAL - Complete audit required before deployment
**Created**: 2025-10-31
**Reason**: Code reverts detected. Full mathematical and logic verification needed.

## CRITICAL: What Needs Verification

This handover is because the codebase may have been partially reverted. An independent agent must verify ALL of the following before any deployment.

---

## 1. Mathematical Logic Verification

### A. Revenue Calculation Model
**File**: `src/components/RedPegasusPricingCalculator.jsx` (lines 58-157)
**Function**: `calculateRedPegasusModel(inputs)`

**Formula to verify**:
```
totalRevenue = clientRate × soldDays
deliverableRevenue = days × (clientRate × roleWeight)
totalValueDays = sum of (days × roleWeight) for all deliverables
partyShare = (partyValueDays / totalValueDays) × 100
adjustedRevenue = partyRevenue × upliftFactor (1.1 for accountManagerParty, 1.0 for others)
finalRevenue = (adjustedRevenue / totalAdjustedRevenue) × totalRevenue
```

**TEST CASES**:
1. ✓ Simpson baseline: 45 sold days @ £950/day = £42,750 total
2. ✓ RPG allocation with role weights
3. ✓ Proaptus allocation with role weights
4. ✓ 10% uplift correctly applied to accountManagerParty
5. ✓ Revenue normalized correctly after uplift

### B. Deliverables Table - % of Costs Calculation
**File**: `src/components/RedPegasusPricingCalculator.jsx` (line 1360)
**Current implementation**: `((partyDaysTotal / model.totalDays) * 100).toFixed(1)% of costs`

**Verification**:
- Should show percentage of DAYS (costs), not revenue percentage
- Formula: (party days / total days) × 100
- Example: If RPG has 20 days and total is 45 days: (20/45) × 100 = 44.4%

### C. Party Allocations
**File**: `src/components/RedPegasusPricingCalculator.jsx` (lines 76-109)

**Verify**:
- RPG party calculations
- Proaptus party calculations
- Joint party calculations (if used)
- Uplift factor application (10% for account manager)
- Final revenue normalization

---

## 2. Component Structure Verification

### A. Your Projects Card (RECENTLY MODIFIED)
**File**: `src/components/RedPegasusPricingCalculator.jsx` (lines 757-837)

**Card should display**:
- Project name ✓
- Client name (from GCS data) ✓
- Project code (from GCS data) ✓
- Sold days (from GCS data) ✓
- Deliverables count (from GCS data) ✓
- Client rate/day (from GCS data) ✓
- Last modified date ✓
- Active badge (if selected) ✓

**Must NOT display**:
- Placeholder "background" data
- Placeholder "description" data
- Any hardcoded fake information

**Test**: Load from GCS and verify ALL displayed data comes from actual project objects

### B. Deliverables Table
**File**: `src/components/RedPegasusPricingCalculator.jsx` (lines 1160-1373)

**Columns to verify**:
1. ID (format: RPG-D01, PRO-D01, etc.)
2. Deliverable Name
3. Role
4. Days
5. Day Rate (calculated from clientRate × roleWeight)
6. Total Cost (days × effectiveDayRate)
7. Acceptance Criteria
8. TOTAL row with correct % of costs calculation

**Verify calculations in each row**:
- effectiveDayRate = clientRate × roleWeight ✓
- totalCost = days × effectiveDayRate ✓
- Role weights applied correctly ✓

### C. Report Components
**Files**:
- `src/components/pricing/RedPegasusInternalReport.jsx`
- `src/components/pricing/RedPegasusQuoteReport.jsx`

**Verify**:
- Reports render correctly with model data ✓
- Print styling is print-friendly (no dark backgrounds) ✓
- Reports are hidden off-screen (`position: absolute; left: -9999px`) ✓
- Print dialog works when "Print Report" button clicked ✓
- Correct report variant displays based on selection ✓

---

## 3. GCS Integration Verification

**File**: `src/services/gcsStorage.js`

**Verify**:
- Projects load correctly from GCS on app startup
- Projects autosave to GCS when modified
- Role weights load from GCS
- Role weights save with change reason
- Backup system creates timestamped backups
- All GCS errors handled gracefully

**Test cases**:
1. Load app → projects appear from GCS ✓
2. Edit project → autosaves to GCS ✓
3. Modify role weights → saves with reason ✓
4. GCS credentials load correctly ✓
5. Error handling if GCS unavailable ✓

---

## 4. Data Flow Verification

### A. Project Load Flow
```
GCS (projects.json)
  → loadProjectsFromGCS()
  → setProjectLibrary()
  → User clicks project card
  → loadProject(project)
  → All state fields updated
  → Calculations run
  → UI renders
```

**Verify**: Each step passes correct data

### B. Input Change Flow
```
User edits input (e.g., clientRate)
  → setInputs()
  → model recalculates (useMemo)
  → Validation runs
  → UI updates with new values
  → Autosave triggers (1s debounce)
  → Projects saved to GCS
```

**Verify**: Autosave works, no data loss

---

## 5. UI/UX Verification

### A. Styling
- ✓ Tailwind CSS classes applied correctly
- ✓ Responsive design (mobile, tablet, desktop)
- ✓ No hardcoded colors or inline styles except for off-screen report div
- ✓ Cards and tables properly formatted
- ✓ Print styles work correctly

### B. State Management
- ✓ All state properly initialized
- ✓ State updates don't cause infinite loops
- ✓ useMemo dependencies correct
- ✓ useEffect dependencies correct

### C. Error Handling
- ✓ Validation alerts display
- ✓ Server connection errors handled
- ✓ GCS errors graceful
- ✓ Invalid inputs caught

---

## 6. Test Execution Checklist

### Smoke Tests (Critical Path)
- [ ] App loads without errors
- [ ] GCS connection succeeds
- [ ] Projects load from GCS
- [ ] Click on project → project loads
- [ ] Basic calculations run (no errors in console)

### Functionality Tests
- [ ] Edit client rate → recalculates revenue ✓
- [ ] Edit sold days → recalculates revenue ✓
- [ ] Edit deliverable days → recalculates allocation ✓
- [ ] Change role weight → recalculates costs ✓
- [ ] Change accountManagerParty → 10% uplift applies ✓
- [ ] Add deliverable → appears in table ✓
- [ ] Delete deliverable → removed from table ✓
- [ ] Save project → saved to GCS ✓

### Mathematical Tests
- [ ] Simpson baseline: 45 days @ £950 = £42,750
- [ ] RPG allocation correct (accounting for role weights)
- [ ] Proaptus allocation correct
- [ ] Total revenue = RPG + Proaptus
- [ ] % of costs = (party days / total days) × 100
- [ ] Uplift factor applied correctly (10%)

### Report Tests
- [ ] Internal Report renders with correct data
- [ ] Quote Report renders with 5 pages
- [ ] Print dialog opens
- [ ] Print styles work (no dark backgrounds)
- [ ] Report hidden from main view

### GCS Tests
- [ ] Projects persist after page reload
- [ ] Autosave works (check GCS)
- [ ] Role weights save with reason
- [ ] Backup files created

---

## 7. Known Changes Made

### Recent Modifications (Potentially Problematic)
1. **Your Projects Card** (lines 757-837): Redesigned to show real GCS data
2. **Deliverables Table Footer** (line 1360): Changed from "% of revenue" to "% of costs"
3. **Report Components**: Styling changed for print compatibility

### What Could Have Been Reverted
- Red Pegasus Internal Report implementation
- Red Pegasus Quote Report implementation
- GCS integration
- Role weights change tracking
- Print functionality

---

## 8. Pre-Deployment Sign-Off

**Agent must verify and sign off on**:
- [ ] All mathematical calculations verified correct
- [ ] All data comes from GCS, no fake/placeholder data
- [ ] Reports print correctly
- [ ] No console errors
- [ ] All smoke tests pass
- [ ] All functionality tests pass
- [ ] GCS persistence works
- [ ] Performance acceptable
- [ ] No data loss scenarios

---

## 9. Deployment Blockers

**DO NOT DEPLOY if**:
- ❌ Console has errors
- ❌ Calculations don't match expected values
- ❌ GCS not loading/saving correctly
- ❌ Placeholder data visible anywhere
- ❌ Print doesn't work
- ❌ Any smoke test fails

---

## 10. Next Steps for Agent

1. **Run full test suite** - Execute all tests in Vitest
2. **Manual testing** - Test every calculation with Simpson baseline
3. **GCS verification** - Confirm projects persist and load correctly
4. **Print testing** - Test both report types with print dialog
5. **Review each changed component** - Line by line verification
6. **Create detailed test report** - Document all results
7. **Sign off or flag issues** - Clear recommendation on deployment readiness

---

**If any issues found**: DO NOT PROCEED TO DEPLOYMENT. Document issues and request fixes.

**Prepared by**: Claude Code (due to potential reverts)
**Date**: 2025-10-31
**Urgency**: CRITICAL - Deploy blocked until audit complete
