import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

export const isAdmin = (req, res, next) => {
    const user = req.user;

    const { role } = user;

    if (role !== "admin") {
        req.flash("error_msg", "You are not authorized to access this page.");
        return res.redirect("/");
    }
    next();
};
