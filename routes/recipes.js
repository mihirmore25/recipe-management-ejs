import express from "express";
import { verify } from "../middleware/verify.js";
import {
    createRecipe,
    deleteRecipe,
    getCreateRecipe,
    getRecipe,
    getRecipes,
    getUpdateRecipe,
    getUserRecipes,
    likeRecipe,
    updateRecipe,
} from "../controllers/recipe.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { restrictToRoles } from "../middleware/checkRole.js";

import { upload } from "../middleware/multer.js";

const router = express.Router();

router.get("/recipes", verify, getRecipes);
router.get(
    "/recipes/getCreateRecipe",
    verify,
    restrictToRoles("user", "admin"),
    getCreateRecipe
);
router.post(
    "/recipes/createRecipe",
    verify,
    restrictToRoles("user", "admin"),
    upload.single("recipeImage"),
    createRecipe
);
// router.get("/", verify, getRecipes);
// router.post("/", verify, createRecipe);
router.get("/recipes/:id", verify, getRecipe);
router.get(
    "/recipes/:id/deleteRecipe",
    verify,
    restrictToRoles("user", "admin"),
    deleteRecipe
);
router.get(
    "/recipes/:id/getUpdateRecipe",
    verify,
    restrictToRoles("user", "admin"),
    getUpdateRecipe
);
router.post(
    "/recipes/:id",
    verify,
    restrictToRoles("user", "admin"),
    upload.single("recipeImage"),
    updateRecipe
);
router.post(
    "/recipes/:id/like",
    verify,
    restrictToRoles("user", "admin"),
    likeRecipe
);

router.get(
    "/users/:id/",
    verify,
    restrictToRoles("user", "admin"),
    getUserRecipes
);

export default router;
