import { relations } from "drizzle-orm";
import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

import { UserTable } from "./user";
import { id, createdAt } from "../schemaHelpers";

export const SessionTable = pgTable("sessions", {
  id,
  userId: varchar("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  token: varchar().notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt,
});

export const sessionRelations = relations(SessionTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [SessionTable.userId],
    references: [UserTable.id],
  }),
}));
