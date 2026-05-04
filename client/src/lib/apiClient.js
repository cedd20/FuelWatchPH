const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getAuthHeaders() {
  // Read Supabase session from local storage
  // The key pattern used by Supabase is sb-<project-id>-auth-token
  const projectRef = import.meta.env.VITE_SUPABASE_URL?.split(".")[0].split("//")[1];
  const storageKey = `sb-${projectRef}-auth-token`;
  const sessionData = localStorage.getItem(storageKey);
  
  if (!sessionData) return {};
  
  try {
    const session = JSON.parse(sessionData);
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    console.error("Error parsing auth session", e);
    return {};
  }
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
