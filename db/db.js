import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { DB_NAME } from "../constants/dbName.js";
import mongoose from "mongoose";

// console.log(process.env.MONGO_URI);
export const dbClient = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGO_URI}/${DB_NAME}`,
            {
                auth: {
                    username: process.env.USER,
                    password: process.env.PASSWORD,
                },
                authSource: process.env.AUTH_SOURCE,
            }
        );

        console.log(
            `MONGODB CONNECTED! ON DB HOST: ${connectionInstance.connection.host} ON PORT: ${connectionInstance.connection.port}`
        );
    } catch (e) {
        console.error(`MONGODB CONNECTION ERROR: --> `, e);
        process.exit(1);
    }
};
