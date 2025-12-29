import { User } from "../models/User.js";
import { Recipe } from "../models/Recipe.js";
import { ViewedRecipe } from "../models/ViewedRecipe.js";
import { LikedRecipe } from "../models/LikedRecipe.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { Redis } from "ioredis";

let client;

if (process.env.NODE_ENV === "production") {
    client = new Redis(process.env.UPSTASH_REDIS_URL);
} else {
    client = new Redis({
        host: "localhost",
        port: 6379,
        password: process.env.REDIS_LOCAL_URL,
    });
}

client.on("connect", () => {
    console.log(`Connected to Redis successfully...`);
});

client.on("error", (error) => {
    console.error(`Redis connection error : ${error}`);
});

export const getCreateRecipe = async (req, res) => {
    const user = await User.findById(req.user._id);
    return await res.status(200).render("createRecipe", { user });
};

export const createRecipe = async (req, res) => {
    let token;

    token = req.cookies.access_token;

    // console.log("Token --> ", token);

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

    // console.log("Req Body --> ", req.body);

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
        // console.log("Recipe Image Local Path ---> ", recipeImageLocalPath);
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

        // console.log(newCreatedRecipe._doc);

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

        // const user = req.user;
        // console.log(user);
        const user = await User.findById(req.user._id);
        // console.log(user);

        await client.setex("recipes", 5, JSON.stringify(recipes, null, 4));

        return await res.status(200).render("recipes", {
            recipes,
            user,
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
    try {
        const recipeId = req.params.id;
        const userId = req.user?._id;

        if (!recipeId || String(recipeId).length < 24) {
            req.flash("error_msg", "Recipe did not found!");
            return await res.redirect("/recipes");
        }

        // Find Recipe
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
        const alreadyViewed = await ViewedRecipe.findOne({
            user: userId,
            recipe: recipeId,
        });

        // If not viewed already
        if (!alreadyViewed) {
            // Always have the latest viewedAt timestamp
            await ViewedRecipe.updateOne(
                { user: userId, recipe: recipeId },
                {
                    $set: { viewedAt: new Date() },
                },
                {
                    upsert: true, // creates a new doc if it doesn't exist
                }
            );

            // Increment recipe view count
            await Recipe.updateOne(
                {
                    _id: recipeId,
                },
                {
                    $inc: { views: 1 },
                }
            );
        }

        return await res.status(200).render("recipe", { recipe, user });
    } catch (error) {
        console.error("Error fetching recipe:", err);
        req.flash("error_msg", "Something went wrong!");
        return res.redirect("/recipes");
    }
};

export const deleteRecipe = async (req, res) => {
    // let token = req.cookies.access_token;

    let recipeId = req.params.id;

    if (!recipeId || String(recipeId).length < 24) {
        req.flash("error_msg", "Recipe did not found!");
        return await res.redirect("/recipes");
    }

    const recipe = await Recipe.findById(recipeId);

    // console.log("User --> ", req.user);

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
        // console.log(deleteImageFromCloudinary);

        // console.log("Deleted Recipe --> ", deletedRecipe);

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
    const user = await User.findById(req.user._id);

    if (recipeId && (recipe === null || undefined || 0)) {
        req.flash("error_msg", "Recipe did not found!");
        return await res.redirect("/recipes");
    }

    return await res.status(200).render("editRecipe", { recipe, user });
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

    // console.log("User --> ", req.user);

    if (
        req.user._id.toString() == recipe.user.toString() ||
        req.user.role == "admin"
    ) {
        if (req.file?.path) {
            const recipeImageLocalPath =
                path.resolve(req.file?.path) || undefined;
            console.log("Recipe Image local path ", recipeImageLocalPath);

            const recipeImage = await uploadOnCloudinary(recipeImageLocalPath);
            // console.log("Recipe Image URL ", recipeImage.url);

            if (recipeImage?.url) {
                if (fs.existsSync(recipeImageLocalPath)) {
                    fs.unlinkSync(recipeImageLocalPath);
                    console.log(
                        "Image removed from local server and uploaded to remote successfully.."
                    );
                } else {
                    console.warn(
                        "Local file not found, skipping deletion:",
                        recipeImageLocalPath
                    );
                }

                await deleteFromCloudinary(recipe.recipeImage.publicId);
                // console.log(deleteImageFromCloudinary);

                // Update recipeImage only if new image is provided
                recipe.recipeImage = {
                    publicId:
                        recipeImage.public_id || recipe.recipeImage.publicId,
                    imageUrl: recipeImage.url || recipe.recipeImage.imageUrl,
                };
            }
        }

        const updatedRecipe = await Recipe.findOneAndUpdate(
            { _id: recipeId },
            {
                $set: {
                    recipeImage: recipe.recipeImage,
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

        // console.log("Updated Recipe --> ", updatedRecipe);

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
    try {
        const recipeId = req.params.id;
        const userId = req.user?._id;

        // Validate Recipe Id format
        if (!recipeId || String(recipeId).length < 24) {
            req.flash("error_msg", "Recipe did not found!");
            return await res.redirect("/recipes");
        }

        // Find Recipe
        const recipe = await Recipe.findOne({ _id: recipeId })
            .select("-__v")
            .lean();

        // If recipe not found show error
        if (recipe === null || undefined || 0) {
            req.flash("error_msg", "Recipe did not found!");
            return await res.redirect("/recipes");
        }

        // Check if user has already liked this recipe
        const alreadyLiked = await LikedRecipe.findOne({
            user: userId,
            recipe: recipeId,
        });

        // If not already liked by user
        if (!alreadyLiked) {
            // Always have the latest likedAt timestamp
            await LikedRecipe.updateOne(
                {
                    user: userId,
                    recipe: recipeId,
                },
                {
                    $set: {
                        likedAt: new Date(),
                    },
                },
                { upsert: true } // creates a new doc if it doesn't exist
            );

            // Increment like count
            await Recipe.updateOne(
                {
                    _id: recipeId,
                },
                {
                    $inc: { likes: 1 },
                }
            );
        }

        // If liked by user then do this
        return await res.status(200).redirect(`/recipes/${recipeId}`);
    } catch (error) {
        console.error("Error liking recipe: ", error);
        req.flash("error_msg", "Something went wrong!");
        return res.redirect("/recipes");
    }
};

export { client };
