import express from "express";
import { verify } from "../middleware/verify.js";
import { isAdmin } from "../middleware/isAdmin.js";
import {
    getCreateUser,
    createUser,
    deleteUser,
    getAllUsers,
    getUser,
    updateUser,
} from "../controllers/user.js";

const router = express.Router();

// router.get("/", verify, isAdmin, getAllUsers);
// router.get("/:id", verify, isAdmin, getUser);
router.get("/users/getCreateUser", verify, isAdmin, getCreateUser);
router.post("/users/createUser", verify, isAdmin, createUser);
// router.delete("/:id", verify, isAdmin, deleteUser);
// router.put("/:id", verify, isAdmin, updateUser);

export default router;
