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
    revalidateUserCache(user.id);
  } catch (error) {
    console.error("Database error upserting user:", error);
    throw new DatabaseError("Failed to upsert user in database", error);
  }
}

export async function deleteUserDal(id: string) {
  try {
    await deleteUserDb(id);
    revalidateUserCache(id);
  } catch (error) {
    console.error("Database error deleting user:", error);
    throw new DatabaseError("Failed to delete user from database", error);
  }
}

export async function updateUserPlanAndStripeIdsDal(
  userId: string,
  payload: UpdateUserPlanAndStripeIdsPayload,
) {
  try {
    await updateUserPlanAndStripeIdsDb(userId, payload);
    revalidateUserCache(userId);
  } catch (error) {
    console.error("Database error updating user plan:", error);
    throw new DatabaseError("Failed to update user plan in database", error);
  }
}

export async function updateUserPlanAndStripeIdsIfSubscriptionMatchesDal(
  userId: string,
  expectedStripeSubscriptionId: string | null,
  payload: UpdateUserPlanAndStripeIdsPayload,
) {
  try {
    const updated = await updateUserPlanAndStripeIdsIfSubscriptionMatchesDb(
      userId,
      expectedStripeSubscriptionId,
      payload,
    );

    if (updated) {
      revalidateUserCache(userId);
    }

    return updated;
  } catch (error) {
    console.error("Database error updating user plan:", error);
    throw new DatabaseError("Failed to update user plan in database", error);
  }
}
