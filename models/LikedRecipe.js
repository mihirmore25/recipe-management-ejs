import mongoose from "mongoose";
const { Schema } = mongoose;

const likedRecipeSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipe: {
            type: Schema.Types.ObjectId,
            ref: "Recipe",
            required: true,
        },
        likedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Prevents duplicate like
likedRecipeSchema.index({ user: 1, recipe: 1 }, { unique: true });

export const LikedRecipe = mongoose.model("LikedRecipe", likedRecipeSchema);
