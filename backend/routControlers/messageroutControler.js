import Conversation from "../Models/conversationModels.js";
import Message from "../Models/messageSchema.js";
import User from "../Models/userModels.js";
import { getReciverSocketId, io } from "../Socket/socket.js";
import {
    uploadToCloudinary,
    deleteFromCloudinary
} from "../utils/cloudinary.js";
import fs from "fs";
import path from "path";

const getCloudinaryResourceType = (messageType) => {
    if (messageType === "voice" || messageType === "video") return "video";
    if (messageType === "document") return "raw";
    return "image";
};

const removeMediaFile = async (url, messageType) => {
    if (!url) return;

    if (url.includes("cloudinary.com")) {
        await deleteFromCloudinary(
            url,
            getCloudinaryResourceType(messageType)
        );
        return;
    }

    if (url.startsWith("/uploads")) {
        const filePath = path.join(process.cwd(), url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

const restoreHiddenChatForReceiver = async (receiverId, senderId) => {
    const receiver = await User.findById(receiverId).select("hiddenChats");
    if (!receiver) return;

    const senderIdStr = String(senderId);
    const wasHidden = (receiver.hiddenChats || []).some(
        (id) => String(id) === senderIdStr
    );
    if (!wasHidden) return;

    await User.findByIdAndUpdate(receiverId, {
        $pull: { hiddenChats: senderId },
    });

    const sender = await User.findById(senderId).select("-password -email");
    const receiverSocketId = getReciverSocketId(receiverId);
    if (receiverSocketId && sender) {
        io.to(receiverSocketId).emit("chatUserRestored", {
            user: sender.toObject(),
        });
    }
};

const emitNewMessage = async (reciverId, senderId, message) => {
    await restoreHiddenChatForReceiver(reciverId, senderId);

    const receiverSocketId = getReciverSocketId(reciverId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", message);
    }

    const senderSocketId = getReciverSocketId(senderId);
    if (senderSocketId) {
        io.to(senderSocketId).emit("newMessage", message);
    }
};


const getUserClearedAt = (conversation, userId) => {
    const entry = conversation.clearedFor?.find(
        (c) => c.userId.toString() === userId.toString()
    );
    return entry?.clearedAt || null;
};

const filterMessagesForUser = (messages, clearedAt) => {
    if (!clearedAt) return messages;
    const clearedTime = new Date(clearedAt).getTime();
    return messages.filter(
        (m) => m && new Date(m.createdAt).getTime() > clearedTime
    );
};

const isMessagingBlocked = async (senderId, reciverId) => {
    const [sender, receiver] = await Promise.all([
        User.findById(senderId).select("blockedUsers"),
        User.findById(reciverId).select("blockedUsers"),
    ]);

    const senderBlocked = (receiver?.blockedUsers || []).some(
        (id) => id.toString() === senderId.toString()
    );
    const receiverBlocked = (sender?.blockedUsers || []).some(
        (id) => id.toString() === reciverId.toString()
    );

    return senderBlocked || receiverBlocked;
};

const getOrCreateConversation = async (senderId, reciverId) => {
    let chats = await Conversation.findOne({
        participants: { $all: [senderId, reciverId] }
    });

    if (!chats) {
        chats = await Conversation.create({
            participants: [senderId, reciverId],
        });
    }

    return chats;
};

export const sendMessage = async (req, res) => {
    try {
        const { messages, replyTo } = req.body;
        const { id: reciverId } = req.params;
        const senderId = req.user._conditions._id;

        if (await isMessagingBlocked(senderId, reciverId)) {
            return res.status(403).send({
                success: false,
                message: "Cannot send message to this user"
            });
        }

        const chats = await getOrCreateConversation(senderId, reciverId);

        const newMessages = new Message({
            senderId,
            reciverId,
            message: messages,
            conversationId: chats._id,
            replyTo: replyTo || null
        })

        // if(newMessages){
        //     chats.messages.push(newMessages._id);
        // }
        if (newMessages) {
            chats.messages.push(newMessages._id);

            // latest chat ko top lane ke liye
            chats.updatedAt = Date.now();
        }

        await Promise.all([chats.save(), newMessages.save()]);

        const populatedMessage = await Message.findById(newMessages._id).populate({
            path: "replyTo",
            select: "message messageType senderId imageUrl videoUrl documentName"
        });

        await emitNewMessage(reciverId, senderId, populatedMessage);

        res.status(201).send(populatedMessage)

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message || "Failed to send message"
        })
    }
}


export const getMessages = async (req, res) => {
    try {
        const { id: reciverId } = req.params;
        const senderId = req.user._conditions._id;

        const chats = await Conversation.findOne({
            participants: { $all: [senderId, reciverId] }
        }).populate({
            path: "messages",
            populate: {
                path: "replyTo",
                select: "message messageType senderId imageUrl videoUrl documentName"
            }
        })

        if (!chats) return res.status(200).send([]);

        const clearedAt = getUserClearedAt(chats, senderId);
        const message = filterMessagesForUser(chats.messages, clearedAt)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        res.status(200).send(message)
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error
        })
    }
}



