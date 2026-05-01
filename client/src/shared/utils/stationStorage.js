/**
 * Station Storage Utility
 * 
  * Frontend-only persistence layer using localStorage for user-added stations.
  * Includes duplicate detection via radius-based coordinate validation.
  * 
  * // TODO: Replace with API calls to Supabase backend
 */

import { MOCK_STATIONS } from "./mockStations";
import { FUEL_TYPES } from "./fuelTypes";

const STORAGE_KEY = "fuelwatch_user_stations";
const OVERRIDES_KEY = "fuelwatch_mock_overrides";
const SAVED_KEY = "fuelwatch_saved_stations";
const PRICE_REPORTS_KEY = "fuelwatch_price_reports";
const ISSUE_REPORTS_KEY = "fuelwatch_station_issue_reports";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

function sortPriceEntries(prices) {
  return [...prices].sort((a, b) => {
    const aIndex = FUEL_TYPES.indexOf(a.type);
    const bIndex = FUEL_TYPES.indexOf(b.type);
    return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
  });
}

function normalizePriceEntry(entry, previousEntry = null) {
  const nextPrice = Number(entry.price);
  const previousPrice = previousEntry?.price;
  const hasPreviousPrice = typeof previousPrice === "number" && Number.isFinite(previousPrice);
  const rawChange = hasPreviousPrice ? nextPrice - previousPrice : 0;

  return {
    ...previousEntry,
    ...entry,
    price: nextPrice,
    change: Math.abs(rawChange),
    trend: rawChange > 0 ? "up" : rawChange < 0 ? "down" : "stable",
    lastUpdated: entry.lastUpdated || "Just now",
    reportedAt: entry.reportedAt || new Date().toISOString(),
  };
}

function updateStationRecord(stationId, updater) {
  if (stationId.startsWith("user_")) {
    const stations = getUserStations();
    const index = stations.findIndex((station) => station.id === stationId);

    if (index === -1) {
      return { success: false, message: "Station not found" };
    }

    const updatedStation = updater(stations[index]);
    stations[index] = updatedStation;
    saveUserStations(stations);
    return { success: true, station: updatedStation };
  }

  const overrides = getMockOverrides();
  const baseStation = getStations().find((station) => station.id === stationId);

  if (!baseStation) {
    return { success: false, message: "Station not found" };
  }

  const updatedStation = updater(baseStation);
  overrides[stationId] = {
    ...(overrides[stationId] || {}),
    ...updatedStation,
  };
  saveMockOverrides(overrides);

  return { success: true, station: updatedStation };
}

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
  return readJson(OVERRIDES_KEY, {});
}

/**
 * Save mock overrides to localStorage.
 */
function saveMockOverrides(overrides) {
  saveJson(OVERRIDES_KEY, overrides);
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
  return readJson(STORAGE_KEY, []);
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
  saveJson(STORAGE_KEY, stations);
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
  return updateStationRecord(stationId, (station) => {
    const normalizedPrices = sortPriceEntries(
      newPrices.map((priceEntry) => {
        const previousEntry = station.prices.find((entry) => entry.type === priceEntry.type);
        return normalizePriceEntry(priceEntry, previousEntry);
      })
    );

    return {
      ...station,
      prices: normalizedPrices,
      lastUpdated: "Just now",
    };
  });
}

export function getStationById(stationId) {
  return getStations().find((station) => station.id === stationId) || null;
}

export function getPriceReports() {
  return readJson(PRICE_REPORTS_KEY, []);
}

export function getStationIssueReports() {
  return readJson(ISSUE_REPORTS_KEY, []);
}

