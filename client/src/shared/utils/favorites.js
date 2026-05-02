const SAVED_KEY = "fuelwatch_saved_stations";

export function getSavedStationIds() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isStationSaved(id) {
  const savedIds = getSavedStationIds();
  return savedIds.includes(id);
}

export function toggleSaveStation(id) {
  const savedIds = getSavedStationIds();
  let newState;
  let newIds;

  if (savedIds.includes(id)) {
    newIds = savedIds.filter(sid => sid !== id);
    newState = false;
  } else {
    newIds = [...savedIds, id];
    newState = true;
  }

  localStorage.setItem(SAVED_KEY, JSON.stringify(newIds));
  return newState;
}
