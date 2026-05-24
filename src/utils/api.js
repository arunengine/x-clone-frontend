// Central API helper — handles base URL + credentials for all fetch calls
const API_BASE = import.meta.env.VITE_API_BASE || "";

export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
  });
}
