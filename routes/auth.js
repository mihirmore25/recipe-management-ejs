import express from "express";
import {
    register,
    login,
    logout,
    getRegister,
    getLogin,
    googleAuth,
    googleAuthCallback,
} from "../controllers/auth.js";
// import passport from "passport";

const router = express.Router();

router.get("/", getRegister);
router.post("/", register);
router.get("/login", getLogin);
router.post("/login", login);
router.get("/logout", logout);
router.get("/auth/google", googleAuth);
router.get("/auth/google/recipes", googleAuthCallback);

// router.get(
//     "/auth/google",
//     passport.authenticate("google", {
//         scope: ["profile", "email"],
//     })
// );
// router.get(
//     "/auth/google/recipes",
//     passport.authenticate("google", {
//         successRedirect: "/recipes",
//         failureRedirect: "/home",
//     })
// );

export default router;
