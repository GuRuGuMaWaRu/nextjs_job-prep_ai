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

jest.mock("@/core/features/users/db", () => ({
  updateUserPlanAndStripeIdsDb: jest.fn(),
}));

import type Stripe from "stripe";

import { db } from "@/core/drizzle/db";
import { getStripe } from "@/core/features/billing/stripe";
import { updateUserPlanAndStripeIdsDb } from "@/core/features/users/db";
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

const retrieveSubscription = jest.fn<
  Promise<Stripe.Subscription>,
  [string]
>();

const stripe = {
  subscriptions: {
    retrieve: retrieveSubscription,
  },
} as unknown as Stripe;

const mockGetStripe = jest.mocked(getStripe);
const mockUpdateUserPlanAndStripeIdsDb = jest.mocked(
  updateUserPlanAndStripeIdsDb,
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
  jest.clearAllMocks();
});

describe("fulfillCheckoutSession", () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGetStripe.mockReturnValue(stripe);
    mockUpdateUserPlanAndStripeIdsDb.mockResolvedValue(undefined);
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
    expect(mockUpdateUserPlanAndStripeIdsDb).toHaveBeenCalledWith("user-test", {
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
    expect(mockUpdateUserPlanAndStripeIdsDb).not.toHaveBeenCalled();
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
  ] as const)(
    "returns %s duplicate state when the event row already exists",
    async (state, expectedResult) => {
      primeInsertReturning([]);
      primeSelectRows([{ state }]);

      await expect(
        claimEvent("evt_test_duplicate", "customer.subscription.updated"),
      ).resolves.toBe(expectedResult);
    },
  );

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
