/**
 * Station Storage Utility
 * 
 * Frontend-only persistence layer using localStorage for user-added stations.
 * Includes duplicate detection via radius-based coordinate validation.
 * 
 * // TODO: Replace with API calls to Supabase backend
 */

import { MOCK_STATIONS } from "./mockStations";

const STORAGE_KEY = "fuelwatch_user_stations";
const OVERRIDES_KEY = "fuelwatch_mock_overrides";
const SAVED_KEY = "fuelwatch_saved_stations";

/**
 * Get IDs of saved stations.
 */
export function getSavedStationIds() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Toggle saved status of a station.
 */
export function toggleSaveStation(stationId) {
  try {
    const saved = getSavedStationIds();
    const index = saved.indexOf(stationId);
    if (index > -1) {
      saved.splice(index, 1);
    } else {
      saved.push(stationId);
    }
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    return saved.includes(stationId);
  } catch (e) {
    console.error("Failed to toggle save station:", e);
    return false;
  }
}

/**
 * Check if a station is saved.
 */
export function isStationSaved(stationId) {
  return getSavedStationIds().includes(stationId);
}

/**
 * Load mock station overrides from localStorage.
 */
export function getMockOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save mock overrides to localStorage.
 */
function saveMockOverrides(overrides) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error("Failed to save overrides:", e);
  }
}

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
 * Get all stations (Mock + User) with overrides applied.
 * @returns {Array}
 */
export function getStations() {
  const userStations = getUserStations();
  const overrides = getMockOverrides();
  
  return [...MOCK_STATIONS, ...userStations].map(s => {
    if (overrides[s.id]) {
      return { ...s, ...overrides[s.id] };
    }
    return s;
  });
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
 * @param {object} stationData - { name, brand, address, city, lat, lng, prices }
 * @returns {{ success: boolean, message: string, station?: object }}
 */
export function addUserStation(stationData) {
  // TODO: Replace with API call: POST /api/stations
  const { name, brand, address, city, lat, lng, prices } = stationData;

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
    city: city || "Unknown",
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

/**
 * Update fuel prices for a specific station.
 * @param {string} stationId 
 * @param {Array} newPrices - Array of { type, price }
 */
export function updateStationPrices(stationId, newPrices) {
  // TODO: Replace with API call: PATCH /api/stations/:id/prices
  
  if (stationId.startsWith("user_")) {
    const stations = getUserStations();
    const index = stations.findIndex(s => s.id === stationId);
    if (index !== -1) {
      stations[index].prices = newPrices;
      stations[index].lastUpdated = "Just now";
      saveUserStations(stations);
      return { success: true };
    }
  } else {
    // It's a mock station, save to overrides
    const overrides = getMockOverrides();
    overrides[stationId] = {
      prices: newPrices,
      lastUpdated: "Just now"
    };
    saveMockOverrides(overrides);
    return { success: true };
  }
  
  return { success: false, message: "Station not found" };
}
