import { sql } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { user } from "./schema/user";
import { relations } from "drizzle-orm";



// Re-export folder index containing all tables
export * from "./schema/index";


