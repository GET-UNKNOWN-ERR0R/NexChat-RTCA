import express from "express"
import { userLogOut, userLogin, userRegister, updateProfilePic, removeProfilePic, updateProfile, deleteAccount, } from "../routControlers/userroutControler.js";

import isLogin from "../middleware/isLogin.js";


import memoryUpload from
    "../middleware/memoryUpload.js";

const router = express.Router();

router.post('/register', userRegister);

router.post('/login', userLogin)

router.post('/logout', userLogOut)

router.put(
    "/profile-pic",

    isLogin,

    memoryUpload.single("profile"),

    updateProfilePic
);

router.delete(
    "/profile-pic",
    isLogin,
    removeProfilePic
);

router.put(
    "/profile",
    isLogin,
    updateProfile
);

router.delete(
    "/account",
    isLogin,
    deleteAccount
);

export default router