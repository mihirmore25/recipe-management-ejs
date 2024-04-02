import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

// console.log(process.env.JWT_SECRET);

export const verify = async (req, res, next) => {
    let token;

    if (req.cookies.access_token) {
        token = req.cookies.access_token;
    }

    console.log("Token --> ", token);

    if (!token) {
        return res
            .status(401)
            .json(
                "Not authorize to access this route, Please try logging in first."
            );
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user_data) => {
        if (err) {
            return res
                .status(401)
                .json({ message: "This session has expired. Please login" });
        }

        const { id } = user_data;
        // console.log("User Data --> ", id);

        const user = await User.findById(id);
        const { password, ...data } = user._doc;

        req.user = data;
        // console.log(req.user);
        next();
    });
};
