import { z } from "zod";

const envSchema = z.object({
  VERCEL_ENV: z.string().optional().default("development"),
  DATABASE_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);