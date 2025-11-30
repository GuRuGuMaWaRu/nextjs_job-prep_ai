import { relations } from "drizzle-orm";
import { pgTable, varchar } from "drizzle-orm/pg-core";

import { JobInfoTable } from "./jobInfo";
import { createdAt, updatedAt } from "../schemaHelpers";

export const UserTable = pgTable("users", {
  id: varchar().primaryKey(),
  name: varchar().notNull(),
  email: varchar().notNull().unique(),
  image: varchar().notNull(),
  createdAt,
  updatedAt,
});

export const usersRelations = relations(UserTable, ({ many }) => ({
  jobInfo: many(JobInfoTable),
}));
