import cron from "node-cron";
import { User } from "../models/User.js";

export const removeGuestUserEveryThrityMinutes = (req, res, next) => {
    // Cron job to delete guest users every 30 minutes
    cron.schedule("0,30 * * * *", async () => {
        try {
            const result = await User.deleteMany({
                role: "guest", // Only delete users with the "guest" role
                createdAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) }, // Older than 2 minutes
            });
            console.log(
                `${
                    result.deletedCount
                } guest users deleted at ${new Date().toISOString()}`
            );
            next();
        } catch (error) {
            console.error("Error deleting guest users:", error);
        }
    });
};
