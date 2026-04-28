/**
 * Extracts unique, sorted city names from a collection of stations.
 * @param {Array} stations - Array of station objects
 * @returns {Array} - Unique sorted city names
 */
export const getAvailableCities = (stations) => {
  if (!stations || !Array.isArray(stations)) return [];
  
  const cities = stations
    .map((s) => s.city)
    .filter((city) => city && city.trim() !== "");
    
  return [...new Set(cities)].sort();
};
