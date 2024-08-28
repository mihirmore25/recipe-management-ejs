import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const getRegister = async (req, res) => {
    return res.status(200).render("home");
};

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    console.log("Req Body --> ", req.body);

    if (!username || !email || !password) {
        req.flash("error_msg", "Username, Email, Password are required");
        return res.redirect("/");
    }

    const newUser = new User({
        username,
        email,
        password,
    });

    const userExist = await User.findOne({ email });

    console.log("User Exist --> ", userExist);

    if (userExist) {
        req.flash(
            "error_msg",
            "You already have an account, please log in instead."
        );
        return res.redirect("/");
    }

    const savedUser = await newUser.save();

    const { role, ...user_data } = savedUser._doc;

    console.log("User Data ---> ", user_data);

    req.flash("success_msg", "You have registered successfully! Please login.")
    return res.status(201).redirect("/login");
};

export const getLogin = async (req, res) => {
    return res.status(200).render("login");
};

export const login = async (req, res) => {
    const { email } = req.body;

    if (!email || !req.body.password) {
        req.flash("error_msg", "Email, Password are required.");
        return res.redirect("/login");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        req.flash("error_msg", "Invalid email or password. Please try again!");
        return res.redirect("/login");
    }

    const isPasswordValid = bcrypt.compareSync(
        req.body.password,
        user.password
    );

    if (!isPasswordValid) {
        req.flash("error_msg", "Invalid email or password. Please try again!");
        return res.redirect("/login");
    }

    const { password, ...user_data } = user._doc;

    const token = user.generateJWT();

    return res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .redirect("recipes");
};

export const logout = async (req, res) => {
    let token;

    token = req.cookies.access_token;

    let user_data = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(user_data.id);
    console.log(user);

    req.flash("success_msg", "You have been logged out successfully!")
    return res
        .clearCookie("access_token", {
            sameSite: "none",
            secure: true,
        })
        .status(200)
        .redirect("/");
};
