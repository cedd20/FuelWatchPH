/**
 * Utilities for fuel price validation and formatting
 */

/**
 * Validates a fuel price value.
 * A valid price must be a number, greater than 0, not null/undefined/NaN/empty.
 * @param {any} price 
 * @returns {boolean}
 */
export const isValidPrice = (price) => {
  if (price === null || price === undefined || price === "") return false;
  const numPrice = Number(price);
  return !isNaN(numPrice) && numPrice > 0;
};

/**
 * Formats a fuel price.
 * @param {any} price 
 * @param {string} fallback - text to show if price is invalid
 * @returns {string}
 */
export const formatPrice = (price, fallback = "No Data") => {
  if (!isValidPrice(price)) return fallback;
  return `₱${Number(price).toFixed(2)}`;
};

/**
 * Formats a fuel price with unit.
 * @param {any} price 
 * @param {string} fallback - text to show if price is invalid
 * @returns {string}
 */
export const formatPriceWithUnit = (price, fallback = "No Data") => {
  if (!isValidPrice(price)) return fallback;
  return `₱${Number(price).toFixed(2)}/L`;
};

/**
 * Safe numeric conversion for calculations.
 * @param {any} price 
 * @returns {number|null}
 */
export const getNumericPrice = (price) => {
  return isValidPrice(price) ? Number(price) : null;
};
