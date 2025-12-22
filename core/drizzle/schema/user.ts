import { relations } from "drizzle-orm";
import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

import { JobInfoTable } from "./jobInfo";
import { createdAt, updatedAt } from "../schemaHelpers";

// User plan types
export const userPlans = ["free", "pro"] as const;
export type UserPlan = (typeof userPlans)[number];

export const UserTable = pgTable("users", {
  id: varchar().primaryKey(),
  name: varchar().notNull(),
  email: varchar().notNull().unique(),
  image: varchar(),
  passwordHash: varchar("password_hash"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  plan: varchar({ length: 50 }).notNull().default("free"),
  createdAt,
  updatedAt,
});

export const usersRelations = relations(UserTable, ({ many }) => ({
  jobInfo: many(JobInfoTable),
}));
