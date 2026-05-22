import { and, eq, isNotNull, isNull } from "drizzle-orm";

import { UserTable } from "@/core/drizzle/schema";
import type { UserPlan } from "@/core/drizzle/schema/user";
import { db } from "@/core/drizzle/db";
import { revalidateUserCache } from "@/core/features/users/dbCache";

type UpdateUserPlanAndStripeIdsPayload = {
  plan: UserPlan;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

function toUserPlanAndStripeIdsUpdate(
  payload: UpdateUserPlanAndStripeIdsPayload,
) {
  return {
    plan: payload.plan,
    ...(payload.stripeCustomerId !== undefined && {
      stripeCustomerId: payload.stripeCustomerId,
    }),
    ...(payload.stripeSubscriptionId !== undefined && {
      stripeSubscriptionId: payload.stripeSubscriptionId,
    }),
  };
}

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

/**
 * Returns user ids that still reference a Stripe subscription id (reconciliation jobs).
 */
export async function getUserIdsWithStripeSubscriptionDb(limit = 500) {
  const rows = await db
    .select({ id: UserTable.id })
    .from(UserTable)
    .where(isNotNull(UserTable.stripeSubscriptionId))
    .limit(limit);

  return rows.map((r) => r.id);
}

export async function getUserByStripeCustomerIdDb(stripeCustomerId: string) {
  const users = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.stripeCustomerId, stripeCustomerId));

  if (users.length > 1) {
    throw new Error(
      `Data integrity violation: multiple users share stripe_customer_id "${stripeCustomerId}"`,
    );
  }

  return users[0] ?? null;
}

export async function updateUserPlanAndStripeIdsDb(
  userId: string,
  payload: UpdateUserPlanAndStripeIdsPayload,
) {
  await db
    .update(UserTable)
    .set(toUserPlanAndStripeIdsUpdate(payload))
    .where(eq(UserTable.id, userId));

  revalidateUserCache(userId);
}

/**
 * Applies a Stripe-derived plan update only while the row still references the
 * subscription that was read before the Stripe call.
 */
export async function updateUserPlanAndStripeIdsIfSubscriptionMatchesDb(
  userId: string,
  expectedStripeSubscriptionId: string | null,
  payload: UpdateUserPlanAndStripeIdsPayload,
) {
  const rows = await db
    .update(UserTable)
    .set(toUserPlanAndStripeIdsUpdate(payload))
    .where(
      and(
        eq(UserTable.id, userId),
        expectedStripeSubscriptionId === null
          ? isNull(UserTable.stripeSubscriptionId)
          : eq(UserTable.stripeSubscriptionId, expectedStripeSubscriptionId),
      ),
    )
    .returning({ id: UserTable.id });

  const updated = rows.length > 0;

  if (updated) {
    revalidateUserCache(userId);
  }

  return updated;
}
