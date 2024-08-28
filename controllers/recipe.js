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

    if (!token)
        return res.status(401).json({
            status: false,
            error: res.statusCode,
            message:
                "Not authorize to access this route, Please try logging in first.",
        });

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

    jwt.verify(token, process.env.JWT_SECRET, async (err, user_data) => {
        if (err) {
            return res
                .status(401)
                .json({ message: "This session has expired. Please login" });
        }

        // console.log(req.file.path);
        const recipeImageLocalPath = req.file.path;
        console.log("Recipe Image Local Path ---> ", recipeImageLocalPath);

        const recipeImage = await uploadOnCloudinary(recipeImageLocalPath);

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

        // return res.status(200).json({
        //     status: true,
        //     data: [newCreatedRecipe._doc],
        //     message: "New Recipe created successfully.",
        // });
    });
};

export const getRecipes = async (req, res) => {
    const recipes = await Recipe.find()
        .populate("user", "username email _id")
        .sort({ createdAt: -1 });
    console.log("Recipes --> ", recipes);

    const user = req.user;

    res.status(200).render("recipes", { recipes, user });
};

export const getRecipe = async (req, res) => {
    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        return res.status(404).json({
            status: false,
            message: "Please search recipe with valid recipe id.",
        });
    }

    const recipe = await Recipe.findById(recipeId).select("-__v").lean();

    if (recipeId && (recipe === null || undefined || 0)) {
        return res.status(404).json({
            status: false,
            message: `Recipe did not found with ${recipeId} id.`,
        });
    }
    // console.log("Recipe --> ", recipe);

    // return res.status(200).json({
    //     status: true,
    //     data: recipe,
    // });

    const user = req.user;

    // const updatedRecipe = await Recipe.findByIdAndUpdate(recipeId, {
    //     views: { $push: user._id },
    // });
    // console.log(updatedRecipe);

    return res.status(200).render("recipe", { recipe, user });
};

export const deleteRecipe = async (req, res) => {
    // let token = req.cookies.access_token;

    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        return res.status(404).json({
            status: false,
            message: "Please search recipe with valid recipe id.",
        });
    }

    const recipe = await Recipe.findById(recipeId);

    console.log("User --> ", req.user);

    if (recipeId && (recipe === null || undefined || 0)) {
        return res.status(404).json({
            status: false,
            message: `Recipe did not found with ${recipeId} id.`,
        });
    }

    if (
        req.user._id.toString() == recipe.user.toString() ||
        req.user.role == "admin"
    ) {
        const deletedRecipe = await Recipe.deleteOne({ _id: recipeId });

        console.log("Deleted Recipe --> ", deletedRecipe);

        // return res.status(200).json({
        //     status: true,
        //     data: deletedRecipe,
        //     message: "Recipe has been deleted successfully.",
        // });
        return res.status(200).redirect("/recipes");
    }

    return res.status(400).json({
        status: false,
        message: "You can only delete your own recipe.",
    });
};

export const getUpdateRecipe = async (req, res) => {
    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        return res.status(404).json({
            status: false,
            message: "Please search recipe with valid recipe id.",
        });
    }

    const recipe = await Recipe.findById(recipeId);

    if (recipeId && (recipe === null || undefined || 0)) {
        return res.status(404).json({
            status: false,
            message: `Recipe did not found with ${recipeId} id.`,
        });
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
        return res.status(404).json({
            status: false,
            message: "Please search recipe with valid recipe id.",
        });
    }

    const recipe = await Recipe.findById(recipeId);

    if (recipeId && (recipe === null || undefined || 0)) {
        return res.status(404).json({
            status: false,
            message: `Recipe did not found with ${recipeId} id.`,
        });
    }

    console.log("User --> ", req.user);

    if (
        req.user._id.toString() == recipe.user.toString() ||
        req.user.role == "admin"
    ) {
        const updatedRecipe = await Recipe.findOneAndUpdate(
            { _id: recipeId },
            {
                $set: {
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
