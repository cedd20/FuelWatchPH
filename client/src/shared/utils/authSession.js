export const AUTH_REMEMBER_ME_KEY = "fuelwatch_auth_remember_me";
export const MOCK_AUTH_SESSION_KEY = "fuelwatch_mock_auth_session";
export const MOCK_ADMIN_AUTH_SESSION_KEY = "fuelwatch_mock_admin_auth_session";
export const AUTH_REMEMBERED_CREDENTIALS_KEY = "fuelwatch_auth_remembered_credentials";

export function getSupabaseProjectRef() {
  return import.meta.env.VITE_SUPABASE_URL?.split(".")[0]?.split("//")[1] || null;
}

export function getSupabaseAuthStorageKey() {
  const projectRef = getSupabaseProjectRef();
  return projectRef ? `sb-${projectRef}-auth-token` : null;
}

export function getStoredRememberMePreference() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_REMEMBER_ME_KEY) === "true";
}

export function setStoredRememberMePreference(rememberMe) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_REMEMBER_ME_KEY, rememberMe ? "true" : "false");
}

export function getStoredRememberedCredentials() {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem(AUTH_REMEMBERED_CREDENTIALS_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function setStoredRememberedCredentials(email, password) {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    AUTH_REMEMBERED_CREDENTIALS_KEY,
    JSON.stringify({
      email,
      password,
    }),
  );
}

export function clearStoredRememberedCredentials() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_REMEMBERED_CREDENTIALS_KEY);
}

function getStorageForPreference(rememberMe) {
  if (typeof window === "undefined") return null;
  return rememberMe ? localStorage : sessionStorage;
}

export function getStoredSessionValue(key) {
  if (typeof window === "undefined" || !key) return null;
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

export function clearStoredSessionValue(key) {
  if (typeof window === "undefined" || !key) return;
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export function storeSessionValue(key, value, rememberMe) {
  if (typeof window === "undefined" || !key) return;
  const targetStorage = getStorageForPreference(rememberMe);
  if (!targetStorage) return;

  const otherStorage = targetStorage === localStorage ? sessionStorage : localStorage;
  otherStorage.removeItem(key);
  targetStorage.setItem(key, value);
}

export function getParsedSessionValue(key) {
  const value = getStoredSessionValue(key);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function setMockAuthSession(user, rememberMe) {
  if (!user) return;
  setStoredRememberMePreference(rememberMe);
  // Safe placeholder session until backend token handling is fully integrated.
  storeSessionValue(MOCK_AUTH_SESSION_KEY, JSON.stringify(user), rememberMe);
}

export function getMockAuthSession() {
  return getParsedSessionValue(MOCK_AUTH_SESSION_KEY);
}

export function clearMockAuthSession() {
  clearStoredSessionValue(MOCK_AUTH_SESSION_KEY);
}

export function setMockAdminAuthSession(user, rememberMe) {
  if (!user) return;
  setStoredRememberMePreference(rememberMe);
  // Safe placeholder admin session until backend role-based auth is integrated.
  storeSessionValue(MOCK_ADMIN_AUTH_SESSION_KEY, JSON.stringify(user), rememberMe);
}

export function getMockAdminAuthSession() {
  return getParsedSessionValue(MOCK_ADMIN_AUTH_SESSION_KEY);
}

export function clearMockAdminAuthSession() {
  clearStoredSessionValue(MOCK_ADMIN_AUTH_SESSION_KEY);
}
