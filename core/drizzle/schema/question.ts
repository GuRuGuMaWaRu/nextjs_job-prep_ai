import { pgEnum, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { JobInfoTable } from "./jobInfo";
import { createdAt, id, updatedAt } from "../schemaHelpers";

export const questionDifficulties = ["easy", "medium", "hard"] as const;
export type QuestionDifficulty = (typeof questionDifficulties)[number];
export const questionDifficultyEnum = pgEnum(
  "questions_experience_level",
  questionDifficulties
);

export const QuestionTable = pgTable("questions", {
  id,
  jobInfoId: uuid()
    .notNull()
    .references(() => JobInfoTable.id, { onDelete: "cascade" }),
  text: varchar().notNull(),
  difficulty: questionDifficultyEnum().notNull(),
  createdAt,
  updatedAt,
});

export const questionsRelations = relations(QuestionTable, ({ one }) => ({
  jobInfo: one(JobInfoTable, {
    fields: [QuestionTable.jobInfoId],
    references: [JobInfoTable.id],
  }),
}));
