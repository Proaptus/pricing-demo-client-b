/**
 * Formats a number as GBP currency with proper locale formatting
 * @param {number} n - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted currency string with £ symbol
 */
const formatGBP = (n, decimals = 0) => {
  if (!isFinite(n)) n = 0;
  const isNegative = n < 0;
  const absN = Math.abs(n);
  const formatted = absN.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return isNegative ? '-£' + formatted : '£' + formatted;
};

export default formatGBP;
