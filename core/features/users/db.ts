import { eq } from "drizzle-orm";

import { UserTable } from "@/core/drizzle/schema";
import type { UserPlan } from "@/core/drizzle/schema/user";
import { db } from "@/core/drizzle/db";
import { revalidateUserCache } from "@/core/features/users/dbCache";

export async function upsertUserDb(user: typeof UserTable.$inferInsert) {
  await db
    .insert(UserTable)
    .values(user)
    .onConflictDoUpdate({
      target: [UserTable.id],
      set: user,
    });

  revalidateUserCache(user.id);
}

export async function deleteUserDb(id: string) {
  await db.delete(UserTable).where(eq(UserTable.id, id));
  revalidateUserCache(id);
}

export async function getUserByIdDb(id: string) {
  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
  });

  return user;
}

export async function getUserByStripeCustomerIdDb(stripeCustomerId: string) {
  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.stripeCustomerId, stripeCustomerId),
  });

  return user ?? null;
}

export async function updateUserPlanAndStripeIdsDb(
  userId: string,
  payload: {
    plan: UserPlan;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  },
) {
  await db
    .update(UserTable)
    .set({
      plan: payload.plan,
      ...(payload.stripeCustomerId !== undefined && {
        stripeCustomerId: payload.stripeCustomerId,
      }),
      ...(payload.stripeSubscriptionId !== undefined && {
        stripeSubscriptionId: payload.stripeSubscriptionId,
      }),
    })
    .where(eq(UserTable.id, userId));

  revalidateUserCache(userId);
}
