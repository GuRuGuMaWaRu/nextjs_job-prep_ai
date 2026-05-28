import type Stripe from "stripe";

import { createTestServerEnv, type TestServerEnv } from "@core/test-utils/env";
import {
  createMockStripe,
  type MockStripeClient,
} from "@core/test-utils/mocks/stripe";
import {
  makeCheckoutSessionCompletedEvent,
  makeCheckoutSessionAsyncPaymentSucceededEvent,
  makeCheckoutSessionAsyncPaymentFailedEvent,
  makeSubscriptionDeletedEvent,
  makeSubscriptionUpdatedEvent,
  makeUnhandledStripeWebhookEvent,
  makeStripeCheckoutSession,
  makeStripeSubscription,
  makeStripeEvent,
} from "@core/test-utils/factories";

let mockEnv: TestServerEnv = createTestServerEnv();

jest.mock("@/core/data/env/server", () => ({
  get env() {
    return mockEnv;
  },
}));

const mockStripe: MockStripeClient = createMockStripe();

jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
}));

jest.mock("@/core/features/billing/webhookHelpers", () => ({
  claimEvent: jest.fn(),
  unclaimEvent: jest.fn(),
  fulfillCheckoutSession: jest.fn(),
  markStripeEventProcessed: jest.fn(),
  markStripeEventRemediationRequired: jest.fn(),
}));

jest.mock("@/core/features/users/stripeSync", () => ({
  syncSubscriptionFromStripe: jest.fn(),
}));

import { getStripe } from "@/core/features/billing/stripe";
import { STRIPE_WEBHOOK_EVENT_TYPES } from "@/core/features/billing/stripeEventTypes";
import {
  claimEvent,
  fulfillCheckoutSession,
  markStripeEventProcessed,
  markStripeEventRemediationRequired,
  unclaimEvent,
} from "@/core/features/billing/webhookHelpers";
import { syncSubscriptionFromStripe } from "@/core/features/users/stripeSync";

import { POST } from "./route";

const mockGetStripe = getStripe as jest.MockedFunction<typeof getStripe>;
const mockClaimEvent = claimEvent as jest.MockedFunction<typeof claimEvent>;
const mockUnclaimEvent = unclaimEvent as jest.MockedFunction<
  typeof unclaimEvent
>;
const mockFulfill = fulfillCheckoutSession as jest.MockedFunction<
  typeof fulfillCheckoutSession
>;
const mockMarkProcessed = markStripeEventProcessed as jest.MockedFunction<
  typeof markStripeEventProcessed
>;
const mockMarkRemediation =
  markStripeEventRemediationRequired as jest.MockedFunction<
    typeof markStripeEventRemediationRequired
  >;
const mockSyncSubscription = syncSubscriptionFromStripe as jest.MockedFunction<
  typeof syncSubscriptionFromStripe
>;

const VALID_SIGNATURE_HEADER = "t=1,v1=test-signature";

function buildWebhookRequest(
  body: string | undefined,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost:3000/api/stripe/webhooks", {
    method: "POST",
    headers: new Headers(headers),
    body,
  });
}

function primeHappyPath(event: Stripe.Event): void {
  mockStripe.webhooks.constructEvent.mockReturnValueOnce(event);
  mockClaimEvent.mockResolvedValueOnce("claimed");
}

let consoleErrorSpy: jest.SpyInstance;
let consoleWarnSpy: jest.SpyInstance;

beforeEach(() => {
  mockEnv = createTestServerEnv();

  mockStripe.webhooks.constructEvent.mockReset();
  mockStripe.subscriptions.retrieve.mockReset();

  mockGetStripe.mockReset();
  mockGetStripe.mockReturnValue(mockStripe as unknown as Stripe);

  mockClaimEvent.mockReset();
  mockUnclaimEvent.mockReset().mockResolvedValue(undefined);
  mockFulfill.mockReset().mockResolvedValue(true);
  mockMarkProcessed.mockReset().mockResolvedValue(undefined);
  mockMarkRemediation.mockReset().mockResolvedValue(undefined);
  mockSyncSubscription.mockReset().mockResolvedValue(undefined);

  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
});

