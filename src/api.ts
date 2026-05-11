import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("token");
    if (raw) {
      // Token may be stored as a JSON-encoded string ("\"ey...\"") or a plain JWT.
      let token: string;
      try {
        token = JSON.parse(raw);
      } catch {
        token = raw;
      }
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // No token stored — login page calls will proceed without auth header
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
