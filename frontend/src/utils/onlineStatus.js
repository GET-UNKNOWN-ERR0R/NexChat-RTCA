export const isUserOnline = (onlineUser, userId) => {
    if (!userId || !onlineUser?.length) return false;
    const id = String(userId);
    return onlineUser.some((uid) => String(uid) === id);
};
