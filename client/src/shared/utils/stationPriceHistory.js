import { FUEL_TYPES } from "./fuelTypes";

const STORAGE_PREFIX = "fuelwatchph:station-price-history:v1";
const HISTORY_EVENT = "fuelwatchph:station-price-history-updated";

export const STATION_HISTORY_RANGES = ["7D", "1M", "3M", "6M", "1Y", "All"];

export const FUEL_HISTORY_COLORS = {
  DSL: "#0ea5e9",
  PDSL: "#0369a1",
  UL91: "#16a34a",
  PR95: "#f59e0b",
  PR97: "#ef4444",
  Kerosene: "#8b5cf6",
};

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function normalizeStationKey(value) {
  return String(value || "unknown")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

export function getStationPriceHistoryKey({ stationId, stationName }) {
  return `${STORAGE_PREFIX}:${normalizeStationKey(stationId || stationName)}`;
}

export function readStationPriceHistory({ stationId, stationName }) {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(getStationPriceHistoryKey({ stationId, stationName }));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry) => entry && entry.fuelType && Number.isFinite(Number(entry.price)) && entry.observedAt)
      .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
  } catch {
    return [];
  }
}

export function appendStationPriceHistory({ stationId, stationName, entries }) {
  if (!isBrowser() || !Array.isArray(entries) || entries.length === 0) return;

  const key = getStationPriceHistoryKey({ stationId, stationName });
  const existing = readStationPriceHistory({ stationId, stationName });
  const nextEntries = [
    ...existing,
    ...entries
      .map((entry) => ({
        id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        stationId: stationId || null,
        stationName: stationName || null,
        fuelType: entry.fuelType,
        price: Number(entry.price),
        observedAt: entry.observedAt || new Date().toISOString(),
      }))
      .filter((entry) => entry.fuelType && Number.isFinite(entry.price) && entry.price > 0),
  ].sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());

  localStorage.setItem(key, JSON.stringify(nextEntries));
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT, { detail: { stationId, stationName } }));
}

function getRangeCutoff(range) {
  if (range === "All") return null;

  const now = Date.now();
  const offsets = {
    "7D": 7,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
  };

  const days = offsets[range] || 30;
  return now - days * 24 * 60 * 60 * 1000;
}

function formatDayKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date, range) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    ...(range === "All" ? { year: "numeric" } : {}),
  }).format(date);
}

export function buildStationPriceHistoryChartData(entries, range = "3M") {
  const validEntries = (entries || [])
    .map((entry) => ({
      ...entry,
      price: Number(entry.price),
      observedAt: new Date(entry.observedAt),
    }))
    .filter((entry) => Number.isFinite(entry.price) && entry.price > 0 && !Number.isNaN(entry.observedAt.getTime()));

  const cutoff = getRangeCutoff(range);
  const filtered = cutoff == null ? validEntries : validEntries.filter((entry) => entry.observedAt.getTime() >= cutoff);

  if (filtered.length === 0) {
    return [];
  }

  const dailyBuckets = new Map();

  filtered
    .sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime())
    .forEach((entry) => {
      const dayKey = formatDayKey(entry.observedAt);
      const bucket = dailyBuckets.get(dayKey) || {
        dayKey,
        label: formatDayLabel(entry.observedAt, range),
        timestamp: entry.observedAt.getTime(),
      };

      bucket[entry.fuelType] = entry.price;
      bucket.timestamp = Math.max(bucket.timestamp, entry.observedAt.getTime());
      dailyBuckets.set(dayKey, bucket);
    });

  return [...dailyBuckets.values()].sort((a, b) => a.timestamp - b.timestamp);
}

export function getStationPriceHistoryFuelTypes(entries, range = "3M") {
  const chartData = buildStationPriceHistoryChartData(entries, range);

  return FUEL_TYPES.filter((fuelType) => chartData.some((point) => Number.isFinite(point[fuelType])));
}

export { HISTORY_EVENT as STATION_PRICE_HISTORY_EVENT };