export const deleteMessage = async (
    req,
    res
) => {

    try {

        const { id } = req.params;

        const currentUserId =
            req.user._conditions._id;

        const message =
            await Message.findById(id);


        if (!message) {

            return res.status(404)
                .send({
                    success: false,
                    message: "Message not found"
                });

        }

        if (message.messageType === "voice" && message.audioUrl) {
            await removeMediaFile(message.audioUrl, "voice");
        }

        if (message.messageType === "image" && message.imageUrl) {
            await removeMediaFile(message.imageUrl, "image");
        }

        if (message.messageType === "video" && message.videoUrl) {
            await removeMediaFile(message.videoUrl, "video");
        }

        if (message.messageType === "document" && message.documentUrl) {
            await removeMediaFile(message.documentUrl, "document");
        }





        if (
            message.senderId.toString()
            !==
            currentUserId.toString()
        ) {

            return res.status(401)
                .send({
                    success: false,
                    message: "Unauthorized"
                });

        }

        await Conversation.updateOne(
            {
                _id:
                    message.conversationId
            },
            {
                $pull: {
                    messages: id
                }
            }
        );

        await Message.findByIdAndDelete(id);

        io.emit(
            "messageDeleted",
            id
        );

        res.status(200).send({
            success: true
        });

    } catch (error) {


        res.status(500).send({
            success: false,
            message: error.message
        });

    }
};

export const sendVoiceMessage =
    async (req, res) => {

        try {

            const senderId =
                req.user._conditions._id;

            const { id: reciverId } =
                req.params;

            if (await isMessagingBlocked(senderId, reciverId)) {
                return res.status(403).send({
                    success: false,
                    message: "Cannot send message to this user"
                });
            }

            let chats =
                await Conversation.findOne({

                    participants: {
                        $all: [
                            senderId,
                            reciverId
                        ]
                    }

                });

            if (!chats) {

                chats =
                    await Conversation.create({

                        participants: [
                            senderId,
                            reciverId
                        ]

                    });

            }

            const audioUrl = await uploadToCloudinary(
                req.file.buffer,
                "voice",
                "video"
            );

            const voiceMessage =
                await Message.create({

                    senderId,

                    reciverId,

                    conversationId:
                        chats._id,

                    messageType: "voice",

                    audioUrl

                });

            chats.messages.push(
                voiceMessage._id
            );

            await chats.save();

            await emitNewMessage(reciverId, senderId, voiceMessage);

            res.status(201)
                .send(voiceMessage);

        }
        catch (error) {

        }
    }


export const sendImageMessage =
    async (req, res) => {

        try {

            const senderId =
                req.user._conditions._id;

            const { id: reciverId } =
                req.params;

            if (await isMessagingBlocked(senderId, reciverId)) {
                return res.status(403).send({
                    success: false,
                    message: "Cannot send message to this user"
                });
            }

            let chats =
                await Conversation.findOne({

                    participants: {
                        $all: [
                            senderId,
                            reciverId
                        ]
                    }

                });

            if (!chats) {

                chats =
                    await Conversation.create({

                        participants: [
                            senderId,
                            reciverId
                        ]

                    });

            }

            const imageUrl = await uploadToCloudinary(
                req.file.buffer,
                "chat",
                "image"
            );

            const imageMessage =
                await Message.create({

                    senderId,

                    reciverId,

                    conversationId:
                        chats._id,

                    messageType: "image",

                    imageUrl

                });

            chats.messages.push(
                imageMessage._id
            );

            chats.updatedAt =
                Date.now();

            await chats.save();

            await emitNewMessage(reciverId, senderId, imageMessage);

            res.status(201)
                .send(imageMessage);

        }
        catch (error) {

            res.status(500).send({
                success: false,
                message: error.message || "Image upload failed"
            });

        }
    }


