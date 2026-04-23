/**
 * Station Storage Utility
 * 
 * Frontend-only persistence layer using localStorage for user-added stations.
 * Includes duplicate detection via radius-based coordinate validation.
 * 
 * // TODO: Replace with API calls to Supabase backend
 */

const STORAGE_KEY = "fuelwatch_user_stations";

/**
 * Calculate distance in meters between two GPS coordinates using Haversine formula.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters
 */
export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Load all user-added stations from localStorage.
 * @returns {Array} Array of station objects
 */
export function getUserStations() {
  // TODO: Replace with API call: GET /api/stations/user
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    console.error("Failed to parse user stations from localStorage");
    return [];
  }
}

/**
 * Save stations array to localStorage.
 * @param {Array} stations
 */
function saveUserStations(stations) {
  // TODO: Replace with API call: POST /api/stations
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stations));
  } catch (e) {
    console.error("Failed to save stations to localStorage:", e);
  }
}

/**
 * Check if a station already exists at or near the given coordinates.
 * @param {number} lat - Latitude of the new station
 * @param {number} lng - Longitude of the new station
 * @param {number} radiusMeters - Minimum distance threshold (default 20m)
 * @returns {{ isDuplicate: boolean, existingStation: object|null }}
 */
export function checkDuplicateLocation(lat, lng, radiusMeters = 20) {
  // TODO: Replace with API call: GET /api/stations/check-duplicate?lat=&lng=&radius=
  const stations = getUserStations();
  for (const station of stations) {
    const distance = getDistanceMeters(lat, lng, station.lat, station.lng);
    if (distance <= radiusMeters) {
      return { isDuplicate: true, existingStation: station, distance };
    }
  }
  return { isDuplicate: false, existingStation: null, distance: null };
}

/**
 * Add a new station to localStorage after validation.
 * @param {object} stationData - { name, brand, address, lat, lng, prices }
 * @returns {{ success: boolean, message: string, station?: object }}
 */
export function addUserStation(stationData) {
  // TODO: Replace with API call: POST /api/stations
  const { name, brand, address, lat, lng, prices } = stationData;

  // Validate required fields
  if (!name || !address || lat == null || lng == null) {
    return { success: false, message: "Station name, address, and location are required." };
  }

  // Check for duplicates within 20 meters
  const { isDuplicate, existingStation, distance } = checkDuplicateLocation(lat, lng, 20);
  if (isDuplicate) {
    return {
      success: false,
      message: `A station already exists within ${Math.round(distance)}m of this location: "${existingStation.name}". Please choose a different location.`,
    };
  }

  const newStation = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    brand: brand || "Independent",
    address,
    distance: 0,
    prices: prices || [],
    lastUpdated: "Just now",
    verified: false,
    lat,
    lng,
    isUserAdded: true, // Flag to distinguish from OSM stations
    addedAt: new Date().toISOString(),
  };

  const stations = getUserStations();
  stations.push(newStation);
  saveUserStations(stations);

  return { success: true, message: "Station added successfully!", station: newStation };
}

/**
 * Remove a user-added station by ID.
 * @param {string} stationId
 * @returns {boolean}
 */
export function removeUserStation(stationId) {
  // TODO: Replace with API call: DELETE /api/stations/:id
  const stations = getUserStations();
  const filtered = stations.filter((s) => s.id !== stationId);
  saveUserStations(filtered);
  return filtered.length < stations.length;
}
