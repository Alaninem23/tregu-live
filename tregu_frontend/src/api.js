const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function api(path, { method="GET", token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include"
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export const AuthAPI = {
  register: (email, password, role="buyer") => api("/auth/register", { method: "POST", body: { email, password, role } }),
  login: (email, password) => api("/auth/login", { method: "POST", body: { email, password } }),
  me:   (token) => api("/auth/me", { token }),
  logout: (token) => api("/auth/logout", { method: "POST", token }),
};

export const FeedAPI = {
  list: () => api("/feed/"),
  post: (token, title, body) => api("/feed/post", { method: "POST", token, body: { title, body } }),
};

export const AdminAPI = {
  setRole: (token, userId, role) => api(`/admin/users/${userId}/role`, { method: "POST", token, body: { role } }),
  getSettings: (token) => api("/admin/settings", { token }),
  setSettings: (token, payload) => api("/admin/settings", { method: "POST", token, body: payload }),
};
