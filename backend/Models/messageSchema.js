import mongoose from "mongoose"

const messageSchema = mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reciverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    message: {
        type: String,
        default: ""
    },

    messageType: {
        type: String,
        enum: [
            "text",
            "voice",
            "image",
            "video",
            "document",
            "location"
        ],
        default: "text"
    },

    audioUrl: {
        type: String,
        default: ""
    },

    imageUrl: {
        type: String,
        default: ""
    },

    videoUrl: {
        type: String,
        default: ""
    },

    documentUrl: {
        type: String,
        default: ""
    },

    documentName: {
        type: String,
        default: ""
    },

    location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String, default: "" }
    },

    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },

    reactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        emoji: { type: String }
    }],

    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        default: null
    },
}, { timestamps: true })

const Message = mongoose.model("Message", messageSchema)

export default Message;
