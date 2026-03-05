import { z } from "zod";

import {
  FILE_SIZE_TOO_LARGE_MESSAGE,
  FILE_TYPE_NOT_SUPPORTED_MESSAGE,
} from "@/core/lib/errorToast";

export const MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_RESUME_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

const allowedResumeFileTypesSet: ReadonlySet<string> = new Set(
  ALLOWED_RESUME_FILE_TYPES,
);

export const resumeAnalysisInputSchema = z.object({
  jobInfoId: z.string().min(1, "Missing resume or job info id"),
  resumeFile: z
    .instanceof(File, { message: "Missing resume or job info id" })
    .refine((file) => file.size <= MAX_RESUME_FILE_SIZE, {
      message: FILE_SIZE_TOO_LARGE_MESSAGE,
    })
    .refine((file) => allowedResumeFileTypesSet.has(file.type), {
      message: FILE_TYPE_NOT_SUPPORTED_MESSAGE,
    }),
});
