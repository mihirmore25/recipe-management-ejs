import express from "express";
import cookieParser from "cookie-parser";
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
app.use(morgan("dev"));
app.set("view engine", "ejs");
// app.use(express.static(__dirname + "/public"));
app.use(express.static("public/styles"));

// Routes
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", recipeRoutes);

const PORT = process.env.APP_PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
});
