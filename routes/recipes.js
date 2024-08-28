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
    updateRecipe,
} from "../controllers/recipe.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.get("/recipes", verify, getRecipes);
router.get("/recipes/getCreateRecipe", verify, getCreateRecipe);
router.post("/recipes/createRecipe", verify, upload.single("recipeImage"), createRecipe);
// router.get("/", verify, getRecipes);
// router.post("/", verify, createRecipe);
router.get("/recipes/:id", verify, getRecipe);
router.get("/recipes/:id/deleteRecipe", verify, deleteRecipe);
router.get("/recipes/:id/getUpdateRecipe", verify, getUpdateRecipe);
router.post("/recipes/:id", verify, updateRecipe);

router.get("/users/:id/", verify, getUserRecipes);

export default router;
