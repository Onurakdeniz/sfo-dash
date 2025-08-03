import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", (t) => ({
  id: t.text().primaryKey(),
  name: t.text(),
  email: t.text().notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  role: text("role").default("USER").notNull(),
  managerId: text("manager_id"),
  hashed_password: t.text(),
  image: t.text(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}));

// Alias to maintain backward compatibility for existing code that imports { user }
export { users as user }; 