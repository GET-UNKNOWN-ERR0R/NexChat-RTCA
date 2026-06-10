import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    gender: {
        type: String,
        required: true,
        enum: ["male", "female"]
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    profilepic: {
        type: String,
        required: true,
        default: ""
    },

    about: {
        type: String,
        default: "Hey there! I am using NexChat."
    },

    phone: {
        type: String,
        default: ""
    },
    lastSeen: {
        type: Date,
        default: null
    },
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    hiddenChats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

const User = mongoose.model("User", userSchema)

export default User;