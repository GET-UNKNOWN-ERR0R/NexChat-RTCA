export const formatMessagePreview = (msg, currentUserId, otherUsername = "") => {
    if (!msg) return "";

    const isOwn = String(msg.senderId) === String(currentUserId);
    const prefix = isOwn ? "You: " : `${otherUsername}: `;

    if (msg.messageType === "image") return `${prefix}📷 Photo`;
    if (msg.messageType === "video") return `${prefix}🎬 Video`;
    if (msg.messageType === "voice") return `${prefix}🎤 Voice message`;
    if (msg.messageType === "document") return `${prefix}📄 ${msg.documentName || "Document"}`;
    if (msg.messageType === "location") return `${prefix}📍 Location`;

    const text = msg.message || "";
    return `${prefix}${text.length > 40 ? text.slice(0, 40) + "…" : text}`;
};

export const formatReactionPreview = (msg, currentUserId, otherUsername = "") => {
    if (!msg?.reactions?.length) return null;

    const latestReaction = msg.reactions[msg.reactions.length - 1];
    const isOwnReaction = String(latestReaction.userId) === String(currentUserId);
    const mediaLabel =
        msg.messageType === "image" ? "photo"
            : msg.messageType === "video" ? "video"
                : msg.messageType === "voice" ? "voice message"
                    : msg.messageType === "document" ? "document"
                        : msg.messageType === "location" ? "location"
                            : "message";

    if (isOwnReaction) {
        return `You reacted ${latestReaction.emoji} to ${mediaLabel}`;
    }
    return `${otherUsername} reacted ${latestReaction.emoji}`;
};

export const getChatPreview = (msg, currentUserId, otherUsername = "") => {
    if (!msg) return "";
    return formatReactionPreview(msg, currentUserId, otherUsername)
        || formatMessagePreview(msg, currentUserId, otherUsername);
};
