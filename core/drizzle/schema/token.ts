import { relations } from "drizzle-orm";
import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

import { UserTable } from "./user";
import { id, createdAt } from "../schemaHelpers";

export const VerificationTokenTable = pgTable("verification_tokens", {
  id,
  userId: varchar("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  token: varchar().notNull().unique(),
  type: varchar().notNull(), // 'email_verification' | 'email_change' // TODO: add enum
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt,
});

export const PasswordResetTokenTable = pgTable("password_reset_tokens", {
  id,
  userId: varchar("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  token: varchar().notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt,
});

export const verificationTokenRelations = relations(
  VerificationTokenTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [VerificationTokenTable.userId],
      references: [UserTable.id],
    }),
  }),
);

export const passwordResetTokenRelations = relations(
  PasswordResetTokenTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [PasswordResetTokenTable.userId],
      references: [UserTable.id],
    }),
  }),
);
