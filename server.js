import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import flash from "connect-flash";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import recipeRoutes from "./routes/recipes.js";
import morgan from "morgan";
import { dbClient } from "./db/db.js";
import { User } from "./models/User.js";
// import cron from "node-cron";
import { removeGuestUserEveryThrityMinutes } from "./middleware/removeGuestUser.js";
import passport from "./config/passport.js";
const app = express();

// DB connection
dbClient();

// Middleware
app.use(
    cors({
        origin: "http://localhost:3000",
        optionsSuccessStatus: 200,
    })
);
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "img-src": ["'self'", "data:", "http://res.cloudinary.com/"],
            },
        },
    })
);
app.use(helmet.xssFilter());
app.use(helmet.xXssProtection());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
    session({
        secret: process.env.EXPRESS_SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    // res.locals.error = req.flash("error"); // For Passport.js, if used
    next();
});
app.use(express.static("public/styles"));
app.use(express.static("public/js"));
app.use(express.static("public/temp"));
app.use(morgan("dev"));
app.set("view engine", "ejs");
// app.use(express.static(__dirname + "/public"));

// Cron job to delete guest users every 30 minutes
// cron.schedule("0,30 * * * *", async () => {
//     try {
//         const result = await User.deleteMany({
//             role: "guest", // Only delete users with the "guest" role
//             createdAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) }, // Older than 2 minutes
//         });
//         console.log(
//             `${
//                 result.deletedCount
//             } guest users deleted at ${new Date().toISOString()}`
//         );
//     } catch (error) {
//         console.error("Error deleting guest users:", error);
//     }
// });

// Routes
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", recipeRoutes);

const PORT = process.env.APP_PORT || 4000;

app.use(removeGuestUserEveryThrityMinutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
});
