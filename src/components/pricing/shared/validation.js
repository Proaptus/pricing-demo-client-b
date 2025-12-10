/**
 * Validates inputs and deliverables for Red Pegasus pricing model (hours-based model)
 * @param {Object} inputs - User input values (clientRate, etc.)
 * @param {Array} deliverables - Array of deliverable objects (with hours, owner)
 * @param {Object} roleWeights - Role weight configuration
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateInputs(inputs, deliverables, roleWeights = {}) {
  const errors = [];

  // Client rate validation
  if (!inputs.clientRate || inputs.clientRate <= 0) {
    errors.push('Client rate must be greater than zero');
  }

  // Sold days validation
  if (!inputs.soldDays || inputs.soldDays <= 0) {
    errors.push('Sold days must be greater than zero');
  }

  // Role weights validation
  if (roleWeights && typeof roleWeights === 'object') {
    Object.entries(roleWeights).forEach(([roleName, weight]) => {
      if (weight < 0) {
        errors.push(`${roleName} weight cannot be negative`);
      }
    });
  }

  // Deliverables validation
  if (deliverables && Array.isArray(deliverables)) {
    deliverables.forEach((d, idx) => {
      if (!d.name || d.name.trim() === '') {
        errors.push(`Deliverable ${idx + 1} must have a name`);
      }
      if (!d.days || d.days <= 0) {
        errors.push(`Deliverable "${d.name}" must have days > 0`);
      }
      if (!d.owner) {
        errors.push(`Deliverable "${d.name}" must have an owner assigned`);
      }
      if (!d.role || d.role.trim() === '') {
        errors.push(`Deliverable "${d.name}" must have a role assigned`);
      }
    });

    // Check for empty deliverables list
    if (deliverables.length === 0) {
      errors.push('At least one deliverable is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generates validation warnings (non-blocking) based on inputs and calculated allocations
 * @param {Object} inputs - User input values
 * @param {Object} partyAllocation - Calculated party allocation with percentages
 * @param {Array} deliverables - Array of deliverable objects
 * @param {Object} roleWeights - Role weight configuration (optional)
 * @returns {Array} Array of warning strings
 */
export function getValidationWarnings(inputs, partyAllocation, deliverables, roleWeights = {}) {
  const warnings = [];

  // Default role weights for comparison
  const DEFAULT_ROLE_WEIGHTS = {
    'Sales': 1.8,
    'Solution Architect': 1.4,
    'Project Management': 1.2,
    'Development': 1.0,
    'QA': 0.8,
    'Junior': 0.6
  };

  // Warn if one party dominates (>90%)
  if (partyAllocation && typeof partyAllocation === 'object') {
    Object.entries(partyAllocation).forEach(([party, data]) => {
      if (party !== 'total' && party !== 'Joint' && data.percentage > 90) {
        const displayName = party === 'rpg' ? 'RPG' : party.charAt(0).toUpperCase() + party.slice(1);
        warnings.push(`${displayName} has ${data.percentage.toFixed(2)}% of revenue - consider rebalancing the work allocation`);
      }
    });
  }

  // Warn if role weights deviate significantly from defaults
  if (roleWeights && typeof roleWeights === 'object') {
    Object.entries(roleWeights).forEach(([roleName, weight]) => {
      const defaultWeight = DEFAULT_ROLE_WEIGHTS[roleName];
      if (defaultWeight !== undefined) {
        const percentDiff = Math.abs(weight - defaultWeight) / defaultWeight;
        if (percentDiff > 0.5) { // 50% deviation threshold
          warnings.push(`${roleName} weight (${weight}) deviates significantly from default (${defaultWeight})`);
        }
      }
    });
  }

  // Warn if very few deliverables
  if (deliverables && deliverables.length < 3) {
    warnings.push('Consider breaking down work into more granular deliverables for better tracking');
  }

  // Warn if client rate seems very high or very low
  if (inputs.clientRate > 2000) {
    warnings.push('Client rate is extremely high (>£2000/day) - verify this is correct');
  }
  if (inputs.clientRate < 300) {
    warnings.push('Client rate is very low (<£300/day) - verify this is correct');
  }

  // Warn if total hours don't match sold days (rough check: ~8 hours per day)
  if (inputs.soldDays && inputs.totalHours) {
    const expectedHours = inputs.soldDays * 8;
    if (Math.abs(inputs.totalHours - expectedHours) > expectedHours * 0.2) {
      warnings.push(`Total hours (${inputs.totalHours}) differs significantly from expected (${expectedHours.toFixed(0)} hours for ${inputs.soldDays} days)`);
    }
  }

  return warnings;
}
