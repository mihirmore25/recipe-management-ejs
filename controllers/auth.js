import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "../config/passport.js";

const generateToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "30m",
    });
};

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

    req.flash("success_msg", "You have registered successfully! Please login.");
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

export const googleAuth = passport.authenticate("google", {
    scope: ["profile", "email"],
});

export const googleAuthCallback = (req, res, next) => {
    passport.authenticate("google", (err, user) => {
        if (err) return next(err);
        if (!user) return res.redirect("/");

        const token = generateToken(user);
        res.cookie("access_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        });
        res.redirect("/recipes");
    })(req, res, next);
};

export const logout = async (req, res) => {
    req.flash("success_msg", "You have been logged out successfully!");
    res.clearCookie("access_token", {
        sameSite: "none",
        secure: true,
    });
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success_msg", "You have been logged out successfully!");
        return res.status(200).redirect("/");
    });
};
