import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import { User } from "../models/User.js";

passport.use(
    "google",
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
            callbackURL: "https://recipe-management-ejs.onrender.com/auth/google/recipes",
            userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
        },
        async (accessToken, refreshToken, profile, cb) => {
            // console.log(profile);
            try {
                let user = await User.findOne({ googleId: profile.id }).select(
                    "+googleId"
                );
                if (!user) {
                    user = new User({
                        googleId: profile.id,
                        email: profile.email,
                        username: profile.displayName,
                        password: profile.provider,
                    });
                    await user.save();
                }

                return cb(null, user);
            } catch (error) {
                return cb(error, false);
            }
        }
    )
);

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});

export default passport;
