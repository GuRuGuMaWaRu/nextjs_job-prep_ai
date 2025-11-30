"use server";

import z from "zod";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/core/services/clerk/lib/getCurrentUser";
import {
  getJobInfo,
  insertJobInfo,
  updateJobInfo as updateJobInfoDb,
} from "./db";
import { jobInfoSchema } from "./schemas";

export async function createJobInfo(unsafeData: z.infer<typeof jobInfoSchema>) {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  const { success, data } = jobInfoSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: "Invalid job data",
    };
  }

  const jobInfo = await insertJobInfo({ ...data, userId });

  redirect(`/app/job-infos/${jobInfo.id}`);
}

export async function updateJobInfo(
  id: string,
  unsafeData: z.infer<typeof jobInfoSchema>
) {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  const { success, data } = jobInfoSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: "Invalid job data",
    };
  }

  const existingJobInfo = await getJobInfo(id, userId);
  if (existingJobInfo == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  const jobInfo = await updateJobInfoDb(id, data);

  redirect(`/app/job-infos/${jobInfo.id}`);
}
