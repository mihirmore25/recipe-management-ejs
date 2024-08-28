import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import recipeRoutes from "./routes/recipes.js";
import morgan from "morgan";
import { dbClient } from "./db/db.js";
const app = express();

// DB connection
dbClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    session({
        secret: "secretSession",
        resave: false,
        saveUninitialized: true,
    })
);
app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    // res.locals.error = req.flash("error"); // For Passport.js, if used
    next();
});
app.use(morgan("dev"));
app.set("view engine", "ejs");
// app.use(express.static(__dirname + "/public"));
app.use(express.static("public/styles"));
app.use(express.static("public/js"));

// Routes
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", recipeRoutes);

const PORT = process.env.APP_PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
});
