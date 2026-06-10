import Conversation from "../Models/conversationModels.js";
import User from "../Models/userModels.js";
import Message from "../Models/messageSchema.js";
import { getReciverSocketId, io } from "../Socket/socket.js";

const getUserClearedAt = (conversation, userId) => {
    const entry = conversation.clearedFor?.find(
        (c) => c.userId.toString() === userId.toString()
    );
    return entry?.clearedAt || null;
};

export const formatMessagePreview = (msg, currentUserId, otherUsername = "") => {
    if (!msg) return "";

    const isOwn = msg.senderId?.toString() === currentUserId.toString();
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
    const isOwnReaction = latestReaction.userId?.toString() === currentUserId.toString();
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

export const getUserBySearch = async (req, res) => {
    try {
        const search = req.query.search || '';
        const currentUserID = req.user._conditions._id;
        const currentUser = await User.findById(currentUserID).select("blockedUsers");
        const blockedIds = (currentUser?.blockedUsers || []).map((id) => id.toString());

        const user = await User.find({
            $and: [
                {
                    $or: [
                        { username: { $regex: '.*' + search + '.*', $options: 'i' } },
                        { fullname: { $regex: '.*' + search + '.*', $options: 'i' } }
                    ]
                },
                { _id: { $ne: currentUserID } },
                { _id: { $nin: blockedIds } }
            ]
        }).select("-password").select("email")

        res.status(200).send(user)

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error
        })
    }
}


export const getCorrentChatters = async (req, res) => {
    try {
        const currentUserID = req.user._conditions._id;
        const currenTChatters = await Conversation.find({
            participants: currentUserID
        }).sort({
            updatedAt: -1
        });

        if (!currenTChatters || currenTChatters.length === 0) return res.status(200).send([]);

        const partcipantsIDS = currenTChatters.reduce((ids, conversation) => {
            const otherParticipents = conversation.participants.filter(id => id !== currentUserID);
            return [...ids, ...otherParticipents]
        }, [])

        const otherParticipentsIDS = partcipantsIDS.filter(id => id.toString() !== currentUserID.toString());

        const user = await User.find({ _id: { $in: otherParticipentsIDS } }).select("-password").select("-email");

        const users = otherParticipentsIDS.map(id => user.find(user => user._id.toString() === id.toString()));

        res.status(200).send(users)

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error
        })
    }
}




export const getChatList = async (req, res) => {
    try {
        const currentUserId = req.user._conditions._id;
        const currentUser = await User.findById(currentUserId)
            .select("blockedUsers hiddenChats");

        const excludedIds = new Set([
            ...(currentUser?.blockedUsers || []).map((id) => id.toString()),
            ...(currentUser?.hiddenChats || []).map((id) => id.toString()),
        ]);

        const conversations = await Conversation.find({
            participants: currentUserId
        }).sort({ updatedAt: -1 });

        const chattedUserIds = new Set();
        const chatUsers = [];

        for (const convo of conversations) {
            const otherUserId = convo.participants.find(
                (id) => id.toString() !== currentUserId.toString()
            );
            if (!otherUserId) continue;
            if (excludedIds.has(otherUserId.toString())) continue;

            const user = await User.findById(otherUserId)
                .select("-password -email");
            if (!user) continue;

            chattedUserIds.add(user._id.toString());

            const clearedAt = getUserClearedAt(convo, currentUserId);
            let lastMessage = null;

            if (convo.messages?.length) {
                const visibleIds = convo.messages;
                const messages = await Message.find({
                    _id: { $in: visibleIds },
                    ...(clearedAt ? { createdAt: { $gt: clearedAt } } : {})
                }).sort({ createdAt: -1 }).limit(1);

                lastMessage = messages[0] || null;
            }

            const reactionPreview = lastMessage
                ? formatReactionPreview(lastMessage, currentUserId, user.username)
                : null;

            const unreadCount = await Message.countDocuments({
                senderId: otherUserId,
                reciverId: currentUserId,
                readBy: { $ne: currentUserId },
                ...(clearedAt ? { createdAt: { $gt: clearedAt } } : {}),
            });

            chatUsers.push({
                ...user.toObject(),
                unreadCount,
                lastMessage: lastMessage
                    ? {
                        _id: lastMessage._id,
                        message: lastMessage.message,
                        messageType: lastMessage.messageType,
                        senderId: lastMessage.senderId,
                        createdAt: lastMessage.createdAt,
                        documentName: lastMessage.documentName,
                        reactions: lastMessage.reactions
                    }
                    : null,
                lastPreview: reactionPreview
                    || (lastMessage
                        ? formatMessagePreview(lastMessage, currentUserId, user.username)
                        : "Chat cleared"),
                conversationUpdatedAt: convo.updatedAt
            });
        }

        if (chatUsers.length > 0) {
            return res.status(200).send(chatUsers);
        }

        const starterUsers = await User.find({
            _id: {
                $ne: currentUserId,
                $nin: [...excludedIds]
            }
        })
            .select("-password -email")
            .sort({ createdAt: -1 })
            .limit(5);

        const starters = starterUsers.map((user) => ({
            ...user.toObject(),
            lastMessage: null,
            lastPreview: "Start a conversation",
            conversationUpdatedAt: null,
            unreadCount: 0,
        }));

        res.status(200).send(starters);
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message || error
        });
    }
};


