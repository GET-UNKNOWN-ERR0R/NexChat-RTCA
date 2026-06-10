import jwt from "jsonwebtoken";
import { getAuthCookieOptions } from "./cookieOptions.js";

const jwtToken = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });

    res.cookie("jwt", token, getAuthCookieOptions(30 * 24 * 60 * 60 * 1000));
};

export default jwtToken;
