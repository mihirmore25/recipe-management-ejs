import { Inngest } from "inngest";

// Validate required Inngest environment variables
if (!process.env.INNGEST_EVENT_KEY) {
    console.warn(
        "⚠️  WARNING: INNGEST_EVENT_KEY is not set. Inngest will not work properly."
    );
}

// console.log("INNGEST_EVENT_KEY:", process.env.INNGEST_EVENT_KEY);

export const inngest = new Inngest({
    id: "recipe-management-app",
    eventKey: process.env.INNGEST_EVENT_KEY,
    isDev: process.env.NODE_ENV !== "production",
});
