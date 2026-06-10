const trimSlash = (url) => (url ? String(url).replace(/\/$/, "") : "");

const runtimeOrigin =
    typeof window !== "undefined" ? trimSlash(window.location.origin) : "";

export const API_BASE_URL = trimSlash(import.meta.env.VITE_API_BASE_URL || "");

export const SOCKET_URL =
    trimSlash(import.meta.env.VITE_SOCKET_URL || "") || runtimeOrigin || "http://localhost:3000";
