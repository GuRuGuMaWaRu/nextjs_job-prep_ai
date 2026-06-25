jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
}));

jest.mock("@/core/drizzle/db", () => ({
  db: {
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    select: jest.fn(),
  },
}));

jest.mock("@/core/features/users/dal", () => ({
  updateUserPlanAndStripeIdsDal: jest.fn(),
}));

import type Stripe from "stripe";

import { db } from "@/core/drizzle/db";
import { getStripe } from "@/core/features/billing/stripe";
import { updateUserPlanAndStripeIdsDal } from "@/core/features/users/dal";
import {
  makeStripeCheckoutSession,
  makeStripeSubscription,
} from "@/core/test-utils/factories";
import {
  createDrizzleMutationChainMock,
  type DrizzleMutationChainMock,
} from "@/core/test-utils/mocks/db";

import {
  claimEvent,
  fulfillCheckoutSession,
  markStripeEventProcessed,
  markStripeEventRemediationRequired,
  unclaimEvent,
} from "./webhookHelpers";

type MockWebhookDb = {
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  select: jest.Mock;
};

const retrieveSubscription = jest.fn<Promise<Stripe.Subscription>, [string]>();

const stripe = {
  subscriptions: {
    retrieve: retrieveSubscription,
  },
} as unknown as Stripe;

const mockGetStripe = jest.mocked(getStripe);
const mockUpdateUserPlanAndStripeIdsDal = jest.mocked(
  updateUserPlanAndStripeIdsDal,
);
const mockDb = db as unknown as MockWebhookDb;

function primeInsertReturning(
  rows: Array<{ id: string }>,
): DrizzleMutationChainMock<Array<{ id: string }>> {
  const insertChain = createDrizzleMutationChainMock(rows);
  mockDb.insert.mockReturnValueOnce(insertChain);

  return insertChain;
}

function primeSelectRows(
  rows: Array<{ state: "processed" | "processing" | "remediation_required" }>,
): DrizzleMutationChainMock<typeof rows> {
  const selectChain = createDrizzleMutationChainMock(rows);
  mockDb.select.mockReturnValueOnce(selectChain);

  return selectChain;
}

function makeCodedError(code: string): Error & { code: string } {
  return Object.assign(new Error(`database error ${code}`), { code });
}

beforeEach(() => {
  jest.resetAllMocks();
});

