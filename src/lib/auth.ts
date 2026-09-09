import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js"; // Note: explicitly use relative path correctly
import * as schema from "../db/schema.js";

const productionUrl = "https://hris.baitulquranalikhwan.cloud";

/**
 * Sanitize URL: strip markdown link format like "[url](url)" and extra whitespace.
 * This prevents BetterAuthError if env var is accidentally set with markdown formatting.
 */
function sanitizeUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // Strip markdown link format: [text](url) -> url
  const markdownMatch = raw.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/);
  if (markdownMatch) return markdownMatch[1].trim();
  // Strip surrounding brackets or whitespace
  return raw.replace(/^\[|\]$/g, '').trim();
}

const baseUrl = sanitizeUrl(process.env.BETTER_AUTH_URL)
  || sanitizeUrl(process.env.APP_URL)
  || "http://localhost:3000";

export const auth = betterAuth({
    baseURL: baseUrl,
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: {
            ...schema
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }
    },
    user: {
        additionalFields: {
            teacherId: {
                type: "string",
                required: false,
            }
        }
    },
    trustedOrigins: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        sanitizeUrl(process.env.APP_URL) || productionUrl,
        productionUrl,
    ].filter((v, i, arr): v is string => typeof v === 'string' && v.length > 0 && arr.indexOf(v) === i)
});
