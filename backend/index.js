import "dotenv/config";
import express from "express"
import dbConnect from "./DB/dbConnect.js";
import authRouter from './rout/authUser.js'
import messageRouter from './rout/messageRout.js'
import userRouter from './rout/userRout.js'
import cookieParser from "cookie-parser";
import path from "path";


import dns from 'dns';
dns.setServers(["1.1.1.1", "8.8.8.8"]);


import { app, server } from './Socket/socket.js'

const __dirname = path.resolve();

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/message', messageRouter)
app.use('/api/user', userRouter)

// app.use(express.static(path.join(__dirname, "/frontend/dist")))

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);


// app.use((req, res) => {
//     res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"))
// })

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
    dbConnect();
    console.log(`Working at ${PORT}`);
})