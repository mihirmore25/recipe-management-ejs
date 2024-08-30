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
        req.flash(
            "error_msg",
            "Not authorize to access this route, Please try logging in first."
        );
        return res.redirect("/login");
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user_data) => {
        if (err) {
            req.flash(
                "error_msg",
                "Not authorize to access this route, Please try logging in first."
            );
            return res.redirect("/login");
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