describe("fulfillCheckoutSession", () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGetStripe.mockReturnValue(stripe);
    mockUpdateUserPlanAndStripeIdsDal.mockResolvedValue(undefined);
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("updates the user for a paid checkout session with an active subscription", async () => {
    const session = makeStripeCheckoutSession({
      userId: "user-test",
      customerId: "cus_test_active",
      subscriptionId: "sub_test_active",
    });
    retrieveSubscription.mockResolvedValueOnce(
      makeStripeSubscription({
        id: "sub_test_active",
        customer: "cus_test_active",
        status: "active",
      }),
    );

    await expect(fulfillCheckoutSession(session)).resolves.toBe(true);

    expect(retrieveSubscription).toHaveBeenCalledWith("sub_test_active");
    expect(mockUpdateUserPlanAndStripeIdsDal).toHaveBeenCalledWith("user-test", {
      plan: "pro",
      stripeCustomerId: "cus_test_active",
      stripeSubscriptionId: "sub_test_active",
    });
  });

  it("does not re-grant Pro when an old paid checkout success points at a canceled subscription", async () => {
    const session = makeStripeCheckoutSession({
      userId: "user-test",
      customerId: "cus_test_canceled",
      subscriptionId: "sub_test_canceled",
    });
    retrieveSubscription.mockResolvedValueOnce(
      makeStripeSubscription({
        id: "sub_test_canceled",
        customer: "cus_test_canceled",
        status: "canceled",
      }),
    );

    await expect(fulfillCheckoutSession(session)).resolves.toBe(false);

    expect(retrieveSubscription).toHaveBeenCalledWith("sub_test_canceled");
    expect(mockUpdateUserPlanAndStripeIdsDal).not.toHaveBeenCalled();
  });

  it("skips unpaid checkout sessions without retrieving the subscription", async () => {
    const session = makeStripeCheckoutSession({
      paymentStatus: "unpaid",
    });

    await expect(fulfillCheckoutSession(session)).resolves.toBe(false);

    expect(retrieveSubscription).not.toHaveBeenCalled();
    expect(mockUpdateUserPlanAndStripeIdsDal).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("skips paid checkout sessions that are missing metadata.userId", async () => {
    const session = makeStripeCheckoutSession({
      id: "cs_test_missing_user",
      userId: null,
    });

    await expect(fulfillCheckoutSession(session)).resolves.toBe(false);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "fulfillCheckoutSession: missing metadata.userId",
      "cs_test_missing_user",
    );
    expect(retrieveSubscription).not.toHaveBeenCalled();
    expect(mockUpdateUserPlanAndStripeIdsDal).not.toHaveBeenCalled();
  });

  it.each([
    ["customer", { customerId: null, subscriptionId: "sub_test_incomplete" }],
    [
      "subscription",
      { customerId: "cus_test_incomplete", subscriptionId: null },
    ],
  ] as const)("skips paid checkout sessions that are missing the %s id", async (_missingField, overrides) => {
    const session = makeStripeCheckoutSession({
      id: "cs_test_incomplete",
      userId: "user-test",
      ...overrides,
    });

    await expect(fulfillCheckoutSession(session)).resolves.toBe(false);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "fulfillCheckoutSession: incomplete session payload",
      ),
      "cs_test_incomplete",
    );
    expect(retrieveSubscription).not.toHaveBeenCalled();
    expect(mockUpdateUserPlanAndStripeIdsDal).not.toHaveBeenCalled();
  });

  it("skips paid checkout sessions when the Stripe client is unavailable", async () => {
    mockGetStripe.mockReturnValueOnce(null);
    const session = makeStripeCheckoutSession({
      userId: "user-test",
      customerId: "cus_test_no_client",
      subscriptionId: "sub_test_no_client",
    });

    await expect(fulfillCheckoutSession(session)).resolves.toBe(false);

    expect(mockGetStripe).toHaveBeenCalledTimes(1);
    expect(retrieveSubscription).not.toHaveBeenCalled();
    expect(mockUpdateUserPlanAndStripeIdsDal).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("uses expanded checkout customer and subscription object ids", async () => {
    const session = makeStripeCheckoutSession({
      userId: "user-test",
      customerId: "cus_test_expanded",
      subscriptionId: "sub_test_expanded",
    });
    session.customer = {
      id: "cus_test_expanded",
    } as Stripe.Customer;
    session.subscription = {
      id: "sub_test_expanded",
    } as Stripe.Subscription;
    retrieveSubscription.mockResolvedValueOnce(
      makeStripeSubscription({
        id: "sub_test_expanded",
        customer: {
          id: "cus_test_expanded",
        } as Stripe.Customer,
        status: "trialing",
      }),
    );

    await expect(fulfillCheckoutSession(session)).resolves.toBe(true);

    expect(retrieveSubscription).toHaveBeenCalledWith("sub_test_expanded");
    expect(mockUpdateUserPlanAndStripeIdsDal).toHaveBeenCalledWith("user-test", {
      plan: "pro",
      stripeCustomerId: "cus_test_expanded",
      stripeSubscriptionId: "sub_test_expanded",
    });
  });

  it("skips sessions whose retrieved subscription belongs to a different customer", async () => {
    const session = makeStripeCheckoutSession({
      id: "cs_test_customer_mismatch",
      userId: "user-test",
      customerId: "cus_test_checkout",
      subscriptionId: "sub_test_mismatch",
    });
    retrieveSubscription.mockResolvedValueOnce(
      makeStripeSubscription({
        id: "sub_test_mismatch",
        customer: "cus_test_other",
        status: "active",
      }),
    );

    await expect(fulfillCheckoutSession(session)).resolves.toBe(false);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "fulfillCheckoutSession: subscription is not fulfillable",
      ),
      "cs_test_customer_mismatch",
    );
    expect(mockUpdateUserPlanAndStripeIdsDal).not.toHaveBeenCalled();
  });

  it("skips sessions whose retrieved expanded subscription has no customer id", async () => {
    const session = makeStripeCheckoutSession({
      id: "cs_test_subscription_customer_missing",
      userId: "user-test",
      customerId: "cus_test_checkout",
      subscriptionId: "sub_test_customer_missing",
    });
    retrieveSubscription.mockResolvedValueOnce(
      makeStripeSubscription({
        id: "sub_test_customer_missing",
        customer: null,
        status: "active",
      }),
    );

    await expect(fulfillCheckoutSession(session)).resolves.toBe(false);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "fulfillCheckoutSession: subscription is not fulfillable",
      ),
      "cs_test_subscription_customer_missing",
    );
    expect(mockUpdateUserPlanAndStripeIdsDal).not.toHaveBeenCalled();
  });
});

