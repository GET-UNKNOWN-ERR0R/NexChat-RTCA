const trimSlash = (url) => (url ? String(url).replace(/\/$/, "") : "");

export const API_BASE_URL = trimSlash(import.meta.env.VITE_API_BASE_URL || "");

export const SOCKET_URL =
    trimSlash(import.meta.env.VITE_SOCKET_URL || "") ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