export const sendLocationMessage =
    async (req, res) => {

        try {

            const senderId =
                req.user._conditions._id;

            const { id: reciverId } =
                req.params;

            if (await isMessagingBlocked(senderId, reciverId)) {
                return res.status(403).send({
                    success: false,
                    message: "Cannot send message to this user"
                });
            }

            const { lat, lng, address } =
                req.body;

            let chats =
                await Conversation.findOne({

                    participants: {
                        $all: [
                            senderId,
                            reciverId
                        ]
                    }

                });

            if (!chats) {

                chats =
                    await Conversation.create({

                        participants: [
                            senderId,
                            reciverId
                        ]

                    });

            }

            const locationMessage =
                await Message.create({

                    senderId,

                    reciverId,

                    conversationId:
                        chats._id,

                    messageType: "location",

                    message: "Shared location",

                    location: {
                        lat,
                        lng,
                        address: address || ""
                    }

                });

            chats.messages.push(
                locationMessage._id
            );

            chats.updatedAt =
                Date.now();

            await chats.save();

            await emitNewMessage(
                reciverId,
                senderId,
                locationMessage
            );

            res.status(201)
                .send(locationMessage);

        }
        catch (error) {

            res.status(500).send({
                success: false,
                message: error.message
            });

        }
    }


export const sendVideoMessage =
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).send({
                    success: false,
                    message: "No video file uploaded",
                });
            }

            const senderId =
                req.user._conditions._id;

            const { id: reciverId } =
                req.params;

            if (await isMessagingBlocked(senderId, reciverId)) {
                return res.status(403).send({
                    success: false,
                    message: "Cannot send message to this user"
                });
            }

            const chats =
                await getOrCreateConversation(
                    senderId,
                    reciverId
                );

            let videoUrl;
            try {
                videoUrl = await uploadToCloudinary(
                    req.file.buffer,
                    "videos",
                    "video"
                );
            } catch (uploadError) {
                const uploadsDir = path.join(process.cwd(), "uploads", "videos");
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                const filename = `video-${Date.now()}-${req.file.originalname || "clip.mp4"}`;
                const filePath = path.join(uploadsDir, filename);
                fs.writeFileSync(filePath, req.file.buffer);
                videoUrl = `/uploads/videos/${filename}`;
            }

            const videoMessage =
                await Message.create({

                    senderId,
                    reciverId,
                    conversationId: chats._id,
                    messageType: "video",
                    videoUrl

                });

            chats.messages.push(videoMessage._id);
            chats.updatedAt = Date.now();
            await chats.save();

            await emitNewMessage(
                reciverId,
                senderId,
                videoMessage
            );

            res.status(201).send(videoMessage);

        }
        catch (error) {

            res.status(500).send({
                success: false,
                message: error.message || "Video upload failed"
            });

        }
    }


export const sendDocumentMessage =
    async (req, res) => {

        try {

            const senderId =
                req.user._conditions._id;

            const { id: reciverId } =
                req.params;

            if (await isMessagingBlocked(senderId, reciverId)) {
                return res.status(403).send({
                    success: false,
                    message: "Cannot send message to this user"
                });
            }

            const chats =
                await getOrCreateConversation(
                    senderId,
                    reciverId
                );

            const documentUrl =
                await uploadToCloudinary(
                    req.file.buffer,
                    "documents",
                    "raw"
                );

            const docMessage =
                await Message.create({

                    senderId,
                    reciverId,
                    conversationId: chats._id,
                    messageType: "document",
                    documentUrl,
                    documentName:
                        req.file.originalname,
                    message:
                        req.file.originalname

                });

            chats.messages.push(docMessage._id);
            chats.updatedAt = Date.now();
            await chats.save();

            await emitNewMessage(
                reciverId,
                senderId,
                docMessage
            );

            res.status(201).send(docMessage);

        }
        catch (error) {

            res.status(500).send({
                success: false,
                message: error.message || "Document upload failed"
            });

        }
    }


export const reactToMessage =
    async (req, res) => {

        try {

            const userId =
                req.user._conditions._id;

            const { emoji } = req.body;

            const message =
                await Message.findById(
                    req.params.id
                );

            if (!message) {
                return res.status(404).send({
                    success: false,
                    message: "Message not found"
                });
            }

            message.reactions =
                message.reactions.filter(
                    (r) =>
                        r.userId.toString()
                        !== userId.toString()
                );

            if (emoji) {
                message.reactions.push({
                    userId,
                    emoji
                });
            }

            await message.save();

            io.emit("messageUpdated", message);

            res.status(200).send(message);

        }
        catch (error) {

            res.status(500).send({
                success: false,
                message: error.message
            });

        }
    }


