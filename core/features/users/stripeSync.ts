import Stripe from "stripe";

import type { UserPlan } from "@/core/drizzle/schema/user";

import {
  getUserByIdDb,
  getUserByStripeCustomerIdDb,
  updateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
} from "./db";

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
const CUSTOMER_SUBSCRIPTION_LIST_LIMIT = 100;

const TERMINAL_SUBSCRIPTION_STATUSES = [
  "canceled",
  "incomplete_expired",
] as const;

function getLatestSubscription(
  subscriptions: Stripe.Subscription[],
): Stripe.Subscription | null {
  return subscriptions.reduce<Stripe.Subscription | null>(
    (latest, subscription) => {
      if (!isActiveSubscriptionStatus(subscription.status)) {
        return latest;
      }

      if (!latest || subscription.created > latest.created) {
        return subscription;
      }

      return latest;
    },
    null,
  );
}

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

async function findActiveCustomerSubscription(
  stripe: Stripe,
  customerId: string,
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: CUSTOMER_SUBSCRIPTION_LIST_LIMIT,
  });

  return getLatestSubscription(subscriptions.data);
}

async function getSubscriptionForSync(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  customerId: string,
  currentStripeSubscriptionId: string | null,
): Promise<Stripe.Subscription | null> {
  if (
    currentStripeSubscriptionId !== null &&
    currentStripeSubscriptionId !== subscription.id
  ) {
    const activeSubscription = await findActiveCustomerSubscription(
      stripe,
      customerId,
    );

    if (activeSubscription?.id === subscription.id) {
      return activeSubscription;
    }

    console.warn("[stripeSync] Skipped stale subscription webhook", {
      currentStripeSubscriptionId,
      eventStripeSubscriptionId: subscription.id,
      activeStripeSubscriptionId: activeSubscription?.id ?? null,
    });

    return null;
  }

  if (isActiveSubscriptionStatus(subscription.status)) {
    return subscription;
  }

  const activeSubscription = await findActiveCustomerSubscription(
    stripe,
    customerId,
  );

  return activeSubscription && activeSubscription.id !== subscription.id
    ? activeSubscription
    : subscription;
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
  const subscriptionForSync = await getSubscriptionForSync(
    stripe,
    stripeSubscription,
    customerId,
    user.stripeSubscriptionId,
  );

  if (!subscriptionForSync) {
    return;
  }

  const subscriptionState = getSubscriptionState(subscriptionForSync);

  const updated = await updateUserPlanAndStripeIdsIfSubscriptionMatchesDb(
    user.id,
    user.stripeSubscriptionId,
    subscriptionState,
  );

  if (!updated) {
    console.warn(
      "[stripeSync] Skipped subscription sync: row changed concurrently",
      {
        userId: user.id,
        priorStripeSubscriptionId: user.stripeSubscriptionId,
        eventStripeSubscriptionId: subscriptionForSync.id,
      },
    );
  }
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

    const subscriptionForSync =
      !isActiveSubscriptionStatus(stripeSubscription.status) && stripeCustomerId
        ? ((await findActiveCustomerSubscription(stripe, stripeCustomerId)) ??
          stripeSubscription)
        : stripeSubscription;

    const subscriptionState = getSubscriptionState(subscriptionForSync);
    const isUpdated =
      user.plan !== subscriptionState.plan ||
      user.stripeSubscriptionId !== subscriptionState.stripeSubscriptionId;

    if (!isUpdated) {
      return { kind: "ok", updated: false };
    }

    const updated = await updateUserPlanAndStripeIdsIfSubscriptionMatchesDb(
      user.id,
      user.stripeSubscriptionId,
      subscriptionState,
    );

    if (!updated) {
      console.warn(
        "[stripeSync] Skipped reconciliation update: row changed concurrently",
        {
          userId: user.id,
          priorStripeSubscriptionId: user.stripeSubscriptionId,
          stripeSubscriptionId: stripeSubscription.id,
        },
      );
    }

    return { kind: "ok", updated };
  } catch (err) {
    if (isStripeSubscriptionMissingError(err)) {
      console.error(
        "[stripeSync] Stripe subscription not found (resource_missing)",
        {
          userId,
          stripeSubscriptionId: user.stripeSubscriptionId,
        },
      );

      const freshUser = await getUserByIdDb(userId);
      if (freshUser?.stripeSubscriptionId !== user.stripeSubscriptionId) {
        console.warn(
          "[stripeSync] Skipped downgrade after missing subscription: row changed concurrently",
          {
            userId,
            priorStripeSubscriptionId: user.stripeSubscriptionId,
            currentStripeSubscriptionId:
              freshUser?.stripeSubscriptionId ?? null,
          },
        );
        return { kind: "ok", updated: false };
      }

      if (freshUser?.stripeCustomerId) {
        const activeSubscription = await findActiveCustomerSubscription(
          stripe,
          freshUser.stripeCustomerId,
        );

        if (activeSubscription) {
          const subscriptionState = getSubscriptionState(activeSubscription);
          const updated =
            await updateUserPlanAndStripeIdsIfSubscriptionMatchesDb(
              userId,
              user.stripeSubscriptionId,
              subscriptionState,
            );

          if (!updated) {
            console.warn(
              "[stripeSync] Skipped active subscription repair: row changed concurrently",
              {
                userId,
                priorStripeSubscriptionId: user.stripeSubscriptionId,
                activeStripeSubscriptionId: activeSubscription.id,
              },
            );
          }

          return { kind: "ok", updated };
        }
      }

      console.error(
        "[stripeSync] Downgrading user: subscription removed in Stripe",
        {
          userId,
          priorStripeSubscriptionId: user.stripeSubscriptionId,
        },
      );

      const updated = await updateUserPlanAndStripeIdsIfSubscriptionMatchesDb(
        userId,
        user.stripeSubscriptionId,
        {
          plan: "free",
          stripeSubscriptionId: null,
        },
      );

      if (!updated) {
        console.warn(
          "[stripeSync] Skipped downgrade after missing subscription: row changed concurrently",
          {
            userId,
            priorStripeSubscriptionId: user.stripeSubscriptionId,
          },
        );
      }

      return { kind: "ok", updated };
    }

    console.error("[stripeSync] reconcileUserStripeSubscription failed", {
      userId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
