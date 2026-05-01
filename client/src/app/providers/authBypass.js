// TEMP: Auth bypass enabled for frontend testing only.
// Re-enable real auth checks when backend/auth is ready.

export const AUTH_BYPASS_STORAGE_KEY = "fuelwatch.authBypassEnabled";

const DEFAULT_MOCK_USER = {
  id: "demo-user-id",
  email: "user@fuelwatch.ph",
  name: "FuelWatch Explorer",
  initials: "FE",
  contributionCount: 142,
  accuracy: 98,
  points: 2500,
  rank: "Gold Contributor",
};

export function isAuthBypassEnabled() {
  if (typeof window === "undefined") {
    return true;
  }

  const storedValue = window.localStorage.getItem(AUTH_BYPASS_STORAGE_KEY);
  if (storedValue == null) {
    window.localStorage.setItem(AUTH_BYPASS_STORAGE_KEY, "true");
    return true;
  }

  return storedValue === "true";
}

export function getMockAuthenticatedUser() {
  return { ...DEFAULT_MOCK_USER };
}
