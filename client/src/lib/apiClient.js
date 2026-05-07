import { getParsedSessionValue, getSupabaseAuthStorageKey } from "@/shared/utils/authSession";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getAuthHeaders() {
  const storageKey = getSupabaseAuthStorageKey();
  const session = storageKey ? getParsedSessionValue(storageKey) : null;
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

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
  } catch (error) {
    if (error.message === "Failed to fetch") {
      throw new Error("Backend server is unreachable. Please ensure the API is running.");
    }
    throw error;
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: "DELETE" }),
};