describe("POST /api/stripe/webhooks — preconditions", () => {
  it("returns 501 when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    mockEnv = createTestServerEnv({ STRIPE_WEBHOOK_SECRET: undefined });

    const response = await POST(buildWebhookRequest("{}"));

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      error: "Webhook secret not configured",
    });
    expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled();
    expect(mockClaimEvent).not.toHaveBeenCalled();
  });

  it("returns 501 when Stripe client is not available", async () => {
    mockGetStripe.mockReturnValue(null);

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      error: "Stripe not configured",
    });
    expect(mockClaimEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when the stripe-signature header is missing", async () => {
    const response = await POST(buildWebhookRequest("{}"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing stripe-signature",
    });
    expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled();
    expect(mockClaimEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when reading the request body fails", async () => {
    const failingRequest = {
      headers: new Headers({ "stripe-signature": VALID_SIGNATURE_HEADER }),
      text: () => Promise.reject(new Error("read failed")),
    } as unknown as Request;

    const response = await POST(failingRequest);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to read body",
    });
    expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled();
    expect(mockClaimEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when signature verification throws", async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    const response = await POST(
      buildWebhookRequest("raw-body", {
        "stripe-signature": "bogus",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid signature",
    });
    expect(mockClaimEvent).not.toHaveBeenCalled();
    expect(mockFulfill).not.toHaveBeenCalled();
  });
});

describe("POST /api/stripe/webhooks — idempotency", () => {
  it("short-circuits with 200 when the event was already processed", async () => {
    const event = makeCheckoutSessionCompletedEvent();
    mockStripe.webhooks.constructEvent.mockReturnValueOnce(event);
    mockClaimEvent.mockResolvedValueOnce("duplicate_processed");

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(200);
    expect(mockFulfill).not.toHaveBeenCalled();
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });

  it("returns 503 while a concurrent delivery is still processing", async () => {
    const event = makeCheckoutSessionCompletedEvent();
    mockStripe.webhooks.constructEvent.mockReturnValueOnce(event);
    mockClaimEvent.mockResolvedValueOnce("duplicate_in_progress");

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(503);
    expect(mockFulfill).not.toHaveBeenCalled();
  });

  it("returns 500 so Stripe keeps retrying when remediation is required", async () => {
    const event = makeCheckoutSessionCompletedEvent();
    mockStripe.webhooks.constructEvent.mockReturnValueOnce(event);
    mockClaimEvent.mockResolvedValueOnce("duplicate_remediation");

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error:
        "Stripe webhook event stuck after failed unclaim; remediation required",
    });
    expect(mockFulfill).not.toHaveBeenCalled();
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });
});

