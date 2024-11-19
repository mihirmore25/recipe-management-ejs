import express from "express";
import {
    register,
    login,
    logout,
    getRegister,
    getLogin,
    loginAsGuest,
    googleAuth,
    googleAuthCallback,
    forgotPassword,
    getResetPassword,
    postResetPassword,
} from "../controllers/auth.js";

const router = express.Router();

router.get("/", getRegister);
router.post("/", register);
router.get("/login", getLogin);
router.post("/login", login);
router.get("/guestLogin", loginAsGuest);
router.get("/logout", logout);
router.get("/auth/google", googleAuth);
router.get("/auth/google/recipes", googleAuthCallback);
router.get("/auth/forgotPassword", async (req, res) => {
    res.render("forgotPassword");
});
router.post("/auth/forgotPassword", forgotPassword);
router.get("/auth/resetPassword/:token", getResetPassword);
router.post("/auth/resetPassword/:token", postResetPassword);

export default router;
