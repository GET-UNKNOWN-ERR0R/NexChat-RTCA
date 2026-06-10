import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import User from "../Models/userModels.js";
const app = express();

const server = http.createServer(app);
const allowedOrigins = [
    "http://localhost:5173",
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        methods: ["GET", "POST"],
        credentials: true,
    }
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
    socket.on(
        "typing",
        ({ senderId, receiverId }) => {

            typingUsers[senderId] = {
                receiverId,
                at: Date.now(),
            };

            io.emit("userTyping", {
                senderId,
                receiverId,
            });

            const receiverSocketId =
                getReciverSocketId(receiverId);

            if (receiverSocketId) {
                io.to(receiverSocketId).emit("typing", { senderId });
            }
        }
    );

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