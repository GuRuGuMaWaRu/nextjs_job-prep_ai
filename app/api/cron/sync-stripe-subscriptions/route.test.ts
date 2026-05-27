let mockEnv: import("@core/test-utils/env").TestServerEnv;

jest.mock("@/core/data/env/server", () => ({
  get env() {
    return mockEnv;
  },
}));

jest.mock("@/core/features/users/db", () => ({
  getUserIdsWithStripeSubscriptionDb: jest.fn(),
}));

jest.mock("@/core/features/users/stripeSync", () => ({
  reconcileUserStripeSubscription: jest.fn(),
}));

jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
  isStripeConfigured: jest.fn(),
}));

import type Stripe from "stripe";
import { NextRequest } from "next/server";

import { getStripe, isStripeConfigured } from "@/core/features/billing/stripe";
import { getUserIdsWithStripeSubscriptionDb } from "@/core/features/users/db";
import { reconcileUserStripeSubscription } from "@/core/features/users/stripeSync";
import { TEST_OTHER_USER_ID, TEST_USER_ID } from "@/core/test-utils/constants";
import { createTestServerEnv } from "@/core/test-utils/env";

import { GET } from "./route";

const mockGetStripe = jest.mocked(getStripe);
const mockIsStripeConfigured = jest.mocked(isStripeConfigured);
const mockGetUserIdsWithStripeSubscriptionDb = jest.mocked(
  getUserIdsWithStripeSubscriptionDb,
);
const mockReconcileUserStripeSubscription = jest.mocked(
  reconcileUserStripeSubscription,
);

const mockStripe = {
  subscriptions: {
    retrieve: jest.fn(),
  },
};

function buildCronRequest(secret: string | null = mockEnv.CRON_SECRET) {
  const headers = new Headers();

  if (secret !== null) {
    headers.set("authorization", `Bearer ${secret}`);
  }

  return new NextRequest(
    "http://localhost:3000/api/cron/sync-stripe-subscriptions",
    { method: "GET", headers },
  );
}

async function expectJsonResponse(
  response: Response,
  status: number,
  body: unknown,
): Promise<void> {
  expect(response.status).toBe(status);
  await expect(response.json()).resolves.toEqual(body);
}

describe("GET /api/cron/sync-stripe-subscriptions", () => {
  let consoleInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    mockEnv = createTestServerEnv({ CRON_SECRET: "test_cron_secret" });

    jest.clearAllMocks();

    mockIsStripeConfigured.mockReturnValue(true);
    mockGetStripe.mockReturnValue(mockStripe as unknown as Stripe);
    mockGetUserIdsWithStripeSubscriptionDb.mockResolvedValue([TEST_USER_ID]);
    mockReconcileUserStripeSubscription.mockResolvedValue({
      kind: "ok",
      updated: true,
    });

    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  it("returns 401 when the cron authorization header is missing", async () => {
    const response = await GET(buildCronRequest(null));

    await expectJsonResponse(response, 401, { error: "Unauthorized" });
    expect(mockIsStripeConfigured).not.toHaveBeenCalled();
    expect(mockGetUserIdsWithStripeSubscriptionDb).not.toHaveBeenCalled();
  });

  it("returns 401 when the cron authorization header is invalid", async () => {
    const response = await GET(buildCronRequest("wrong_secret"));

    await expectJsonResponse(response, 401, { error: "Unauthorized" });
    expect(mockIsStripeConfigured).not.toHaveBeenCalled();
    expect(mockReconcileUserStripeSubscription).not.toHaveBeenCalled();
  });

  it("returns 501 when Stripe is not configured", async () => {
    mockIsStripeConfigured.mockReturnValueOnce(false);

    const response = await GET(buildCronRequest());

    await expectJsonResponse(response, 501, { error: "Stripe not configured" });
    expect(mockGetStripe).not.toHaveBeenCalled();
    expect(mockGetUserIdsWithStripeSubscriptionDb).not.toHaveBeenCalled();
  });

  it("returns 501 when the Stripe client is unavailable", async () => {
    mockGetStripe.mockReturnValueOnce(null);

    const response = await GET(buildCronRequest());

    await expectJsonResponse(response, 501, { error: "Stripe not configured" });
    expect(mockGetUserIdsWithStripeSubscriptionDb).not.toHaveBeenCalled();
  });

  it("reconciles subscriptions and reports the batch result counters", async () => {
    mockGetUserIdsWithStripeSubscriptionDb.mockResolvedValueOnce([
      TEST_USER_ID,
      TEST_OTHER_USER_ID,
      "user-3",
      "user-4",
    ]);
    mockReconcileUserStripeSubscription
      .mockResolvedValueOnce({ kind: "ok", updated: true })
      .mockResolvedValueOnce({ kind: "ok", updated: false })
      .mockResolvedValueOnce({ kind: "skipped", reason: "no_subscription" })
      .mockResolvedValueOnce({
        kind: "error",
        message: "subscription_missing_customer",
      });

    const response = await GET(buildCronRequest());

    await expectJsonResponse(response, 200, {
      ok: true,
      batchLimit: 500,
      candidates: 4,
      processed: 4,
      updated: 1,
      skipped: 1,
      errors: 1,
      errorSamples: ["user-4:subscription_missing_customer"],
    });
    expect(mockGetUserIdsWithStripeSubscriptionDb).toHaveBeenCalledWith(500);
    expect(mockReconcileUserStripeSubscription).toHaveBeenNthCalledWith(
      1,
      mockStripe,
      TEST_USER_ID,
    );
    expect(mockReconcileUserStripeSubscription).toHaveBeenNthCalledWith(
      4,
      mockStripe,
      "user-4",
    );
  });

  it("captures rejected reconciliation failures without failing the cron run", async () => {
    mockGetUserIdsWithStripeSubscriptionDb.mockResolvedValueOnce([
      TEST_USER_ID,
      TEST_OTHER_USER_ID,
    ]);
    mockReconcileUserStripeSubscription
      .mockRejectedValueOnce(new Error("Stripe timeout"))
      .mockRejectedValueOnce("non-error failure");

    const response = await GET(buildCronRequest());

    await expectJsonResponse(response, 200, {
      ok: true,
      batchLimit: 500,
      candidates: 2,
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 2,
      errorSamples: [
        `${TEST_USER_ID}:Stripe timeout`,
        `${TEST_OTHER_USER_ID}:non-error failure`,
      ],
    });
  });

  it("limits returned error samples to the first five failures", async () => {
    const userIds = Array.from({ length: 6 }, (_, idx) => `user-${idx + 1}`);
    mockGetUserIdsWithStripeSubscriptionDb.mockResolvedValueOnce(userIds);
    mockReconcileUserStripeSubscription.mockResolvedValue({
      kind: "error",
      message: "sync_failed",
    });

    const response = await GET(buildCronRequest());

    await expectJsonResponse(response, 200, {
      ok: true,
      batchLimit: 500,
      candidates: 6,
      processed: 6,
      updated: 0,
      skipped: 0,
      errors: 6,
      errorSamples: [
        "user-1:sync_failed",
        "user-2:sync_failed",
        "user-3:sync_failed",
        "user-4:sync_failed",
        "user-5:sync_failed",
      ],
    });
  });

  it("propagates unexpected user lookup failures", async () => {
    mockGetUserIdsWithStripeSubscriptionDb.mockRejectedValueOnce(
      new Error("database offline"),
    );

    await expect(GET(buildCronRequest())).rejects.toThrow("database offline");
    expect(mockReconcileUserStripeSubscription).not.toHaveBeenCalled();
  });
});
