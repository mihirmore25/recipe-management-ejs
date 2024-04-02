import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

export const isAdmin = (req, res, next) => {
    const user = req.user;

    const { role } = user;

    if (role !== "admin") {
        return res.status(401).json({
            status: false,
            message: "You are not authorized to access this page.",
        });
    }
    next();
};
