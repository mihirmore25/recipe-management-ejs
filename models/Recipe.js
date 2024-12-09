import mongoose from "mongoose";
const Schema = mongoose.Schema;
import { User } from "./User.js";

const recipeSchema = new Schema(
    {
        recipeImage: {
            type: String,
            required: [true, "Your recipe image is required."],
            default: null,
        },
        title: {
            type: String,
            required: [true, "Your title is required"],
            max: 50,
        },
        description: {
            type: String,
            required: [true, "Your description is required"],
        },
        totalTime: {
            type: Number,
            required: [true, "Your total cooking time required"],
            default: 0,
        },
        prepTime: {
            type: Number,
            required: [true, "Your preparation time required"],
            default: 0,
        },
        cookingTime: {
            type: Number,
            required: [true, "Your cooking time required"],
            default: 0,
        },
        ingredients: {
            type: Array,
            required: [true, "Your cooking ingredients required"],
            default: [],
        },
        instructions: {
            type: Array,
            required: [true, "Your cooking instructions required"],
            default: [],
        },
        calories: {
            type: Number,
            required: [true, "Your recipe calories required"],
            default: 0,
        },
        carbs: {
            type: Number,
            required: [true, "Your recipe carbs required"],
            default: 0,
        },
        protein: {
            type: Number,
            required: [true, "Your recipe protein required"],
            default: 0,
        },
        fat: {
            type: Number,
            required: [true, "Your recipe fat required"],
            default: 0,
        },
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Recipe = mongoose.model("Recipe", recipeSchema);
