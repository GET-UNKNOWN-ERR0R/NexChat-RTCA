const normalizeUrl = (url) => (url ? String(url).replace(/\/$/, "") : "");

export const getAllowedOrigins = () => {
    const origins = new Set([
        "http://localhost:5173",
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL,
        process.env.BACKEND_URL,
        process.env.RENDER_EXTERNAL_URL,
    ]);

    return [...origins]
        .filter(Boolean)
        .map(normalizeUrl);
};

export const isOriginAllowed = (origin) => {
    if (!origin) return true;
    const normalized = normalizeUrl(origin);
    return getAllowedOrigins().includes(normalized);
};

export const corsOriginCallback = (origin, callback) => {
    if (isOriginAllowed(origin)) {
        callback(null, true);
    } else {
        callback(null, false);
    }
};
