import { cleanupGuestUsers } from "./cleanupGuestUsers.js";
import { sendPasswordReset } from "./sendPasswordResetEmail.js";

export const functions = [
    cleanupGuestUsers,
    sendPasswordReset,
];
