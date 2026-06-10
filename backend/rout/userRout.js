import express from 'express'
import isLogin from '../middleware/isLogin.js'
import {
    getCorrentChatters,
    getUserBySearch,
    getAllUsers,
    getUserProfile,
    getChatList,
    blockUser,
    removeChatUser
}
    from '../routControlers/userhandlerControler.js'

const router = express.Router()

router.get('/search', isLogin, getUserBySearch);

router.get('/currentchatters', isLogin, getCorrentChatters);

router.get('/chatlist', isLogin, getChatList);

router.get('/allusers', isLogin, getAllUsers);

router.get('/profile/:id', isLogin, getUserProfile);

router.post('/block/:id', isLogin, blockUser);

router.delete('/chat/:id', isLogin, removeChatUser);

export default router