describe("markStripeEventProcessed", () => {
  it("marks a claimed Stripe event as processed", async () => {
    const updateChain = createDrizzleMutationChainMock();
    mockDb.update.mockReturnValueOnce(updateChain);

    await expect(
      markStripeEventProcessed("evt_test_processed"),
    ).resolves.toBeUndefined();

    expect(mockDb.update).toHaveBeenCalledTimes(1);
    expect(updateChain.set).toHaveBeenCalledWith({ state: "processed" });
    expect(updateChain.where).toHaveBeenCalledTimes(1);
  });
});

describe("markStripeEventRemediationRequired", () => {
  it("marks a claimed Stripe event as needing remediation with a bounded detail", async () => {
    const updateChain = createDrizzleMutationChainMock();
    mockDb.update.mockReturnValueOnce(updateChain);
    const longDetail = "x".repeat(600);

    await expect(
      markStripeEventRemediationRequired("evt_test_remediation", longDetail),
    ).resolves.toBeUndefined();

    const setPayload = updateChain.set.mock.calls[0]?.[0];
    expect(setPayload).toEqual({
      state: "remediation_required",
      remediationDetail: `${"x".repeat(509)}...`,
    });
    expect(String(setPayload?.remediationDetail)).toHaveLength(512);
    expect(updateChain.where).toHaveBeenCalledTimes(1);
  });

  it("preserves rollout compatibility when the remediation column is missing", async () => {
    const updateChain = createDrizzleMutationChainMock();
    updateChain.where.mockImplementationOnce(() => {
      throw makeCodedError("42703");
    });
    mockDb.update.mockReturnValueOnce(updateChain);

    await expect(
      markStripeEventRemediationRequired("evt_test_old_schema", "unclaim boom"),
    ).resolves.toBeUndefined();
  });

  it("rethrows unexpected database errors", async () => {
    const updateChain = createDrizzleMutationChainMock();
    const error = makeCodedError("40001");
    updateChain.where.mockImplementationOnce(() => {
      throw error;
    });
    mockDb.update.mockReturnValueOnce(updateChain);

    await expect(
      markStripeEventRemediationRequired("evt_test_db_error", "unclaim boom"),
    ).rejects.toBe(error);
  });

  it("rethrows coded non-Error values instead of treating them as rollout compatibility", async () => {
    const updateChain = createDrizzleMutationChainMock();
    const thrownValue = { code: "42703" };
    updateChain.where.mockImplementationOnce(() => {
      throw thrownValue;
    });
    mockDb.update.mockReturnValueOnce(updateChain);

    await expect(
      markStripeEventRemediationRequired("evt_test_non_error", "unclaim boom"),
    ).rejects.toBe(thrownValue);
  });
});

describe("claimEvent", () => {
  it("claims a new Stripe event when the insert wins", async () => {
    const insertChain = primeInsertReturning([{ id: "evt_test_claimed" }]);

    await expect(
      claimEvent("evt_test_claimed", "checkout.session.completed"),
    ).resolves.toBe("claimed");

    expect(insertChain.values).toHaveBeenCalledWith({
      id: "evt_test_claimed",
      type: "checkout.session.completed",
      state: "processing",
    });
    expect(insertChain.onConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it.each([
    ["processed", "duplicate_processed"],
    ["remediation_required", "duplicate_remediation"],
    ["processing", "duplicate_in_progress"],
  ] as const)("returns %s duplicate state when the event row already exists", async (state, expectedResult) => {
    primeInsertReturning([]);
    primeSelectRows([{ state }]);

    await expect(
      claimEvent("evt_test_duplicate", "customer.subscription.updated"),
    ).resolves.toBe(expectedResult);
  });

  it("treats repeatedly missing rows as an in-progress duplicate", async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      primeInsertReturning([]);
      primeSelectRows([]);
    }

    await expect(
      claimEvent("evt_test_missing", "checkout.session.completed"),
    ).resolves.toBe("duplicate_in_progress");

    expect(mockDb.insert).toHaveBeenCalledTimes(5);
    expect(mockDb.select).toHaveBeenCalledTimes(5);
  });
});

describe("unclaimEvent", () => {
  it("deletes the claimed Stripe event row so Stripe can retry it", async () => {
    const deleteChain = createDrizzleMutationChainMock();
    mockDb.delete.mockReturnValueOnce(deleteChain);

    await expect(unclaimEvent("evt_test_retry")).resolves.toBeUndefined();

    expect(mockDb.delete).toHaveBeenCalledTimes(1);
    expect(deleteChain.where).toHaveBeenCalledTimes(1);
  });
});
