import mongoose from "mongoose";

const conversationSchema = mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: []
        }
    ],
    clearedFor: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            clearedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true })

const Conversation = mongoose.model('Conversation', conversationSchema)

export default Conversation;