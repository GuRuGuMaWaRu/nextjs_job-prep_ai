import { relations } from "drizzle-orm";
import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

import { JobInfoTable } from "./jobInfo";
import { createdAt, updatedAt } from "../schemaHelpers";
import { PasswordResetTokenTable, VerificationTokenTable } from "./token";
import { SessionTable } from "./session";

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
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  createdAt,
  updatedAt,
});

export const usersRelations = relations(UserTable, ({ many }) => ({
  jobInfos: many(JobInfoTable),
  verificationTokens: many(VerificationTokenTable),
  passwordResetTokens: many(PasswordResetTokenTable),
  sessions: many(SessionTable),
}));
