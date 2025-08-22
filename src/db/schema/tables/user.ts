import { boolean, pgTable, text, timestamp, check, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { role } from "..";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  role: role("role").default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  // Email format validation
  check('user_email_format_check', sql`email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'`),
  // Username format validation (alphanumeric, underscore, dash only)
  check('user_username_format_check', sql`username IS NULL OR username ~* '^[a-zA-Z0-9_-]+$'`),
  // Name length validation
  check('user_name_length_check', sql`length(name) >= 2 AND length(name) <= 100`),
  // Performance indexes for frequently queried columns
  index('user_email_idx').on(table.email),
  index('user_username_idx').on(table.username),
  index('user_role_idx').on(table.role),
  index('user_created_at_idx').on(table.createdAt),
]);

export type UserType = typeof user.$inferSelect;
