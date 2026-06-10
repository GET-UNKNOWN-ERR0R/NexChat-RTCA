import jwt from "jsonwebtoken";
import User from "../Models/userModels.js";

const isLogin = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).send({
                success: false,
                message: "User Unauthorize",
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).send({
                success: false,
                message: "Server misconfigured: JWT_SECRET missing",
            });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const userQuery = User.findById(decode.userId).select("-password");

        req.user = userQuery;
        req.userId = decode.userId;
        next();
    } catch (error) {
        res.status(401).send({
            success: false,
            message: "User Unauthorize - Invalid Token",
        });
    }
};

export default isLogin;
