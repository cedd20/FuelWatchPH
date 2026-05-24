import { getParsedSessionValue, getSupabaseAuthStorageKey } from "@/shared/utils/authSession";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const CACHE_TTL_MS = 15000;

const responseCache = new Map();
const inFlightRequests = new Map();

function getAuthHeaders() {
  const storageKey = getSupabaseAuthStorageKey();
  const session = storageKey ? getParsedSessionValue(storageKey) : null;
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getCacheKey(path, token) {
  return `${token || "anonymous"}:${path}`;
}

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function clearResponseCache() {
  responseCache.clear();
}

async function request(path, options = {}) {
  try {
    const method = (options.method || "GET").toUpperCase();
    const headers = {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    };
    const token = headers.Authorization || "";
    const cacheKey = getCacheKey(path, token);

    if (method === "GET") {
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cloneValue(cached.data);
      }

      const inFlight = inFlightRequests.get(cacheKey);
      if (inFlight) {
        return cloneValue(await inFlight);
      }
    } else {
      clearResponseCache();
    }

    const fetchPromise = fetch(`${API_BASE}${path}`, {
      ...options,
      method,
      headers,
    }).then(async (res) => {
      if (res.status === 401) {
        // Dispatch custom event for global auth expiry handling
        window.dispatchEvent(new CustomEvent("auth:expired"));
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw Object.assign(new Error(body.detail || "Request failed"), {
          status: res.status,
          body,
        });
      }

      if (res.status === 204) return null;
      return res.json();
    });

    if (method === "GET") {
      inFlightRequests.set(cacheKey, fetchPromise);
    }

    const data = await fetchPromise;

    if (method === "GET") {
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        data: cloneValue(data),
      });
      inFlightRequests.delete(cacheKey);
    }

    return cloneValue(data);
  } catch (error) {
    if (error.message === "Failed to fetch") {
      throw new Error("Backend server is unreachable. Please ensure the API is running.");
    }
    throw error;
  } finally {
    const method = (options.method || "GET").toUpperCase();
    if (method === "GET") {
      const token = getAuthHeaders().Authorization || "";
      inFlightRequests.delete(getCacheKey(path, token));
    }
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: "DELETE" }),
};
