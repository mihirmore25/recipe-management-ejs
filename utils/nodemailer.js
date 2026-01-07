import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendResetPasswordEmail = async (email, token) => {
    const resetURL =
        process.env.NODE_ENV === "production"
            ? `${process.env.PRODUCTION_CLIENT_URL}/auth/resetPassword/${token}`
            : `${process.env.DEVELOPMENT_CLIENT_URL}/auth/resetPassword/${token}`;

    const mailOptions = {
        from: process.env.RESEND_FROM_EMAIL,
        to: "mihirmore.25@gmail.com",
        subject: "Password Reset",
        text: `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process: ${resetURL}`,
    };

    const response = await resend.emails.send(mailOptions);
    // console.log("Email sent:", response);

    return response;
};
