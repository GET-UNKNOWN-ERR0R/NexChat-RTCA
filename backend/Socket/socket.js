import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../Models/userModels.js";
import { corsOriginCallback } from "../utils/corsOrigins.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: corsOriginCallback,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const typingUsers = {};

export const getReciverSocketId = (receverId) => {
    if (!receverId) return undefined;
    return userSocketmap[String(receverId)];
};

const userSocketmap = {}; //{userId,socketId}

const broadcastOnlineUsers = () => {
    const onlineIds = Object.keys(userSocketmap);
    io.emit("getOnlineUsers", onlineIds);
};

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId
        ? String(socket.handshake.query.userId)
        : null;

    if (userId) {
        userSocketmap[userId] = socket.id;
    }

    socket.on("requestOnlineUsers", () => {
        socket.emit("getOnlineUsers", Object.keys(userSocketmap));
    });
    socket.on("typing", ({ senderId, receiverId }) => {
        const sid = senderId ? String(senderId) : "";
        const rid = receiverId ? String(receiverId) : "";
        if (!sid || !rid) return;

        typingUsers[sid] = {
            receiverId: rid,
            at: Date.now(),
        };

        io.emit("userTyping", {
            senderId: sid,
            receiverId: rid,
        });

        const receiverSocketId = getReciverSocketId(rid);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", { senderId: sid });
        }
    });

    socket.on("stopTyping", ({ senderId, receiverId }) => {
        const sid = senderId ? String(senderId) : "";
        const rid = receiverId ? String(receiverId) : "";
        if (!sid || !rid) return;

        delete typingUsers[sid];

        io.emit("userTypingStop", { senderId: sid, receiverId: rid });

        const receiverSocketId = getReciverSocketId(rid);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stopTyping", { senderId: sid });
        }
    });

    socket.on("chatActive", ({ userId, chattingWith }) => {
        socket.data.activeChat = chattingWith;
        socket.data.userId = userId;
        io.emit("userChatActive", { userId, chattingWith });
    });

    socket.on("chatInactive", ({ userId }) => {
        socket.data.activeChat = null;
        io.emit("userChatInactive", { userId });
    });
    socket.emit("getOnlineUsers", Object.keys(userSocketmap));
    socket.broadcast.emit("getOnlineUsers", Object.keys(userSocketmap));

    socket.on(
        'disconnect',
        async () => {

            if (userId && userSocketmap[userId] === socket.id) {

                await User.findByIdAndUpdate(
                    userId,
                    {
                        lastSeen: new Date()
                    }
                );

                delete userSocketmap[userId];

                broadcastOnlineUsers();
            }
        }
    );


});

export { app, io, server }