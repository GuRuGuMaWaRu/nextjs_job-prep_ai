import { DatabaseError } from "@/core/dal/errors";
import { UserTable } from "@/core/drizzle/schema";
import type { UserPlan } from "@/core/drizzle/schema/user";
import {
  deleteUserDb,
  updateUserPlanAndStripeIdsDb,
  updateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
  upsertUserDb,
} from "@/core/features/users/db";
import { revalidateUserCache } from "@/core/features/users/dbCache";

type UpdateUserPlanAndStripeIdsPayload = {
  plan: UserPlan;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

/**
 * DAL Layer for Users
 * Handles: Data access, caching, error translation
 * Throws: DatabaseError (only for actual database errors)
 */

export async function upsertUserDal(user: typeof UserTable.$inferInsert) {
  try {
    await upsertUserDb(user);
  } catch (error) {
    console.error("Database error upserting user:", error);
    throw new DatabaseError("Failed to upsert user in database", error);
  }

  revalidateUserCache(user.id);
}

export async function deleteUserDal(id: string) {
  try {
    await deleteUserDb(id);
  } catch (error) {
    console.error("Database error deleting user:", error);
    throw new DatabaseError("Failed to delete user from database", error);
  }

  revalidateUserCache(id);
}

export async function updateUserPlanAndStripeIdsDal(
  userId: string,
  payload: UpdateUserPlanAndStripeIdsPayload,
) {
  try {
    await updateUserPlanAndStripeIdsDb(userId, payload);
  } catch (error) {
    console.error("Database error updating user plan:", error);
    throw new DatabaseError("Failed to update user plan in database", error);
  }

  revalidateUserCache(userId);
}

export async function updateUserPlanAndStripeIdsIfSubscriptionMatchesDal(
  userId: string,
  expectedStripeSubscriptionId: string | null,
  payload: UpdateUserPlanAndStripeIdsPayload,
) {
  let updated: boolean;

  try {
    updated = await updateUserPlanAndStripeIdsIfSubscriptionMatchesDb(
      userId,
      expectedStripeSubscriptionId,
      payload,
    );
  } catch (error) {
    console.error("Database error updating user plan:", error);
    throw new DatabaseError("Failed to update user plan in database", error);
  }

  if (updated) {
    revalidateUserCache(userId);
  }

  return updated;
}
