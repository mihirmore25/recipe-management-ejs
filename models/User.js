import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: "Your username is required",
            max: 50,
        },
        email: {
            type: String,
            required: "Your email is required",
            unique: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
                        v
                    );
                },
                message: "Please enter a valid email",
            },
        },
        password: {
            type: String,
            required: "Your password is required",
            select: false,
            max: 25,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
    },
    {
        timestamps: true,
    }
);

userSchema.methods.generateJWT = function () {
    let payload = {
        id: this._id,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "30m",
    });
};

userSchema.pre("save", function (next) {
    const user = this;

    if (!user.isModified("password")) return next();

    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) return next(err);

            user.password = hash;
            next();
        });
    });
});

export const User = mongoose.model("user", userSchema);
