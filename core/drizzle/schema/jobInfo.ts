import { pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { UserTable } from "./user";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { InterviewTable } from "./interview";
import { QuestionTable } from "./question";

export const experienceLevels = ["junior", "mid-level", "senior"] as const;
export type ExperienceLevel = (typeof experienceLevels)[number];
export const experienceLevelEnum = pgEnum(
  "job_info_experience_level",
  experienceLevels
);

export const JobInfoTable = pgTable("job_info", {
  id,
  title: varchar(),
  name: varchar().notNull(),
  experienceLevel: experienceLevelEnum().notNull(),
  description: varchar().notNull(),
  userId: varchar()
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  createdAt,
  updatedAt,
});

export const jobInfoRelations = relations(JobInfoTable, ({ one, many }) => ({
  user: one(UserTable, {
    fields: [JobInfoTable.userId],
    references: [UserTable.id],
  }),
  interviews: many(InterviewTable),
  questions: many(QuestionTable),
}));
