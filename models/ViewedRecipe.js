import mongoose from "mongoose";
const { Schema } = mongoose;

const viewedRecipeSchema = new Schema(
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
        viewedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Prevents duplicate view
viewedRecipeSchema.index({ user: 1, recipe: 1 }, { unique: true });

export const ViewedRecipe = mongoose.model("ViewedRecipe", viewedRecipeSchema);
