import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js"; // Note: explicitly use relative path correctly
import * as schema from "../db/schema.js";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: {
            ...schema
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            teacherId: {
                type: "string",
                required: false,
            }
        }
    },
    trustedOrigins: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]
});