describe("POST /api/stripe/webhooks — event handlers", () => {
  it("fulfills the checkout on checkout.session.completed and marks the event processed", async () => {
    const session = makeStripeCheckoutSession({
      userId: "user-42",
      customerId: "cus_test_42",
      subscriptionId: "sub_test_42",
    });
    const event = makeStripeEvent({
      type: STRIPE_WEBHOOK_EVENT_TYPES.checkoutSessionCompleted,
      object: session,
    });
    primeHappyPath(event);

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(200);
    expect(mockFulfill).toHaveBeenCalledTimes(1);
    expect(mockFulfill).toHaveBeenCalledWith(session);
    expect(mockMarkProcessed).toHaveBeenCalledWith(event.id);
    expect(mockUnclaimEvent).not.toHaveBeenCalled();
  });

  it("also fulfills the checkout on checkout.session.async_payment_succeeded", async () => {
    const event = makeCheckoutSessionAsyncPaymentSucceededEvent({
      userId: "user-async",
    });
    primeHappyPath(event);

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(200);
    expect(mockFulfill).toHaveBeenCalledTimes(1);
    expect(mockFulfill).toHaveBeenCalledWith(event.data.object);
    expect(mockMarkProcessed).toHaveBeenCalledWith(event.id);
  });

  it("does not fulfill on checkout.session.async_payment_failed but still marks processed", async () => {
    const event = makeCheckoutSessionAsyncPaymentFailedEvent();
    primeHappyPath(event);

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(200);
    expect(mockFulfill).not.toHaveBeenCalled();
    expect(mockMarkProcessed).toHaveBeenCalledWith(event.id);
  });

  it("syncs the subscription on customer.subscription.updated with the resolved customer id", async () => {
    const subscription = makeStripeSubscription({
      id: "sub_test_updated",
      customer: "cus_test_updated",
      status: "active",
    });
    const event = makeStripeEvent({
      type: STRIPE_WEBHOOK_EVENT_TYPES.subscriptionUpdated,
      object: subscription,
    });
    primeHappyPath(event);

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(200);
    expect(mockSyncSubscription).toHaveBeenCalledTimes(1);
    expect(mockSyncSubscription).toHaveBeenCalledWith(
      mockStripe,
      "sub_test_updated",
      "cus_test_updated",
    );
    expect(mockMarkProcessed).toHaveBeenCalledWith(event.id);
  });

  it("resolves the customer id when subscription.customer is an expanded object", async () => {
    const subscription = {
      id: "sub_test_expanded",
      object: "subscription",
      customer: { id: "cus_test_expanded", object: "customer" },
      status: "active",
    } as unknown as Stripe.Subscription;
    const event = makeStripeEvent({
      type: STRIPE_WEBHOOK_EVENT_TYPES.subscriptionUpdated,
      object: subscription,
    });
    primeHappyPath(event);

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(200);
    expect(mockSyncSubscription).toHaveBeenCalledWith(
      mockStripe,
      "sub_test_expanded",
      "cus_test_expanded",
    );
  });

  it("skips syncing when a subscription event has no resolvable customer id", async () => {
    const subscription = {
      id: "sub_test_no_customer",
      object: "subscription",
      customer: null,
      status: "active",
    } as unknown as Stripe.Subscription;
    const event = makeStripeEvent({
      type: STRIPE_WEBHOOK_EVENT_TYPES.subscriptionUpdated,
      object: subscription,
    });
    primeHappyPath(event);

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(200);
    expect(mockSyncSubscription).not.toHaveBeenCalled();
    expect(mockMarkProcessed).toHaveBeenCalledWith(event.id);
  });

  it("syncs the subscription on customer.subscription.deleted", async () => {
    const event = makeSubscriptionDeletedEvent({
      id: "sub_test_del",
      customer: "cus_test_del",
    });
    primeHappyPath(event);

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(200);
    expect(mockSyncSubscription).toHaveBeenCalledWith(
      mockStripe,
      "sub_test_del",
      "cus_test_del",
    );
  });

  it("resolves an expanded customer object on customer.subscription.deleted", async () => {
    const subscription = {
      id: "sub_test_deleted_expanded",
      object: "subscription",
      customer: { id: "cus_test_deleted_expanded", object: "customer" },
      status: "canceled",
    } as unknown as Stripe.Subscription;
    const event = makeStripeEvent({
      type: STRIPE_WEBHOOK_EVENT_TYPES.subscriptionDeleted,
      object: subscription,
    });
    primeHappyPath(event);

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(200);
    expect(mockSyncSubscription).toHaveBeenCalledWith(
      mockStripe,
      "sub_test_deleted_expanded",
      "cus_test_deleted_expanded",
    );
    expect(mockMarkProcessed).toHaveBeenCalledWith(event.id);
  });

  it("skips syncing when a deleted subscription has no resolvable customer id", async () => {
    const subscription = {
      id: "sub_test_deleted_no_customer",
      object: "subscription",
      customer: null,
      status: "canceled",
    } as unknown as Stripe.Subscription;
    const event = makeStripeEvent({
      type: STRIPE_WEBHOOK_EVENT_TYPES.subscriptionDeleted,
      object: subscription,
    });
    primeHappyPath(event);

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(200);
    expect(mockSyncSubscription).not.toHaveBeenCalled();
    expect(mockMarkProcessed).toHaveBeenCalledWith(event.id);
  });

  it("no-ops on an unhandled event type and still marks the event processed", async () => {
    const event = makeUnhandledStripeWebhookEvent();
    primeHappyPath(event);

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(200);
    expect(mockFulfill).not.toHaveBeenCalled();
    expect(mockSyncSubscription).not.toHaveBeenCalled();
    expect(mockMarkProcessed).toHaveBeenCalledWith(event.id);
  });
});

