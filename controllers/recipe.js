import { User } from "../models/User.js";
import { Recipe } from "../models/Recipe.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { Redis } from "ioredis";

const client = new Redis();

client.on("connect", () => {
    console.log(`Connected to Redis successfully...`);
});

client.on("error", (error) => {
    console.error(`Redis connection error : ${error}`);
});

export const getCreateRecipe = async (req, res) => {
    return await res.status(200).render("createRecipe");
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
        return await res.redirect("/recipes");
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
        return await res.redirect("/recipes/getCreateRecipe");
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user_data) => {
        if (err) {
            req.flash("error_msg", "This session has expired. Please login");
            return await res.redirect("/login");
        }

        // console.log(req.file.path);
        const recipeImageLocalPath = req.file?.path || undefined;
        console.log("Recipe Image Local Path ---> ", recipeImageLocalPath);
        if (!recipeImageLocalPath || undefined) {
            req.flash("error_msg", "Please upload your recipe image!");
            return await res.redirect("/recipes/getCreateRecipe");
        }

        const recipeImage = await uploadOnCloudinary(recipeImageLocalPath);
        if (!recipeImage) {
            req.flash("error_msg", "Please upload your recipe image!");
            return await res.redirect("/recipes/getCreateRecipe");
        }

        if (recipeImage.url) {
            fs.unlinkSync(recipeImageLocalPath);
            console.log(
                "Image removed from local server and uploaded to remote successfully.."
            );
        }

        const newRecipe = await Recipe.create({
            recipeImage: {
                publicId: recipeImage.public_id,
                imageUrl: recipeImage.url || "",
            },
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

        return await res.status(200).redirect("/recipes");
    });
};

export const getRecipes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
        const sort = req.query.sort || "createdAt"; // Default sort by createdAt
        const order = req.query.order === "desc" ? -1 : 1; // Default order is ascending

        const skip = (page - 1) * limit;

        // Get the total count of recipes
        const totalRecipes = await Recipe.countDocuments();

        // Calculate total pages
        const totalPages = Math.ceil(totalRecipes / limit);

        let recipes = await client.getex("recipes", "PX", 600);
        if (recipes) {
            recipes = JSON.parse(recipes);
            return await res.status(200).render("recipes", {
                recipes,
                currentPage: page,
                totalPages,
                totalRecipes,
                limit,
                sort,
                order,
            });
        }

        // Fetch the paginated data
        recipes = await Recipe.find({})
            .populate("user", "username email _id")
            .sort({ [sort]: order })
            .skip(skip)
            .limit(limit);

        const user = req.user;

        await client.setex("recipes", 5, JSON.stringify(recipes, null, 4));

        return await res.status(200).render("recipes", {
            recipes,
            currentPage: page,
            totalPages,
            totalRecipes,
            limit,
            sort,
            order,
        });
    } catch (error) {
        console.error(error);
        req.flash("error_msg", "An error occured while fetching recipes");
        return await res.status(500).redirect("/recipes");
    }
    // const recipes = await Recipe.find()
    //     .populate("user", "username email _id")
    //     .sort({ createdAt: -1 });

    // console.log("Recipes --> ", recipes, recipes.length);

    // const user = req.user;

    // return res.status(200).render("recipes", { recipes, user });
};

export const getRecipe = async (req, res) => {
    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        req.flash("error_msg", "Recipe did not found!");
        return await res.redirect("/recipes");
    }

    const recipe = await Recipe.findOne({ _id: recipeId })
        .select("-__v")
        .lean();
    if (recipe === null || undefined || 0) {
        req.flash("error_msg", "Recipe did not found!");
        return await res.redirect("/recipes");
    }
    // console.log("Recipe --> ", recipe);

    // const user = req.user;
    const user = await User.findById(req.user._id);
    // console.log("User -> ", user._id, user);
    // Check if the user has already viewed the recipe

    if (!user.viewedRecipes.includes(recipe._id)) {
        // Increment view count if user hasn't viewed the recipe yet
        let updateViewCount = await Recipe.updateOne(
            { _id: recipe._id },
            {
                $set: {
                    views: recipe.views + 1,
                },
            }
        );
        console.log("After ", updateViewCount);

        // Add the post to the user's viewedRecipes array
        let updateViewedRecipes = await User.updateOne(
            { _id: user._id },
            {
                $push: {
                    viewedRecipes: recipe._id,
                },
            }
        );
        console.log("After ", user);
    }
    return await res.status(200).render("recipe", { recipe, user });
};

