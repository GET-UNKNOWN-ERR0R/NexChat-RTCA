import mongoose from "mongoose";

const dbConnect = async () => {
    if (!process.env.MONGODB_CONNECT) {
        console.error("MongoDB Error: MONGODB_CONNECT is not set");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_CONNECT);
        console.log("DB connected Successfully");
    } catch (error) {
        console.error("MongoDB Error:", error.message);
        process.exit(1);
    }
};

export default dbConnect;