describe("POST /api/stripe/webhooks — handler failure recovery", () => {
  it("unclaims the event and returns 500 without marking processed when the handler throws", async () => {
    const event = makeSubscriptionUpdatedEvent();
    primeHappyPath(event);
    mockSyncSubscription.mockRejectedValueOnce(new Error("db unavailable"));

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Webhook handler failed",
    });
    expect(mockUnclaimEvent).toHaveBeenCalledWith(event.id);
    expect(mockMarkProcessed).not.toHaveBeenCalled();
    expect(mockMarkRemediation).not.toHaveBeenCalled();
  });

  it("flags the row for remediation when both the handler and unclaim fail", async () => {
    const event = makeCheckoutSessionCompletedEvent();
    primeHappyPath(event);
    mockFulfill.mockRejectedValueOnce(new Error("handler boom"));
    mockUnclaimEvent.mockRejectedValueOnce(new Error("unclaim boom"));

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(500);
    expect(mockUnclaimEvent).toHaveBeenCalledWith(event.id);
    expect(mockMarkRemediation).toHaveBeenCalledWith(event.id, "unclaim boom");
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });

  it("stringifies non-Error unclaim failures before flagging remediation", async () => {
    const event = makeCheckoutSessionCompletedEvent();
    primeHappyPath(event);
    mockFulfill.mockRejectedValueOnce(new Error("handler boom"));
    mockUnclaimEvent.mockRejectedValueOnce("plain unclaim failure");

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(500);
    expect(mockMarkRemediation).toHaveBeenCalledWith(
      event.id,
      "plain unclaim failure",
    );
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });

  it("still returns 500 when even the remediation write fails", async () => {
    const event = makeCheckoutSessionCompletedEvent();
    primeHappyPath(event);
    mockFulfill.mockRejectedValueOnce(new Error("handler boom"));
    mockUnclaimEvent.mockRejectedValueOnce(new Error("unclaim boom"));
    mockMarkRemediation.mockRejectedValueOnce(new Error("flag boom"));

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(500);
    expect(mockMarkRemediation).toHaveBeenCalledWith(event.id, "unclaim boom");
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });

  it("stringifies non-Error remediation write failures for safe alert metadata", async () => {
    const event = makeCheckoutSessionCompletedEvent();
    primeHappyPath(event);
    mockFulfill.mockRejectedValueOnce(new Error("handler boom"));
    mockUnclaimEvent.mockRejectedValueOnce(new Error("unclaim boom"));
    mockMarkRemediation.mockRejectedValueOnce("plain flag failure");

    const response = await POST(
      buildWebhookRequest("{}", { "stripe-signature": VALID_SIGNATURE_HEADER }),
    );

    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[ALERT][stripe:webhook] failed to persist remediation flag for stuck event",
      {
        eventType: event.type,
        markError: "plain flag failure",
        unclaimError: "unclaim boom",
      },
    );
    expect(mockMarkProcessed).not.toHaveBeenCalled();
  });
});
