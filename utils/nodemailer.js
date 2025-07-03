import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    service: "outlook",
    port: 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
    },
});

export const sendResetPasswordEmail = async (email, token) => {
    const resetURL =
        process.env.NODE_ENV === "production"
            ? `${process.env.PRODUCTION_CLIENT_URL}/auth/resetPassword/${token}`
            : `${process.env.DEVELOPMENT_CLIENT_URL}/auth/resetPassword/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset",
        text: `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link, or paste this into your browser to complete the process: ${resetURL}`,
    };

    const response = await transporter.sendMail(mailOptions);

    return response;
};