export const markMessagesAsRead =
    async (req, res) => {

        try {

            const currentUserId =
                req.user._conditions._id;

            const { id: senderId } =
                req.params;

            const conversation = await Conversation.findOne({
                participants: { $all: [currentUserId, senderId] },
            });
            const clearedAt = conversation
                ? getUserClearedAt(conversation, currentUserId)
                : null;

            const unreadQuery = {
                senderId,
                reciverId: currentUserId,
                readBy: { $ne: currentUserId },
                ...(clearedAt ? { createdAt: { $gt: clearedAt } } : {}),
            };

            const unreadMessages = await Message.find(unreadQuery).select("_id");

            if (!unreadMessages.length) {
                return res.status(200).send({ success: true });
            }

            const messageIds = unreadMessages.map((m) => m._id);

            await Message.updateMany(
                { _id: { $in: messageIds } },
                { $addToSet: { readBy: currentUserId } }
            );

            const senderSocketId = getReciverSocketId(senderId);

            if (senderSocketId) {
                io.to(senderSocketId).emit("messagesRead", {
                    readerId: currentUserId,
                    senderId,
                    messageIds,
                });
            }

            res.status(200).send({
                success: true
            });

        }
        catch (error) {

            res.status(500).send({
                success: false,
                message: error.message
            });

        }
    }


export const clearChat =
    async (req, res) => {

        try {

            const currentUserId =
                req.user._conditions._id;

            const { id: otherUserId } =
                req.params;

            const chats =
                await Conversation.findOne({
                    participants: {
                        $all: [
                            currentUserId,
                            otherUserId
                        ]
                    }
                });

            if (!chats) {
                return res.status(200).send({
                    success: true
                });
            }

            const existingIndex = chats.clearedFor?.findIndex(
                (c) => c.userId.toString() === currentUserId.toString()
            ) ?? -1;

            const clearedEntry = {
                userId: currentUserId,
                clearedAt: new Date()
            };

            if (existingIndex >= 0) {
                chats.clearedFor[existingIndex] = clearedEntry;
            } else {
                if (!chats.clearedFor) chats.clearedFor = [];
                chats.clearedFor.push(clearedEntry);
            }

            await chats.save();

            const userSocketId = getReciverSocketId(currentUserId);
            if (userSocketId) {
                io.to(userSocketId).emit("chatCleared", {
                    conversationId: chats._id,
                    clearedBy: currentUserId,
                    otherUserId
                });
            }

            res.status(200).send({
                success: true
            });

        }
        catch (error) {

            res.status(500).send({
                success: false,
                message: error.message
            });

        }
    }


export const exportChat =
    async (req, res) => {

        try {

            const currentUserId =
                req.user._conditions._id;

            const { id: otherUserId } =
                req.params;

            const chats =
                await Conversation.findOne({
                    participants: {
                        $all: [
                            currentUserId,
                            otherUserId
                        ]
                    }
                }).populate("messages");

            if (!chats) {
                return res.status(200).send(
                    "No messages to export."
                );
            }

            const clearedAt = getUserClearedAt(chats, currentUserId);
            const visibleMessages = filterMessagesForUser(
                chats.messages || [],
                clearedAt
            ).sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );

            if (!visibleMessages.length) {
                return res.status(200).send(
                    "No messages to export."
                );
            }

            const lines =
                visibleMessages.map((msg) => {

                    const time =
                        new Date(
                            msg.createdAt
                        ).toLocaleString();

                    let content = msg.message;

                    if (msg.messageType === "image") {
                        content = `[Image] ${msg.imageUrl}`;
                    }
                    else if (
                        msg.messageType === "video"
                    ) {
                        content = `[Video] ${msg.videoUrl}`;
                    }
                    else if (
                        msg.messageType === "voice"
                    ) {
                        content = `[Voice] ${msg.audioUrl}`;
                    }
                    else if (
                        msg.messageType === "document"
                    ) {
                        content = `[Document] ${msg.documentName}`;
                    }
                    else if (
                        msg.messageType === "location"
                    ) {
                        content = `[Location] ${msg.location?.lat}, ${msg.location?.lng}`;
                    }

                    const sender =
                        msg.senderId.toString()
                        === currentUserId.toString()
                            ? "You"
                            : "Contact";

                    return `[${time}] ${sender}: ${content}`;
                });

            const exportText =
                lines.join("\n");

            res.setHeader(
                "Content-Disposition",
                `attachment; filename=nexchat-export-${Date.now()}.txt`
            );

            res.setHeader(
                "Content-Type",
                "text/plain"
            );

            res.status(200).send(exportText);

        }
        catch (error) {

            res.status(500).send({
                success: false,
                message: error.message
            });

        }
    }