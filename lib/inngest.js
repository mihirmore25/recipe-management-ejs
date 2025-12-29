import { Inngest } from "inngest";

// Validate required Inngest environment variables
if (!process.env.INNGEST_EVENT_KEY) {
    console.warn(
        "⚠️  WARNING: INNGEST_EVENT_KEY is not set. Inngest will not work properly."
    );
}

export const inngest = new Inngest({
    id: "recipe-management-app",
    eventKey: process.env.INNGEST_EVENT_KEY,
    baseUrl:
        process.env.NODE_ENV === "production"
            ? process.env.PRODUCTION_CLIENT_URL
            : "http://localhost:3000",
});
