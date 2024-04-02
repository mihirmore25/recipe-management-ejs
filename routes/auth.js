import express from "express";
import {
    register,
    login,
    logout,
    getRegister,
    getLogin,
} from "../controllers/auth.js";

const router = express.Router();

router.get("/", getRegister);
router.post("/", register);
router.get("/login", getLogin);
router.post("/login", login);
router.get("/logout", logout);

export default router;
