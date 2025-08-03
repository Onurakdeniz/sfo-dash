import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not set");
}

export const sql = postgres(process.env.POSTGRES_URL);
export const db = drizzle(sql, { schema });
