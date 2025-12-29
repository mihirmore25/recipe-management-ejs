import { inngest } from "../../lib/inngest.js";
import { sendResetPasswordEmail } from "../../utils/nodemailer.js";

export const sendPasswordReset = inngest.createFunction(
    {
        id: "send-password-reset-email",
        name: "Send Password Reset Email",
        retries: 3, // Retry up to 3 times if the email fails
    },
    { event: "user/password.reset.requested" },
    async ({ event, step }) => {
        const { email, token, userId } = event.data;

        if (!email || !token) {
            throw new Error(
                "Missing required fields: email or token for password reset"
            );
        }

        const emailResult = await step.run("send-email", async () => {
            try {
                const response = await sendResetPasswordEmail(email, token);
                console.log(
                    `✅ Password reset email sent successfully to ${email}`
                );
                return {
                    success: true,
                    messageId: response.data?.id,
                    email,
                    sentAt: new Date().toISOString(),
                };
            } catch (error) {
                console.error(
                    `❌ Failed to send password reset email to ${email}:`,
                    error.message
                );
                throw error; // This will trigger a retry
            }
        });

        // Optional: Log the email send
        await step.run("log-email-sent", async () => {
            console.log(
                `Password reset email event completed for user ${userId} (${email})`
            );
        });

        return emailResult;
    }
);
