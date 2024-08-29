import { User } from "../models/User.js";
import { Recipe } from "../models/Recipe.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export const getCreateRecipe = async (req, res) => {
    return res.status(200).render("createRecipe");
};

export const createRecipe = async (req, res) => {
    let token;

    token = req.cookies.access_token;

    console.log("Token --> ", token);

    if (!token) {
        req.flash(
            "error_msg",
            "Not authorize to access this route, Please try again!"
        );
        return res.redirect("/recipes");
    }

    const {
        title,
        description,
        totalTime,
        prepTime,
        cookingTime,
        ingredients,
        instructions,
        calories,
        carbs,
        protein,
        fat,
    } = req.body;

    console.log("Req Body --> ", req.body);

    if (
        !title ||
        !description ||
        !totalTime ||
        !prepTime ||
        !cookingTime ||
        !ingredients ||
        !instructions ||
        !calories ||
        !carbs ||
        !protein ||
        !fat
    ) {
        req.flash("error_msg", "All the given fields are required.");
        return res.redirect("/recipes/getCreateRecipe");
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user_data) => {
        if (err) {
            req.flash("error_msg", "This session has expired. Please login");
            return res.redirect("/login");
        }

        // console.log(req.file.path);
        const recipeImageLocalPath = req.file?.path || undefined;
        console.log("Recipe Image Local Path ---> ", recipeImageLocalPath);
        if (!recipeImageLocalPath || undefined) {
            req.flash("error_msg", "Please upload your recipe image!");
            return res.redirect("/recipes/getCreateRecipe");
        }

        const recipeImage = await uploadOnCloudinary(recipeImageLocalPath);
        if (!recipeImage) {
            req.flash("error_msg", "Please upload your recipe image!");
            return res.redirect("/recipes/getCreateRecipe");
        }

        if (recipeImage.url) {
            fs.unlinkSync(recipeImageLocalPath);
            console.log(
                "Image removed from local server and uploaded to remote successfully.."
            );
        }

        const newRecipe = await Recipe.create({
            recipeImage: recipeImage.url || "",
            title,
            description,
            totalTime,
            prepTime,
            cookingTime,
            ingredients,
            instructions,
            calories,
            carbs,
            protein,
            fat,
            user: user_data.id,
        });

        const newCreatedRecipe = await newRecipe.save();

        console.log(newCreatedRecipe._doc);

        return res.status(200).redirect("/recipes");
    });
};

export const getRecipes = async (req, res) => {
    const recipes = await Recipe.find()
        .populate("user", "username email _id")
        .sort({ createdAt: -1 });

    if (recipes.length <= 0 || recipes === null || recipes === undefined) {
        req.flash("error_msg", "No Recipes found! Try creating new recipe.");
        return res.redirect("/recipes");
    }
    console.log("Recipes --> ", recipes);

    const user = req.user;

    return res.status(200).render("recipes", { recipes, user });
};

export const getRecipe = async (req, res) => {
    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        req.flash("error_msg", "Recipe did not found!");
        return res.redirect("/recipes");
    }

    const recipe = await Recipe.findById(recipeId).select("-__v").lean();

    if (recipeId && (recipe === null || undefined || 0)) {
        req.flash("error_msg", "Recipe did not found!");
        return res.redirect("/recipes");
    }
    console.log("Recipe --> ", recipe);

    const user = req.user;

    return res.status(200).render("recipe", { recipe, user });
};

export const deleteRecipe = async (req, res) => {
    // let token = req.cookies.access_token;

    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        req.flash("error_msg", "Recipe did not found!");
        return res.redirect("/recipes");
    }

    const recipe = await Recipe.findById(recipeId);

    console.log("User --> ", req.user);

    if (recipeId && (recipe === null || undefined || 0)) {
        req.flash("error_msg", "Recipe did not found!");
        return res.redirect("/recipes");
    }

    if (
        req.user._id.toString() == recipe.user.toString() ||
        req.user.role == "admin"
    ) {
        const deletedRecipe = await Recipe.deleteOne({ _id: recipeId });

        console.log("Deleted Recipe --> ", deletedRecipe);

        req.flash("success_msg", "Recipe deleted successfully!");
        return res.status(200).redirect("/recipes");
    }

    req.flash("error_msg", "You can only delete your own recipe.");
    return res.redirect("/recipes");
};

export const getUpdateRecipe = async (req, res) => {
    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        req.flash("error_msg", "Recipe did not found!");
        return res.redirect("/recipes");
    }

    const recipe = await Recipe.findById(recipeId);

    if (recipeId && (recipe === null || undefined || 0)) {
        req.flash("error_msg", "Recipe did not found!");
        return res.redirect("/recipes");
    }

    return res.status(200).render("editRecipe", { recipe });
};

export const updateRecipe = async (req, res) => {
    const {
        title,
        description,
        totalTime,
        prepTime,
        cookingTime,
        ingredients,
        instructions,
        calories,
        carbs,
        protein,
        fat,
    } = req.body;

    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        req.flash("error_msg", "Recipe did not found!");
        return res.redirect("/recipes");
    }

    const recipe = await Recipe.findById(recipeId);

    if (recipeId && (recipe === null || undefined || 0)) {
        req.flash("error_msg", "Recipe did not found!");
        return res.redirect("/recipes");
    }

    console.log("User --> ", req.user);

    if (
        req.user._id.toString() == recipe.user.toString() ||
        req.user.role == "admin"
    ) {
        const recipeImageLocalPath = req.file?.path || undefined;
        console.log("Recipe Image local path ", recipeImageLocalPath);

        const recipeImage = await uploadOnCloudinary(recipeImageLocalPath);
        console.log("Recipe Image URL ", recipeImage.url);

        if (recipeImage.url) {
            fs.unlinkSync(recipeImageLocalPath);
            console.log(
                "Image removed from local server and uploaded to remote successfully.."
            );
        }

        const updatedRecipe = await Recipe.findOneAndUpdate(
            { _id: recipeId },
            {
                $set: {
                    recipeImage: recipeImage.url || recipe.recipeImage || null,
                    title,
                    description,
                    totalTime,
                    prepTime,
                    cookingTime,
                    ingredients,
                    instructions,
                    calories,
                    carbs,
                    protein,
                    fat,
                },
            },
            { new: true }
        ).select("-__v");

        console.log("Updated Recipe --> ", updatedRecipe);

        // return res.status(200).json({
        //     status: true,
        //     data: updatedRecipe,
        //     message: "Recipe has been updated successfully.",
        // });

        req.flash("success_msg", "Recipe Updated successfully!");
        return res.status(200).redirect("/recipes");
    }
};

export const getUserRecipes = async (req, res) => {
    let userId = req.params.id;

    const user = await User.findById(userId);
    // console.log(user);

    const recipes = await Recipe.find({ user: userId }).sort({ createdAt: -1 });

    console.log(recipes);

    const username =
        user.username[0].toUpperCase() + user.username.substring(1);

    return res.status(200).render("userRecipes", { recipes, username, user });
};
