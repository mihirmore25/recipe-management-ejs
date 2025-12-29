import { inngest } from "../../lib/inngest.js";
import { User } from "../../models/User.js";

export const cleanupGuestUsers = inngest.createFunction(
    {
        id: "cleanup-guest-users",
        name: "Cleanup Guest Users",
    },
    { cron: "0,30 * * * *" },
    async ({ step }) => {
        const result = await step.run("delete-expired-guests", async () => {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

            const deleteResult = await User.deleteMany({
                role: "guest",
                createdAt: { $lt: thirtyMinutesAgo },
            });

            console.log(`Deleted ${deleteResult.deletedCount} guest users`);

            return {
                deletedCount: deleteResult.deletedCount,
                timestamp: new Date().toISOString(),
            };
        });

        return result;
    }
);
