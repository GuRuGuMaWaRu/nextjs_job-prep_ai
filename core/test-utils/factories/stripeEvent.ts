/**
 * Fixture builders for Stripe webhook events and their payload objects.
 *
 * These return `Stripe.Event` / `Stripe.Subscription` / `Stripe.Checkout.Session`
 * shapes that are close enough to the real API for route tests. Only fields the
 * webhook route and its collaborators actually read are guaranteed — the rest
 * are minimal placeholders cast to satisfy TypeScript.
 *
 * Never put real customer emails or payment identifiers in tests. Defaults use
 * `cus_test_*`, `sub_test_*`, `cs_test_*`, and `evt_test_*` placeholders.
 */

import type Stripe from "stripe";

let eventCounter = 0;
let sessionCounter = 0;
let subscriptionCounter = 0;

function nextEventIndex(): number {
  eventCounter += 1;
  return eventCounter;
}

function nextSessionIndex(): number {
  sessionCounter += 1;
  return sessionCounter;
}

function nextSubscriptionIndex(): number {
  subscriptionCounter += 1;
  return subscriptionCounter;
}

export type MakeStripeSubscriptionOverrides = Partial<
  Pick<Stripe.Subscription, "id" | "customer" | "status">
> & {
  cancelAtPeriodEnd?: boolean;
};

/**
 * Builds a minimal `Stripe.Subscription` fixture. Only the fields the app's
 * sync logic reads (`id`, `customer`, `status`) are meaningful.
 */
export function makeStripeSubscription(
  overrides: MakeStripeSubscriptionOverrides = {},
): Stripe.Subscription {
  const index = nextSubscriptionIndex();

  const subscription = {
    id: overrides.id ?? `sub_test_${index}`,
    object: "subscription" as const,
    customer: overrides.customer ?? `cus_test_${index}`,
    status: overrides.status ?? "active",
    cancel_at_period_end: overrides.cancelAtPeriodEnd ?? false,
  };

  return subscription as unknown as Stripe.Subscription;
}

export type MakeStripeCheckoutSessionOverrides = {
  id?: string;
  userId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  paymentStatus?: Stripe.Checkout.Session.PaymentStatus;
};

/**
 * Builds a minimal `Stripe.Checkout.Session` fixture with the fields
 * `fulfillCheckoutSession` reads: `metadata.userId`, `customer`,
 * `subscription`, and `payment_status`.
 */
export function makeStripeCheckoutSession(
  overrides: MakeStripeCheckoutSessionOverrides = {},
): Stripe.Checkout.Session {
  const index = nextSessionIndex();
  const userId =
    overrides.userId === undefined ? `user-${index}` : overrides.userId;

  const session = {
    id: overrides.id ?? `cs_test_${index}`,
    object: "checkout.session" as const,
    payment_status: overrides.paymentStatus ?? "paid",
    metadata: userId === null ? {} : { userId },
    customer:
      overrides.customerId === undefined
        ? `cus_test_${index}`
        : overrides.customerId,
    subscription:
      overrides.subscriptionId === undefined
        ? `sub_test_${index}`
        : overrides.subscriptionId,
  };

  return session as unknown as Stripe.Checkout.Session;
}

export type MakeStripeEventOverrides<TObject> = {
  id?: string;
  type: Stripe.Event.Type | (string & {});
  object: TObject;
};

/**
 * Generic `Stripe.Event` builder. Prefer the named builders below
 * (`makeCheckoutSessionCompletedEvent` etc.) unless you need a custom type.
 */
export function makeStripeEvent<TObject>(
  overrides: MakeStripeEventOverrides<TObject>,
): Stripe.Event {
  const index = nextEventIndex();

  const event = {
    id: overrides.id ?? `evt_test_${index}`,
    object: "event" as const,
    type: overrides.type,
    api_version: "2024-06-20",
    created: Math.floor(Date.parse("2024-01-01T00:00:00Z") / 1000),
    data: { object: overrides.object },
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
  };

  return event as unknown as Stripe.Event;
}

export function makeCheckoutSessionCompletedEvent(
  sessionOverrides: MakeStripeCheckoutSessionOverrides = {},
  eventId?: string,
): Stripe.Event {
  return makeStripeEvent({
    id: eventId,
    type: "checkout.session.completed",
    object: makeStripeCheckoutSession(sessionOverrides),
  });
}

export function makeCheckoutSessionAsyncPaymentSucceededEvent(
  sessionOverrides: MakeStripeCheckoutSessionOverrides = {},
  eventId?: string,
): Stripe.Event {
  return makeStripeEvent({
    id: eventId,
    type: "checkout.session.async_payment_succeeded",
    object: makeStripeCheckoutSession(sessionOverrides),
  });
}

export function makeCheckoutSessionAsyncPaymentFailedEvent(
  sessionOverrides: MakeStripeCheckoutSessionOverrides = {},
  eventId?: string,
): Stripe.Event {
  return makeStripeEvent({
    id: eventId,
    type: "checkout.session.async_payment_failed",
    object: makeStripeCheckoutSession({
      paymentStatus: "unpaid",
      ...sessionOverrides,
    }),
  });
}

export function makeSubscriptionUpdatedEvent(
  subscriptionOverrides: MakeStripeSubscriptionOverrides = {},
  eventId?: string,
): Stripe.Event {
  return makeStripeEvent({
    id: eventId,
    type: "customer.subscription.updated",
    object: makeStripeSubscription(subscriptionOverrides),
  });
}

export function makeSubscriptionDeletedEvent(
  subscriptionOverrides: MakeStripeSubscriptionOverrides = {},
  eventId?: string,
): Stripe.Event {
  return makeStripeEvent({
    id: eventId,
    type: "customer.subscription.deleted",
    object: makeStripeSubscription({
      status: "canceled",
      ...subscriptionOverrides,
    }),
  });
}

/**
 * Builds an event whose `type` the webhook route does not recognize, so the
 * default branch (no-op, 200) can be asserted.
 */
export function makeUnknownStripeEvent(eventId?: string): Stripe.Event {
  return makeStripeEvent({
    id: eventId,
    type: "invoice.voided" as Stripe.Event.Type,
    object: {},
  });
}
