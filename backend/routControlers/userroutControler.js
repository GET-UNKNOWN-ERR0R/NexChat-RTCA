import User from "../Models/userModels.js";
import Message from "../Models/messageSchema.js";
import Conversation from "../Models/conversationModels.js";
import bcryptjs from 'bcryptjs'
import jwtToken from '../utils/jwtwebToken.js'
import { getAuthCookieOptions } from "../utils/cookieOptions.js";
import {
    uploadToCloudinary,
    deleteFromCloudinary
} from "../utils/cloudinary.js";
import { io } from "../Socket/socket.js";

const getDefaultAvatar = (user) => {
    if (user?.gender === "female") {
        return `https://eu.ui-avatars.com/api/?name=${user.username}`;
    }
    return `https://eu.ui-avatars.com/api/?name=${user?.username || "User"}`;
};

const emitProfileUpdated = (user) => {
    io.emit("profileUpdated", {
        _id: user._id,
        fullname: user.fullname,
        username: user.username,
        profilepic: user.profilepic,
        about: user.about,
        phone: user.phone,
    });
};

export const userRegister = async (req, res) => {
    try {
        const { fullname, username, email, gender, password, profilepic, about, phone, } = req.body;
        const user = await User.findOne({ username, email });
        if (user) return res.status(500).send({ success: false, message: " UserName or Email Alredy Exist " });
        const hashPassword = bcryptjs.hashSync(password, 10);
        const profileBoy = profilepic || `https://eu.ui-avatars.com/api/?name=${username}`;
        const profileGirl = profilepic || `https://eu.ui-avatars.com/api/?name=${username}`;

        const newUser = new User({
            fullname,
            username,
            email,
            password: hashPassword,
            gender,
            about,
            phone,
            profilepic: gender === "male" ? profileBoy : profileGirl
        })

        if (newUser) {
            await newUser.save();
            jwtToken(newUser._id, res)
        } else {
            res.status(500).send({ success: false, message: "Inavlid User Data" })
        }

        res.status(201).send({
            _id: newUser._id,
            fullname: newUser.fullname,
            username: newUser.username,
            profilepic: newUser.profilepic,
            email: newUser.email,
        })
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error
        })
    }
}

export const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email })
        if (!user) return res.status(500).send({ success: false, message: "Email Dosen't Exist Register" })
        const comparePasss = bcryptjs.compareSync(password, user.password || "");
        if (!comparePasss) return res.status(500).send({ success: false, message: "Email Or Password dosen't Matching" })

        jwtToken(user._id, res);

        res.status(200).send({
            _id: user._id,
            fullname: user.fullname,
            username: user.username,
            profilepic: user.profilepic,
            email: user.email,
            about: user.about,
            phone: user.phone,
            message: "Succesfully LogIn"
        })

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error
        })
    }
}


export const userLogOut = async (req, res) => {

    try {
        res.cookie("jwt", "", getAuthCookieOptions(0))
        res.status(200).send({ success: true, message: "User LogOut" })

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error
        })
    }
}


export const updateProfilePic =
    async (req, res) => {

        try {

            const userId =
                req.user._conditions._id;

            if (!req.file) {

                return res.status(400)
                    .send({
                        message:
                            "No image uploaded"
                    });

            }

            const existingUser =
                await User.findById(userId);

            const imageUrl = await uploadToCloudinary(
                req.file.buffer,
                "profile",
                "image"
            );

            if (
                existingUser?.profilepic?.includes(
                    "cloudinary.com"
                )
            ) {
                await deleteFromCloudinary(
                    existingUser.profilepic,
                    "image"
                );
            }

            const user =
                await User.findByIdAndUpdate(

                    userId,

                    {
                        profilepic: imageUrl
                    },

                    {
                        returnDocument: "after"
                    }

                );

            const payload = {
                _id: user._id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                profilepic: user.profilepic,
                about: user.about,
                phone: user.phone
            };

            emitProfileUpdated(payload);
            res.status(200).send(payload);

        }
        catch (error) {


            res.status(500).send(error);

        }

    }


