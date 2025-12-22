"use server";

import { cacheTag } from "next/dist/server/use-cache/cache-tag";

import { getUserIdTag } from "@/core/features/users/dbCache";
import { getUserByIdDb } from "@/core/features/users/db";
import { dalAssertSuccess } from "@/core/dal/helpers";
import { dalDbOperation } from "@/core/dal/helpers";

export async function getUser(id: string) {
  "use cache";
  cacheTag(getUserIdTag(id));

  return await dalAssertSuccess(
    await dalDbOperation(async () => await getUserByIdDb(id))
  );
}
