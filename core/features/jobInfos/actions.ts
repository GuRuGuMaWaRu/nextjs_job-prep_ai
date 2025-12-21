"use server";

import z from "zod";
import { redirect } from "next/navigation";
import { cacheTag } from "next/cache";

import { getCurrentUser } from "@/core/auth/server";
import {
  getJobInfoDb,
  createJobInfoDb,
  updateJobInfoDb,
  getJobInfoByIdDb,
  getJobInfosDb,
} from "@/core/features/jobInfos/db";
import { jobInfoSchema } from "@/core/features/jobInfos/schemas";
import {
  getJobInfoGlobalTag,
  getJobInfoIdTag,
} from "@/core/features/jobInfos/dbCache";
import { routes } from "@/core/data/routes";

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

  const jobInfo = await createJobInfoDb({ ...data, userId });

  redirect(routes.jobInfo(jobInfo.id));
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

  const existingJobInfo = await getJobInfoDb(id, userId);
  if (existingJobInfo == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  const jobInfo = await updateJobInfoDb(id, data);

  redirect(routes.jobInfo(jobInfo.id));
}

export async function getJobInfo(id: string, userId: string) {
  "use cache";
  cacheTag(getJobInfoIdTag(id));

  return await getJobInfoDb(id, userId);
}

export async function getJobInfoById(id: string) {
  "use cache";
  cacheTag(getJobInfoIdTag(id));

  return await getJobInfoByIdDb(id);
}

export async function getJobInfos(userId: string) {
  "use cache";
  cacheTag(getJobInfoGlobalTag());

  return await getJobInfosDb(userId);
}
