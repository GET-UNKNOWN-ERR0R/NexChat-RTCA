import express from "express"
import {
    getMessages,
    sendMessage,
    deleteMessage,
    sendVoiceMessage,
    sendImageMessage,
    sendLocationMessage,
    sendVideoMessage,
    sendDocumentMessage,
    reactToMessage,
    markMessagesAsRead,
    clearChat,
    exportChat
} from "../routControlers/messageroutControler.js";

import memoryUpload
    from "../middleware/memoryUpload.js";

import isLogin from "../middleware/isLogin.js";

const router = express.Router();

router.post('/send/:id', isLogin, sendMessage)

router.get('/export/:id', isLogin, exportChat);

router.post('/read/:id', isLogin, markMessagesAsRead);

router.delete('/clear/:id', isLogin, clearChat);

router.post('/react/:id', isLogin, reactToMessage);

router.get('/:id', isLogin, getMessages);

router.delete(
    '/delete/:id',
    isLogin,
    deleteMessage
);

router.post(
    "/voice/:id",
    isLogin,
    memoryUpload.single("audio"),
    sendVoiceMessage
);

router.post(
    "/image/:id",
    isLogin,
    memoryUpload.single("image"),
    sendImageMessage
);

router.post(
    "/video/:id",
    isLogin,
    memoryUpload.single("video"),
    sendVideoMessage
);

router.post(
    "/document/:id",
    isLogin,
    memoryUpload.single("document"),
    sendDocumentMessage
);

router.post(
    "/location/:id",
    isLogin,
    sendLocationMessage
);

export default router
