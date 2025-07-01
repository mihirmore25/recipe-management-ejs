import { DB_NAME } from "../constants/dbName.js";
import mongoose from "mongoose";
import dotenvx from "@dotenvx/dotenvx";

dotenvx.config({
    path:
        process.env.NODE_ENV === "production"
            ? ".env.production"
            : ".env.development",
});

// console.log(process.env.MONGO_URI);
export const dbClient = async () => {
    try {
        if (process.env.NODE_ENV === "production") {
            const connectionInstance = await mongoose.connect(
                `${process.env.MONGO_URI}/${DB_NAME}`,
                {
                    writeConcern: {
                        w: "majority",
                        journal: true,
                        wtimeoutMS: 5000,
                    },
                    readConcernLevel: "majority",
                }
            );

            console.log(
                `MONGODB CONNECTED! ON DB HOST: ${connectionInstance.connection.host} ON PORT: ${connectionInstance.connection.port} ON DB: ${connectionInstance.connection.db.databaseName}`
            );
        } else if (process.env.NODE_ENV === "development") {
            const connectionInstance = await mongoose.connect(
                `${process.env.MONGO_URI}/${DB_NAME}`,
                {
                    auth: {
                        username: process.env.USER,
                        password: process.env.PASSWORD,
                    },
                    authSource: process.env.AUTH_SOURCE,
                    writeConcern: {
                        w: "majority",
                        journal: true,
                        wtimeoutMS: 5000,
                    },
                    readConcernLevel: "local",
                }
            );
            console.log(
                `MONGODB CONNECTED! ON DB HOST: ${connectionInstance.connection.host} ON PORT: ${connectionInstance.connection.port} ON DB: ${connectionInstance.connection.db.databaseName}`
            );
        }
    } catch (e) {
        console.error(`MONGODB CONNECTION ERROR: --> `, e);
        process.exit(1);
    }
};