export const deleteRecipe = async (req, res) => {
    // let token = req.cookies.access_token;

    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        req.flash("error_msg", "Recipe did not found!");
        return await res.redirect("/recipes");
    }

    const recipe = await Recipe.findById(recipeId);

    console.log("User --> ", req.user);

    if (recipeId && (recipe === null || undefined || 0)) {
        req.flash("error_msg", "Recipe did not found!");
        return await res.redirect("/recipes");
    }

    if (
        req.user._id.toString() == recipe.user.toString() ||
        req.user.role == "admin"
    ) {
        const deletedRecipe = await Recipe.deleteOne({ _id: recipeId });

        const deleteImageFromCloudinary = await deleteFromCloudinary(
            recipe.recipeImage.publicId
        );
        console.log(deleteImageFromCloudinary);

        console.log("Deleted Recipe --> ", deletedRecipe);

        await req.flash("success_msg", "Recipe deleted successfully!");
        return await res.status(200).redirect("/recipes");
    }

    req.flash("error_msg", "You can only delete your own recipe.");
    return await res.redirect("/recipes");
};

export const getUpdateRecipe = async (req, res) => {
    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        req.flash("error_msg", "Recipe did not found!");
        return await res.redirect("/recipes");
    }

    const recipe = await Recipe.findById(recipeId);

    if (recipeId && (recipe === null || undefined || 0)) {
        req.flash("error_msg", "Recipe did not found!");
        return await res.redirect("/recipes");
    }

    return await res.status(200).render("editRecipe", { recipe });
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
        return await res.redirect("/recipes");
    }

    const recipe = await Recipe.findById(recipeId);

    if (recipeId && (recipe === null || undefined || 0)) {
        req.flash("error_msg", "Recipe did not found!");
        return await res.redirect("/recipes");
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

        const deleteImageFromCloudinary = await deleteFromCloudinary(
            recipe.recipeImage.publicId
        );
        console.log(deleteImageFromCloudinary);

        const updatedRecipe = await Recipe.findOneAndUpdate(
            { _id: recipeId },
            {
                $set: {
                    recipeImage: {
                        publicId: recipeImage.public_id || null,
                        imageUrl: recipeImage.url || recipe.recipeImage || null,
                    },
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
        return await res.status(200).redirect("/recipes");
    }
};

export const getUserRecipes = async (req, res) => {
    let userId = req.params.id;

    const user = await User.findById(userId);
    // console.log(user);

    const username =
        user.username[0].toUpperCase() + user.username.substring(1);

    const recipes = await Recipe.find({ user: userId }).sort({ createdAt: -1 });

    return await res
        .status(200)
        .render("userRecipes", { recipes, username, user });
};

export const likeRecipe = async (req, res) => {
    const recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        req.flash("error_msg", "Recipe did not found!");
        return await res.redirect("/recipes");
    }

    const recipe = await Recipe.findOne({ _id: recipeId })
        .select("-__v")
        .lean();

    if (recipe === null || undefined || 0) {
        req.flash("error_msg", "Recipe did not found!");
        return await res.redirect("/recipes");
    }

    // const recipe = await Recipe.findByIdAndUpdate(
    //     recipeId,
    //     {
    //         $inc: { likes: 1 },
    //     },
    //     {
    //         new: true,
    //     }
    // );

    const user = await User.findById(req.user._id);

    if (!user.likedRecipes.includes(recipe._id)) {
        // Increment likes count if user hasn't liked the recipe yet
        let updateLikeCount = await Recipe.updateOne(
            { _id: recipe._id },
            {
                // $set: {
                //     likes: recipe.likes + 1,
                // },
                $inc: {
                    likes: 1,
                },
            }
        );
        console.log("After ", updateLikeCount);

        // Add the like to the user's likedRecipes array
        let updateLikedRecipes = await User.updateOne(
            { _id: user._id },
            {
                $push: {
                    likedRecipes: recipe._id,
                },
            }
        );
        console.log("After ", user);
    }

    return await res.status(200).redirect(`/recipes/${recipeId}`);
};