const clearConversationForUser = async (conversation, userId) => {
    const existingIndex = conversation.clearedFor?.findIndex(
        (c) => c.userId.toString() === userId.toString()
    ) ?? -1;

    const clearedEntry = {
        userId,
        clearedAt: new Date()
    };

    if (existingIndex >= 0) {
        conversation.clearedFor[existingIndex] = clearedEntry;
    } else {
        if (!conversation.clearedFor) conversation.clearedFor = [];
        conversation.clearedFor.push(clearedEntry);
    }

    await conversation.save();
};


export const blockUser = async (req, res) => {
    try {
        const currentUserId = req.user._conditions._id;
        const { id: otherUserId } = req.params;

        if (otherUserId.toString() === currentUserId.toString()) {
            return res.status(400).send({
                success: false,
                message: "Cannot block yourself"
            });
        }

        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: {
                blockedUsers: otherUserId,
                hiddenChats: otherUserId
            }
        });

        const conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, otherUserId] }
        });

        if (conversation) {
            await clearConversationForUser(conversation, currentUserId);
        }

        const userSocketId = getReciverSocketId(currentUserId);
        if (userSocketId) {
            io.to(userSocketId).emit("userBlocked", { otherUserId });
        }

        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message || error
        });
    }
};


export const removeChatUser = async (req, res) => {
    try {
        const currentUserId = req.user._conditions._id;
        const { id: otherUserId } = req.params;

        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: { hiddenChats: otherUserId }
        });

        const conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, otherUserId] }
        });

        if (conversation) {
            await clearConversationForUser(conversation, currentUserId);

            const userSocketId = getReciverSocketId(currentUserId);
            if (userSocketId) {
                io.to(userSocketId).emit("chatCleared", {
                    conversationId: conversation._id,
                    clearedBy: currentUserId,
                    otherUserId
                });
            }
        }

        const userSocketId = getReciverSocketId(currentUserId);
        if (userSocketId) {
            io.to(userSocketId).emit("chatUserRemoved", { otherUserId });
        }

        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message || error
        });
    }
};


export const getAllUsers = async (req, res) => {
    try {

        const currentUserID = req.user._conditions._id;

        const users = await User.find({
            _id: {
                $ne: currentUserID
            }
        })
            .select("-password")
            .select("-email");

        res.status(200).send(users);

    } catch (error) {

        res.status(500).send({
            success: false,
            message: error
        });

    }
}


export const getUserProfile = async (req, res) => {
    try {

        const user = await User.findById(req.params.id)
            .select("-password")
            .select("-email");

        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).send(user);

    } catch (error) {

        res.status(500).send({
            success: false,
            message: error
        });

    }
}