import express from "express";
import { serve } from "inngest/express";
import { inngest } from "../lib/inngest.js";

import { functions } from "../inngest/functions/index.js";

const router = express.Router();

// Inngest endpoint

router.use(
    "/api/inngest",
    serve({
        client: inngest,
        functions: functions,
        signingKey:
            process.env.NODE_ENV === "production"
                ? process.env.INNGEST_SIGNING_KEY
                : undefined,
        onError: (error) => {
            console.error("Inngest Error:", error);
        },
    })
);

export default router;
