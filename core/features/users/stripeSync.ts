import Stripe from "stripe";

import type { UserPlan } from "@/core/drizzle/schema/user";
import { getStripe } from "@/core/features/billing/stripe";

import { updateUserPlanAndStripeIdsIfSubscriptionMatchesDal } from "./dal";
import { getUserByIdDb, getUserByStripeCustomerIdDb } from "./db";

const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
const CUSTOMER_SUBSCRIPTION_LIST_LIMIT = 100;

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

function getLatestActiveSubscription(
  latest: Stripe.Subscription | null,
  subscription: Stripe.Subscription,
): Stripe.Subscription | null {
  if (!isActiveSubscriptionStatus(subscription.status)) {
    return latest;
  }

  if (!latest || subscription.created > latest.created) {
    return subscription;
  }

  return latest;
}

function getSubscriptionUpdatePayload(subscription: Stripe.Subscription): {
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
  const subscriptions = stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: CUSTOMER_SUBSCRIPTION_LIST_LIMIT,
  });
  let latestSubscription: Stripe.Subscription | null = null;

  for await (const subscription of subscriptions) {
    latestSubscription = getLatestActiveSubscription(
      latestSubscription,
      subscription,
    );
  }

  return latestSubscription;
}

async function getSubscriptionForSync(
  subscription: Stripe.Subscription,
  userStripeSubscriptionId: string | null,
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  //** a user has a subscriptionId, but it differs from the subscriptionId in the webhook event */
  //** find the latest active subscription for the user in Stripe and return it if possible */
  if (
    userStripeSubscriptionId !== null &&
    userStripeSubscriptionId !== subscription.id
  ) {
    const activeSubscription = await findActiveCustomerSubscription(
      stripe,
      subscription.customer as string,
    );

    if (activeSubscription?.id === subscription.id) {
      return activeSubscription;
    }

    console.warn("[stripeSync] Skipped stale subscription webhook", {
      userStripeSubscriptionId,
      eventStripeSubscriptionId: subscription.id,
      activeStripeSubscriptionId: activeSubscription?.id ?? null,
    });

    return null;
  }

  //** check if subscription from webhook event is active (active or trialing)? if so, return it */
  if (isActiveSubscriptionStatus(subscription.status)) {
    return subscription;
  }

  //** if subscription from webhook event is not active, find in Stripe the latest active subscription for the user */
  const activeSubscription = await findActiveCustomerSubscription(
    stripe,
    subscription.customer as string,
  );

  //** if the latest active subscription for the user is different from the subscription from the webhook event, return the latest active subscription */
  return activeSubscription && activeSubscription.id !== subscription.id
    ? activeSubscription
    : subscription;
}

/**
 * Updates plan and subscription ids in DB based on Stripe's subscription data for the given customer.
 *
 * @param stripe - Stripe client instance.
 * @param subscriptionId - Subscription id to retrieve corresponding subscription state.
 * @param customerId - Stripe customer id.
 * @throws Error when no user exists for `customerId`.
 * @returns User id when the database row was updated (for cache revalidation at the caller).
 */
export async function syncSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription,
): Promise<void> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  //** ensure the subscription belongs to a user in our database */
  const user = await getUserByStripeCustomerIdDb(
    stripeSubscription.customer as string,
  );

  if (user === null) {
    throw new Error(
      `syncSubscriptionFromStripe: no user for customer ${stripeSubscription.customer} - will retry`,
    );
  }

  const subscriptionForSync = await getSubscriptionForSync(
    stripeSubscription,
    user.stripeSubscriptionId,
  );

  if (!subscriptionForSync) {
    return;
  }

  const updatePayload = getSubscriptionUpdatePayload(subscriptionForSync);

  const updated = await updateUserPlanAndStripeIdsIfSubscriptionMatchesDal(
    user.id,
    user.stripeSubscriptionId,
    updatePayload,
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
    return;
  }
}

type ReconcileStripeSubscriptionResult =
  | { kind: "skipped"; reason: "no_subscription" | "customer_mismatch" }
  | { kind: "ok"; updated: boolean }
  | { kind: "error"; message: string };

/**
 * Periodic backstop when webhooks were missed: brings one user's row in line with Stripe.
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

  //** TODO: in CRON job we got a list of user ids with a subscription id, so why do we need to check if there is a user and a subscription id? */
  //** The only possible reason is we are afraid that between the moment when we got that list of user ids and now the user has no subscription id anymore */
  if (!user || !user.stripeSubscriptionId) {
    return { kind: "skipped", reason: "no_subscription" };
  }

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    //** TODO: apparently we can be certain that this will be a string */
    const stripeCustomerId = stripeSubscription.customer as string;

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

    const updatePayload = getSubscriptionUpdatePayload(subscriptionForSync);
    const isUpdated =
      user.plan !== updatePayload.plan ||
      user.stripeSubscriptionId !== updatePayload.stripeSubscriptionId;

    if (!isUpdated) {
      return { kind: "ok", updated: false };
    }

    const updated = await updateUserPlanAndStripeIdsIfSubscriptionMatchesDal(
      user.id,
      user.stripeSubscriptionId,
      updatePayload,
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
    if (
      err instanceof Stripe.errors.StripeInvalidRequestError &&
      err.code === "resource_missing"
    ) {
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
          const updatePayload =
            getSubscriptionUpdatePayload(activeSubscription);
          const updated =
            await updateUserPlanAndStripeIdsIfSubscriptionMatchesDal(
              userId,
              user.stripeSubscriptionId,
              updatePayload,
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

      const updated = await updateUserPlanAndStripeIdsIfSubscriptionMatchesDal(
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
