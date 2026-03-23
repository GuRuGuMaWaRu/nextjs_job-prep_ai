import Stripe from "stripe";

import type { UserPlan } from "@/core/drizzle/schema/user";

import {
  getUserByIdDb,
  getUserByStripeCustomerIdDb,
  updateUserPlanAndStripeIdsDb,
} from "./db";

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;

const TERMINAL_SUBSCRIPTION_STATUSES = [
  "canceled",
  "incomplete_expired",
] as const;

function isActiveSubscriptionStatus(
  status: string,
): status is (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number] {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(
    status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number],
  );
}

function isTerminalSubscriptionStatus(
  status: string,
): status is (typeof TERMINAL_SUBSCRIPTION_STATUSES)[number] {
  return TERMINAL_SUBSCRIPTION_STATUSES.includes(
    status as (typeof TERMINAL_SUBSCRIPTION_STATUSES)[number],
  );
}

function getSubscriptionState(subscription: Stripe.Subscription): {
  plan: UserPlan;
  stripeSubscriptionId: string | null;
} {
  const plan: UserPlan = isActiveSubscriptionStatus(subscription.status)
    ? "pro"
    : "free";
  const terminal = isTerminalSubscriptionStatus(subscription.status);

  return {
    plan,
    stripeSubscriptionId: terminal ? null : subscription.id,
  };
}

/**
 * Updates plan and subscription ids in DB based on Stripe’s subscription data for the given customer.
 *
 * @param stripe - Stripe client instance.
 * @param subscriptionId - Subscription id to retrieve corresponding subscription state.
 * @param customerId - Stripe customer id.
 * @throws Error when no user exists for `customerId`.
 */
export async function syncSubscriptionFromStripe(
  stripe: Stripe,
  subscriptionId: string,
  customerId: string,
): Promise<void> {
  const user = await getUserByStripeCustomerIdDb(customerId);
  if (!user) {
    throw new Error(
      `syncSubscriptionFromStripe: no user for customer ${customerId} — will retry`,
    );
  }

  const stripeSubscription =
    await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionState = getSubscriptionState(stripeSubscription);

  await updateUserPlanAndStripeIdsDb(user.id, subscriptionState);
}

function isStripeSubscriptionMissingError(err: unknown): boolean {
  return (
    err instanceof Stripe.errors.StripeInvalidRequestError &&
    err.code === "resource_missing"
  );
}

type ReconcileStripeSubscriptionResult =
  | { kind: "skipped"; reason: "no_subscription" | "customer_mismatch" }
  | { kind: "ok"; updated: boolean }
  | { kind: "error"; message: string };

/**
 * Periodic backstop when webhooks were missed: brings one user’s row in line with Stripe.
 *
 * @param stripe - Stripe client instance.
 * @param userId - User id.
 * @returns Discriminated result: `skipped` (nothing to do or guard), `ok` with whether
 *   the DB changed, or `error` for inconsistent subscription data (e.g. no customer).
 */
export async function reconcileUserStripeSubscription(
  stripe: Stripe,
  userId: string,
): Promise<ReconcileStripeSubscriptionResult> {
  const user = await getUserByIdDb(userId);
  if (!user?.stripeSubscriptionId) {
    return { kind: "skipped", reason: "no_subscription" };
  }

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    const stripeCustomerId =
      typeof stripeSubscription.customer === "string"
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id;

    if (!stripeCustomerId) {
      return { kind: "error", message: "subscription_missing_customer" };
    }

    if (
      user.stripeCustomerId !== null &&
      user.stripeCustomerId !== stripeCustomerId
    ) {
      return { kind: "skipped", reason: "customer_mismatch" };
    }

    const subscriptionState = getSubscriptionState(stripeSubscription);
    const isUpdated =
      user.plan !== subscriptionState.plan ||
      user.stripeSubscriptionId !== subscriptionState.stripeSubscriptionId;

    if (isUpdated) {
      await updateUserPlanAndStripeIdsDb(user.id, subscriptionState);
    }

    return { kind: "ok", updated: isUpdated };
  } catch (err) {
    if (isStripeSubscriptionMissingError(err)) {
      const freshUser = await getUserByIdDb(userId);
      if (freshUser?.stripeSubscriptionId !== user.stripeSubscriptionId) {
        return { kind: "ok", updated: false };
      }

      await updateUserPlanAndStripeIdsDb(userId, {
        plan: "free",
        stripeSubscriptionId: null,
      });

      return { kind: "ok", updated: true };
    }

    throw err;
  }
}
