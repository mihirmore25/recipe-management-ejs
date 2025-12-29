import { Inngest } from "inngest";

// Validate required Inngest environment variables
if (!process.env.INNGEST_EVENT_KEY) {
    console.warn(
        "⚠️  WARNING: INNGEST_EVENT_KEY is not set. Inngest will not work properly."
    );
}

if (!process.env.INNGEST_SIGNING_KEY) {
    console.warn(
        "⚠️  WARNING: INNGEST_SIGNING_KEY is not set. Inngest requests may fail."
    );
}

export const inngest = new Inngest({
    id: "recipe-management-app",
    eventKey: process.env.INNGEST_EVENT_KEY,
    signingKey: process.env.INNGEST_SIGNING_KEY,
    baseUrl:
        process.env.PRODUCTION_CLIENT_URL || process.env.DEVELOPMENT_CLIENT_URL,
});