export const removeProfilePic =
    async (req, res) => {

        try {

            const userId =
                req.user._conditions._id;

            const existingUser =
                await User.findById(userId);

            if (!existingUser) {
                return res.status(404).send({
                    success: false,
                    message: "User not found"
                });
            }

            if (
                existingUser.profilepic?.includes(
                    "cloudinary.com"
                )
            ) {
                await deleteFromCloudinary(
                    existingUser.profilepic,
                    "image"
                );
            }

            const defaultPic = getDefaultAvatar(existingUser);

            const user =
                await User.findByIdAndUpdate(
                    userId,
                    { profilepic: defaultPic },
                    { returnDocument: "after" }
                );

            const payload = {
                _id: user._id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                profilepic: user.profilepic,
                about: user.about,
                phone: user.phone
            };

            emitProfileUpdated(payload);
            res.status(200).send(payload);

        }
        catch (error) {


            res.status(500).send({
                success: false,
                message: error.message
            });

        }

    }


export const updateProfile =
    async (req, res) => {

        try {

            const userId =
                req.user._conditions._id;

            const {
                fullname,
                about,
                phone
            } = req.body;

            const updatedUser =
                await User.findByIdAndUpdate(

                    userId,

                    {
                        fullname,
                        about,
                        phone
                    },

                    {
                        returnDocument: "after"
                    }

                );

            const payload = {
                _id: updatedUser._id,
                fullname: updatedUser.fullname,
                username: updatedUser.username,
                email: updatedUser.email,
                profilepic: updatedUser.profilepic,
                about: updatedUser.about,
                phone: updatedUser.phone
            };

            emitProfileUpdated(payload);
            res.status(200).send(payload);

        }
        catch (error) {


            res.status(500).send(error);

        }

    }


export const deleteAccount =
    async (req, res) => {

        try {

            const userId =
                req.user._conditions._id;

            const { password } = req.body;

            const user =
                await User.findById(userId);

            if (!user) {
                return res.status(404).send({
                    success: false,
                    message: "User not found"
                });
            }

            const isPasswordValid =
                bcryptjs.compareSync(
                    password,
                    user.password || ""
                );

            if (!isPasswordValid) {
                return res.status(401).send({
                    success: false,
                    message: "Incorrect password"
                });
            }

            if (
                user.profilepic?.includes(
                    "cloudinary.com"
                )
            ) {
                await deleteFromCloudinary(
                    user.profilepic,
                    "image"
                );
            }

            const userMessages =
                await Message.find({
                    $or: [
                        { senderId: userId },
                        { reciverId: userId }
                    ]
                });

            for (const message of userMessages) {
                if (message.messageType === "voice" && message.audioUrl) {
                    await deleteFromCloudinary(message.audioUrl, "video");
                }
                if (message.messageType === "image" && message.imageUrl) {
                    await deleteFromCloudinary(message.imageUrl, "image");
                }
                if (message.messageType === "video" && message.videoUrl) {
                    await deleteFromCloudinary(message.videoUrl, "video");
                }
                if (message.messageType === "document" && message.documentUrl) {
                    await deleteFromCloudinary(message.documentUrl, "raw");
                }
            }

            await Message.deleteMany({
                $or: [
                    { senderId: userId },
                    { reciverId: userId }
                ]
            });

            await Conversation.deleteMany({
                participants: userId
            });

            await User.findByIdAndDelete(userId);

            io.emit("accountDeleted", { userId });

            res.cookie("jwt", "", getAuthCookieOptions(0));

            res.status(200).send({
                success: true,
                message: "Account permanently deleted"
            });

        }
        catch (error) {


            res.status(500).send({
                success: false,
                message: error.message
            });

        }

    }