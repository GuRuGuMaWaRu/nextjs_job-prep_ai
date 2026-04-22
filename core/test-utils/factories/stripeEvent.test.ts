import type Stripe from "stripe";

import {
  makeCheckoutSessionAsyncPaymentFailedEvent,
  makeCheckoutSessionAsyncPaymentSucceededEvent,
  makeCheckoutSessionCompletedEvent,
  makeStripeCheckoutSession,
  makeStripeEvent,
  makeStripeSubscription,
  makeSubscriptionDeletedEvent,
  makeSubscriptionUpdatedEvent,
  makeUnhandledStripeWebhookEvent,
} from "./stripeEvent";

describe("makeStripeSubscription", () => {
  it("returns a subscription with placeholder defaults", () => {
    const subscription = makeStripeSubscription();

    expect(subscription.id).toMatch(/^sub_test_/);
    expect(typeof subscription.customer).toBe("string");
    expect(subscription.customer).toMatch(/^cus_test_/);
    expect(subscription.status).toBe("active");
  });

  it("yields a unique id per call", () => {
    const a = makeStripeSubscription();
    const b = makeStripeSubscription();

    expect(a.id).not.toBe(b.id);
  });

  it("shallow-merges overrides", () => {
    const subscription = makeStripeSubscription({
      id: "sub_test_custom",
      status: "past_due",
    });

    expect(subscription.id).toBe("sub_test_custom");
    expect(subscription.status).toBe("past_due");
  });
});

describe("makeStripeCheckoutSession", () => {
  it("sets metadata.userId, customer, and subscription with defaults", () => {
    const session = makeStripeCheckoutSession();

    expect(session.payment_status).toBe("paid");
    expect(session.metadata?.userId).toMatch(/^user-/);
    expect(typeof session.customer).toBe("string");
    expect(typeof session.subscription).toBe("string");
  });

  it("omits metadata.userId when userId is explicitly null", () => {
    const session = makeStripeCheckoutSession({ userId: null });

    expect(session.metadata?.userId).toBeUndefined();
  });

  it("allows clearing customer and subscription via null overrides", () => {
    const session = makeStripeCheckoutSession({
      customerId: null,
      subscriptionId: null,
    });

    expect(session.customer).toBeNull();
    expect(session.subscription).toBeNull();
  });

  it("propagates paymentStatus overrides", () => {
    const session = makeStripeCheckoutSession({ paymentStatus: "unpaid" });

    expect(session.payment_status).toBe("unpaid");
  });
});

describe("makeStripeEvent", () => {
  it("wraps the given object inside data.object with the given type", () => {
    const object = { id: "arbitrary" };

    const event = makeStripeEvent({ type: "custom.event.type", object });

    expect(event.type).toBe("custom.event.type");
    expect(event.data.object).toBe(object);
    expect(event.id).toMatch(/^evt_test_/);
    expect(event.livemode).toBe(false);
  });

  it("respects an explicit event id override", () => {
    const event = makeStripeEvent({
      id: "evt_test_pinned",
      type: "custom.x",
      object: {},
    });

    expect(event.id).toBe("evt_test_pinned");
  });
});

describe("named Stripe event builders", () => {
  it("makeCheckoutSessionCompletedEvent has the correct type and nested session", () => {
    const event = makeCheckoutSessionCompletedEvent({ userId: "user-c1" });

    expect(event.type).toBe("checkout.session.completed");
    const session = event.data.object as Stripe.Checkout.Session;
    expect(session.metadata?.userId).toBe("user-c1");
    expect(session.payment_status).toBe("paid");
  });

  it("makeCheckoutSessionAsyncPaymentSucceededEvent builds the success variant", () => {
    const event = makeCheckoutSessionAsyncPaymentSucceededEvent();

    expect(event.type).toBe("checkout.session.async_payment_succeeded");
    const session = event.data.object as Stripe.Checkout.Session;
    expect(session.payment_status).toBe("paid");
  });

  it("makeCheckoutSessionAsyncPaymentFailedEvent defaults paymentStatus to unpaid", () => {
    const event = makeCheckoutSessionAsyncPaymentFailedEvent();

    expect(event.type).toBe("checkout.session.async_payment_failed");
    const session = event.data.object as Stripe.Checkout.Session;
    expect(session.payment_status).toBe("unpaid");
  });

  it("makeSubscriptionUpdatedEvent wraps an active subscription", () => {
    const event = makeSubscriptionUpdatedEvent();

    expect(event.type).toBe("customer.subscription.updated");
    const subscription = event.data.object as Stripe.Subscription;
    expect(subscription.status).toBe("active");
  });

  it("makeSubscriptionDeletedEvent defaults the subscription status to canceled", () => {
    const event = makeSubscriptionDeletedEvent();

    expect(event.type).toBe("customer.subscription.deleted");
    const subscription = event.data.object as Stripe.Subscription;
    expect(subscription.status).toBe("canceled");
  });

  it("makeUnhandledStripeWebhookEvent uses a real type the webhook route does not handle", () => {
    const event = makeUnhandledStripeWebhookEvent();

    expect(event.type).toBe("invoice.voided");
  });
});
