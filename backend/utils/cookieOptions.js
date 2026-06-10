const normalizeUrl = (url) => (url ? String(url).replace(/\/$/, "") : "");

export const isSplitDeploy = () => {
    if (process.env.SPLIT_DEPLOY === "true") return true;
    if (process.env.SPLIT_DEPLOY === "false") return false;

    const frontend = normalizeUrl(
        process.env.FRONTEND_URL || process.env.CLIENT_URL
    );
    const backend = normalizeUrl(
        process.env.BACKEND_URL ||
            process.env.RENDER_EXTERNAL_URL ||
            (process.env.PORT ? `http://localhost:${process.env.PORT}` : "")
    );

    return Boolean(frontend && backend && frontend !== backend);
};

export const getAuthCookieOptions = (maxAge) => {
    const isProd = process.env.NODE_ENV === "production";
    const split = isSplitDeploy();

    const options = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd && split ? "none" : "lax",
    };

    if (maxAge !== undefined) {
        options.maxAge = maxAge;
    }

    return options;
};
