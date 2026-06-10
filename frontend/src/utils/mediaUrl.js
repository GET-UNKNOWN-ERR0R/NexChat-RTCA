const API_BASE = "http://localhost:3000";

export const getDefaultAvatarUrl = (username, gender) => {
    const name = encodeURIComponent(username || "User");
    if (gender === "female") {
        return `https://eu.ui-avatars.com/api/?name=${name}`;
    }
    return `https://eu.ui-avatars.com/api/?name=${name}`;
};

export const getMediaUrl = (url, user) => {
    const username = typeof user === "object" ? user?.username : undefined;
    const gender = typeof user === "object" ? user?.gender : undefined;

    if (!url) {
        return getDefaultAvatarUrl(username, gender);
    }
    if (url.startsWith("http")) return url;
    if (url.startsWith("/uploads")) return `${API_BASE}${url}`;
    return url;
};
