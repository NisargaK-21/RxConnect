import axios from "axios";
import { getToken, logout } from "@/utils/auth";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response &&
      error.response.status === 401 &&
      !error.config.url.includes("/auth/login") &&
      !error.config.url.includes("/auth/signup")
    ) {
      logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function assetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const normalized = path.replace(/\\/g, "/");
  if (normalized.startsWith("/")) return `${API_BASE}${normalized}`;
  if (normalized.startsWith("uploads/")) return `${API_BASE}/${normalized}`;
  return `${API_BASE}/uploads/${normalized}`;
}