export function submitPriceReport(stationId, reportData) {
  // TODO: Replace with API call: POST /api/stations/:id/price-reports
  const station = getStationById(stationId);
  if (!station) {
    return { success: false, message: "Station not found" };
  }

  if (!reportData?.fuelType || !Number.isFinite(Number(reportData?.price))) {
    return { success: false, message: "Fuel type and a valid price are required." };
  }

  const previousEntry = station.prices.find((entry) => entry.type === reportData.fuelType);
  const nextEntry = normalizePriceEntry(
    {
      type: reportData.fuelType,
      price: Number(reportData.price),
      remarks: reportData.remarks || "",
      proofPlaceholder: reportData.proofPlaceholder || "",
      reporterReference: reportData.reporterReference || "Frontend Tester",
      reportedAt: reportData.reportedAt || new Date().toISOString(),
      source: "frontend-report-form",
    },
    previousEntry
  );

  const nextPrices = previousEntry
    ? station.prices.map((entry) => (entry.type === reportData.fuelType ? nextEntry : entry))
    : [...station.prices, nextEntry];

  const updateResult = updateStationPrices(stationId, nextPrices);
  if (!updateResult.success) {
    return updateResult;
  }

  const reports = getPriceReports();
  const savedReport = {
    id: `price_report_${Date.now()}`,
    stationId,
    stationName: station.name,
    ...nextEntry,
  };
  reports.unshift(savedReport);
  saveJson(PRICE_REPORTS_KEY, reports);

  return {
    success: true,
    message: previousEntry ? "Fuel price report saved and current station price updated." : "New fuel price report saved successfully.",
    station: updateResult.station,
    report: savedReport,
  };
}

export function updateExistingStationPrice(stationId, fuelType, updates) {
  // TODO: Replace with API call: PATCH /api/stations/:id/prices/:fuelType
  const station = getStationById(stationId);
  if (!station) {
    return { success: false, message: "Station not found" };
  }

  const existingEntry = station.prices.find((entry) => entry.type === fuelType);
  if (!existingEntry) {
    return { success: false, message: "Fuel price entry not found" };
  }

  if (!Number.isFinite(Number(updates?.price))) {
    return { success: false, message: "A valid updated price is required." };
  }

  const updatedEntry = normalizePriceEntry(
    {
      ...existingEntry,
      ...updates,
      type: fuelType,
      price: Number(updates.price),
      source: "frontend-update-flow",
    },
    existingEntry
  );

  const nextPrices = station.prices.map((entry) => (entry.type === fuelType ? updatedEntry : entry));
  return {
    ...updateStationPrices(stationId, nextPrices),
    message: "Fuel price updated successfully.",
  };
}

export function deleteStationPrice(stationId, fuelType) {
  // TODO: Replace with API call: DELETE /api/stations/:id/prices/:fuelType
  const station = getStationById(stationId);
  if (!station) {
    return { success: false, message: "Station not found" };
  }

  const nextPrices = station.prices.filter((entry) => entry.type !== fuelType);
  if (nextPrices.length === station.prices.length) {
    return { success: false, message: "Fuel price entry not found" };
  }

  return {
    ...updateStationPrices(stationId, nextPrices),
    message: `${fuelType} removed from this station.`,
  };
}

export function submitStationIssueReport(stationId, reportData) {
  // TODO: Replace with API call: POST /api/stations/:id/issues
  const station = getStationById(stationId);
  if (!station) {
    return { success: false, message: "Station not found" };
  }

  if (!reportData?.issueType) {
    return { success: false, message: "Issue type is required." };
  }

  const reports = getStationIssueReports();
  const savedReport = {
    id: `station_issue_${Date.now()}`,
    stationId,
    stationName: station.name,
    issueType: reportData.issueType,
    details: reportData.details || "",
    reporterReference: reportData.reporterReference || "Frontend Tester",
    reportedAt: reportData.reportedAt || new Date().toISOString(),
    status: "pending",
  };
  reports.unshift(savedReport);
  saveJson(ISSUE_REPORTS_KEY, reports);

  return {
    success: true,
    message: "Station issue report submitted successfully.",
    report: savedReport,
  };
}
