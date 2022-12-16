/* eslint-disable @typescript-eslint/naming-convention */
// @ts-check
import { z } from "zod";

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  RECAPTCHA_SECRET_KEY: z.string(),
  DATABASE_URL: z.string().url(),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.preprocess(parseInt, z.number().int()),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  JWT_SECRET: z.string(),
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z.string(),
  EMAIL_USERNAME: z.string(),
  EMAIL_PASSWORD: z.string(),
  TRANSFER_TOKEN_EXPIRES_IN_MINUTE: z.preprocess(parseInt, z.number().int()),
  BASE_FEE: z.preprocess(parseInt, z.number())
  // NEXTAUTH_URL: z.preprocess(
  //   // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
  //   // Since NextAuth automatically uses the VERCEL_URL if present.
  //   (str) => process.env.VERCEL_URL ?? str,
  //   // VERCEL_URL doesnt include `https` so it cant be validated as a URL
  //   process.env.VERCEL ? z.string() : z.string().url(),
  // ),
});

