import { pgEnum } from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "other", "prefer_not_to_say"]);
