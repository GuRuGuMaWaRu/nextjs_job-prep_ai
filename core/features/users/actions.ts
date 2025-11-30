"use server";

import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { eq } from "drizzle-orm";

import { db } from "@/core/drizzle/db";
import { UserTable } from "@/core/drizzle/schema";
import { getUserIdTag } from "./dbCache";

export async function getUser(id: string) {
  "use cache";
  cacheTag(getUserIdTag(id));

  return db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
  });
}
