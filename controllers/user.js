import { User } from "../models/User.js";
import { Recipe } from "../models/Recipe.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const getCreateUser = async (req, res) => {
    return await res.status(200).render("createUser");
};

export const createUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return await res.status(400).json({
            status: false,
            error: res.statusCode,
            data: [],
            message: "Username, Email, Password are required",
        });
    }

    const newUser = new User({
        username,
        email,
        password,
        role,
    });

    const userExist = await User.findOne({ email });

    // console.log("User Exist --> ", userExist);

    if (userExist) {
        return await res.status(400).json({
            status: false,
            error: res.statusCode,
            data: [],
            message:
                "It seems you already have an user, please try creating user with different email.",
        });
    }

    const savedUser = await newUser.save();

    // const { password, ...user_data } = savedUser._doc;

    // console.log("User Data ---> ", savedUser);

    return await res.status(201).json({
        status: true,
        data: savedUser,
        message: "New user account has been created successfully.",
    });
};

export const getAllUsers = async (req, res) => {
    const users = await User.find().select("-__v +password");

    // console.log(users, users.length);

    if (users.length === 0) {
        return await res.status(404).json({
            status: false,
            message: "Users are not found.",
        });
    }

    return await res.status(200).json({
        status: true,
        data: users,
    });
};

export const getUser = async (req, res) => {
    const userId = req.params.id;

    if (!userId || String(userId).length < 24) {
        return await res.status(404).json({
            status: false,
            message: "Please search user with valid user id.",
        });
    }

    const user = await User.findById(userId).select("-__v");

    if (userId && (user === null || undefined || 0)) {
        return await res.status(404).json({
            status: false,
            message: `User did not found with ${userId} id.`,
        });
    }

    return await res.status(200).json({
        status: true,
        data: user,
    });
};

export const deleteUser = async (req, res) => {
    const userId = req.params.id;

    if (!userId || String(userId).length < 24) {
        return await res.status(404).json({
            status: false,
            message: "Please search user with valid user id.",
        });
    }

    const user = await User.findById(userId).select("-__v");

    if (userId && (user === null || undefined || 0)) {
        return await res.status(404).json({
            status: false,
            message: `User did not found with ${userId} id.`,
        });
    }

    const deletedUser = await User.deleteOne({ _id: userId });

    if (deletedUser.acknowledged) {
        return await res.status(200).json({
            status: true,
            data: deletedUser,
            message: "User has been deleted successfully.",
        });
    }
};

export const updateUser = async (req, res) => {
    const { username, email } = req.body;

    // if (!username || !email || !password) {
    //     return res.status(401).json({
    //         status: false,
    //         error: res.statusCode,
    //         data: [],
    //         message: "Username, Email, Password are required",
    //     });
    // }

    let userId = req.params.id;

    if (!userId || String(userId).length < 24) {
        return await res.status(404).json({
            status: false,
            message: "Please search user with valid user id.",
        });
    }

    const user = await User.findById(userId);

    if (userId && (user === null || undefined || 0)) {
        return await res.status(404).json({
            status: false,
            message: `User did not found with ${userId} id.`,
        });
    }

    // console.log("User --> ", req.user);

    if (
        req.user._id.toString() == user._id.toString() ||
        req.user.role == "admin"
    ) {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                username,
                email,
            },
            { new: true }
        ).select("-__v");

        // console.log("Updated User --> ", updatedUser);

        return await res.status(200).json({
            status: true,
            data: updatedUser,
            message: "User has been updated successfully.",
        });
    }
};
