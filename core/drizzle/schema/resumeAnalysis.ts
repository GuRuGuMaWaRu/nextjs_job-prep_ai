import { pgTable, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { JobInfoTable } from "./jobInfo";
import { createdAt, id, updatedAt } from "../schemaHelpers";

export const ResumeAnalysisTable = pgTable("resume_analyses", {
  id,
  jobInfoId: uuid()
    .notNull()
    .references(() => JobInfoTable.id, { onDelete: "cascade" }),
  createdAt,
  updatedAt,
});

export const resumeAnalysesRelations = relations(
  ResumeAnalysisTable,
  ({ one }) => ({
    jobInfo: one(JobInfoTable, {
      fields: [ResumeAnalysisTable.jobInfoId],
      references: [JobInfoTable.id],
    }),
  }),
);
