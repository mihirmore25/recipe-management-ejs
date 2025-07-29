import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import passport from "../config/passport.js";
import { sendResetPasswordEmail } from "../utils/nodemailer.js";

const generateToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "30m",
    });
};

export const getRegister = async (req, res) => {
    return await res.status(200).render("home");
};

export const register = async (req, res) => {
    const { username, email, password } = req.body;
    console.log("Req Body --> ", req.body);

    if (!username || !email || !password) {
        req.flash("error_msg", "Username, Email, Password are required");
        return await res.redirect("/");
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
        return await res.redirect("/");
    }

    const savedUser = await newUser.save();

    const { role, ...user_data } = savedUser._doc;

    // console.log("User Data ---> ", user_data);

    req.flash("success_msg", "You have registered successfully! Please login.");
    return await res.status(201).redirect("/login");
};

export const getLogin = async (req, res) => {
    return await res.status(200).render("login");
};

export const login = async (req, res) => {
    const { email } = req.body;

    if (!email || !req.body.password) {
        req.flash("error_msg", "Email, Password are required.");
        return await res.redirect("/login");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        req.flash("error_msg", "Invalid email or password. Please try again!");
        return await res.redirect("/login");
    }

    // const isPasswordValid = bcrypt.compareSync(
    //     req.body.password,
    //     user.password
    // );
    const isPasswordValid = await user.isPasswordValid(req.body.password);

    if (!isPasswordValid) {
        req.flash("error_msg", "Invalid email or password. Please try again!");
        return await res.redirect("/login");
    }

    const { password, ...user_data } = user._doc;

    const token = user.generateJWT();

    return await res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .redirect("recipes");
};

export const loginAsGuest = async (req, res) => {
    try {
        // Create a new guest user dynamically for the session
        const guestUser = new User({
            username: `Guest_${Date.now()}`, // Unique guest username
            email: `guest_${Date.now()}@example.com`, // Unique email
            password: `guest@123`, // No password for guest users
            role: "guest", // Assign the guest role
        });

        // console.log(guestUser);

        // Save the guest user in the database
        await guestUser.save();

        // Generate a JWT for the guest user
        const token = jwt.sign(
            { id: guestUser._id, role: "guest" },
            process.env.JWT_SECRET,
            { expiresIn: "30m" } // Token valid for 30 min
        );

        // Set the token in a cookie
        return await res.cookie("access_token", token, { httpOnly: true })
            .status(200)
            .redirect("/recipes"); // Redirect to the recipes page
    } catch (error) {
        // console.error("Error during guest login:", error);
        req.flash("error_msg", "Unable to login as guest. Please try again!");
        return await res.redirect("/login");
    }
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
    await req.flash("success_msg", "You have been logged out successfully!");
    await res.clearCookie("access_token", {
        sameSite: "none",
        secure: true,
    });
    await req.logout(async (err) => {
        if (err) return next(err);
        req.flash("success_msg", "You have been logged out successfully!");
        return await res.status(200).redirect("/");
    });
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            req.flash("error_msg", "Email Id is required!");
            return await res.status(400).redirect("/login");
        }

        const user = await User.findOne({ email });
        // console.log(user.email);

        if (!user) {
            req.flash("error_msg", "User not found, with this email id!");
            return await res.status(404).redirect("/login");
        }

        const token = crypto.randomBytes(20).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();
        // console.log("After", user);

        sendResetPasswordEmail(user.email, token).then(async (response) => {
            // console.log(response.response);
            console.log(response.data);
            
            req.flash("success_msg", "Forgot Password Mail Sent Successfully!");
            return await res.status(200).render("forgotPassword");
        });
    } catch (error) {
        return await res.status(500).redirect("/login");
    }
};

export const getResetPassword = async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
        req.flash(
            "error_msg",
            "Password reset token is invalid or has expired."
        );
        return await res.status(200).render("resetPassword");
    }

    return await res.status(200).render("resetPassword", { token });
};

export const postResetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
        req.flash("error_msg", "Invalid or expired token");
        return res.status(400).redirect("forgotPassword");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const updateUserPassword = await User.updateOne(
        {
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        },
        {
            $set: {
                password: hash,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        },
        {
            new: true,
            save: true,
        }
    );

    // console.log(updateUserPassword);

    let newToken = user.generateJWT();
    return await res
        .cookie("access_token", newToken, { httpOnly: true })
        .status(200)
        .redirect("/recipes");
};
