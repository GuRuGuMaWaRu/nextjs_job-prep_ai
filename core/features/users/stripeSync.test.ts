import Stripe from "stripe";

import {
  makeProUser,
  makeStripeSubscription,
  makeUser,
} from "@core/test-utils/factories";

jest.mock("./db", () => ({
  getUserByIdDb: jest.fn(),
  getUserByStripeCustomerIdDb: jest.fn(),
  updateUserPlanAndStripeIdsIfSubscriptionMatchesDb: jest.fn(),
}));

import {
  getUserByIdDb,
  getUserByStripeCustomerIdDb,
  updateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
} from "./db";
import {
  reconcileUserStripeSubscription,
  syncSubscriptionFromStripe,
} from "./stripeSync";

const mockGetUserByIdDb = jest.mocked(getUserByIdDb);
const mockGetUserByStripeCustomerIdDb = jest.mocked(
  getUserByStripeCustomerIdDb,
);
const mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb = jest.mocked(
  updateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
);

const missingUserById = null as unknown as Awaited<
  ReturnType<typeof getUserByIdDb>
>;
const missingUserByStripeCustomerId = null as unknown as Awaited<
  ReturnType<typeof getUserByStripeCustomerIdDb>
>;

type StripeSubscriptionList = Stripe.ApiList<Stripe.Subscription> &
  AsyncIterable<Stripe.Subscription>;

function makeStripeList(
  subscriptions: Stripe.Subscription[],
  autoPagingSubscriptions = subscriptions,
): StripeSubscriptionList {
  return {
    object: "list",
    data: subscriptions,
    has_more: false,
    url: "/v1/subscriptions",
    async *[Symbol.asyncIterator]() {
      for (const subscription of autoPagingSubscriptions) {
        yield subscription;
      }
    },
  };
}

function makeMissingSubscriptionError(): Stripe.errors.StripeInvalidRequestError {
  return new Stripe.errors.StripeInvalidRequestError({
    code: "resource_missing",
    message: "No such subscription",
    type: "invalid_request_error",
    headers: {},
    requestId: "req_test_missing_subscription",
    statusCode: 404,
  } as Stripe.StripeRawError);
}

describe("syncSubscriptionFromStripe", () => {
  let stripe: Stripe;
  let mockRetrieve: jest.Mock;
  let mockList: jest.Mock;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRetrieve = jest.fn();
    mockList = jest.fn().mockReturnValue(makeStripeList([]));
    stripe = {
      subscriptions: {
        retrieve: mockRetrieve,
        list: mockList,
      },
    } as unknown as Stripe;

    jest.clearAllMocks();
    mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb.mockResolvedValue(
      true,
    );
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("skips stale non-active subscription events when the user already references another subscription", async () => {
    const user = makeProUser({
      stripeCustomerId: "cus_test_current",
      stripeSubscriptionId: "sub_test_current",
    });
    const currentSubscription = makeStripeSubscription({
      id: "sub_test_current",
      customer: "cus_test_current",
      status: "active",
      created: 200,
    });
    const staleSubscription = makeStripeSubscription({
      id: "sub_test_stale",
      customer: "cus_test_current",
      status: "canceled",
      created: 100,
    });
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(staleSubscription);
    mockList.mockReturnValue(makeStripeList([currentSubscription]));

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_stale",
      "cus_test_current",
    );

    expect(mockRetrieve).toHaveBeenCalledWith("sub_test_stale");
    expect(mockList).toHaveBeenCalledWith({
      customer: "cus_test_current",
      status: "all",
      limit: 100,
    });
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
  });

  it("logs null active subscription context for stale events without an active replacement", async () => {
    const user = makeProUser({
      stripeCustomerId: "cus_test_current",
      stripeSubscriptionId: "sub_test_current",
    });
    const staleSubscription = makeStripeSubscription({
      id: "sub_test_stale",
      customer: "cus_test_current",
      status: "canceled",
    });
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(staleSubscription);
    mockList.mockReturnValue(makeStripeList([]));

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_stale",
      "cus_test_current",
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[stripeSync] Skipped stale subscription webhook",
      {
        currentStripeSubscriptionId: "sub_test_current",
        eventStripeSubscriptionId: "sub_test_stale",
        activeStripeSubscriptionId: null,
      },
    );
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
  });

  it("updates to a newer active subscription when the row still references an older subscription", async () => {
    const user = makeProUser({
      stripeCustomerId: "cus_test_current",
      stripeSubscriptionId: "sub_test_old",
    });
    const oldSubscription = makeStripeSubscription({
      id: "sub_test_old",
      customer: "cus_test_current",
      status: "active",
      created: 100,
    });
    const newSubscription = makeStripeSubscription({
      id: "sub_test_new",
      customer: "cus_test_current",
      status: "active",
      created: 200,
    });
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(newSubscription);
    mockList.mockReturnValue(
      makeStripeList([oldSubscription, newSubscription]),
    );

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_new",
      "cus_test_current",
    );

    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_old", {
      plan: "pro",
      stripeSubscriptionId: "sub_test_new",
    });
  });

  it("keeps the stored subscription when it is already active", async () => {
    const user = makeProUser({
      stripeCustomerId: "cus_test_current",
      stripeSubscriptionId: "sub_test_current",
    });
    const currentSubscription = makeStripeSubscription({
      id: "sub_test_current",
      customer: "cus_test_current",
      status: "trialing",
    });
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(currentSubscription);

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_current",
      "cus_test_current",
    );

    expect(mockList).not.toHaveBeenCalled();
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_current", {
      plan: "pro",
      stripeSubscriptionId: "sub_test_current",
    });
  });

  it("uses auto-pagination when searching for an active replacement subscription", async () => {
    const user = makeProUser({
      stripeCustomerId: "cus_test_paginated",
      stripeSubscriptionId: "sub_test_old",
    });
    const canceledSubscription = makeStripeSubscription({
      id: "sub_test_old",
      customer: "cus_test_paginated",
      status: "canceled",
      created: 100,
    });
    const activeSubscription = makeStripeSubscription({
      id: "sub_test_active_after_first_page",
      customer: "cus_test_paginated",
      status: "active",
      created: 200,
    });
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(canceledSubscription);
    mockList.mockReturnValue(makeStripeList([], [activeSubscription]));

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_old",
      "cus_test_paginated",
    );

    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_old", {
      plan: "pro",
      stripeSubscriptionId: "sub_test_active_after_first_page",
    });
  });

  it("does not let an older active subscription replace a newer stored subscription", async () => {
    const user = makeProUser({
      stripeCustomerId: "cus_test_current",
      stripeSubscriptionId: "sub_test_new",
    });
    const oldSubscription = makeStripeSubscription({
      id: "sub_test_old",
      customer: "cus_test_current",
      status: "active",
      created: 100,
    });
    const newSubscription = makeStripeSubscription({
      id: "sub_test_new",
      customer: "cus_test_current",
      status: "active",
      created: 200,
    });
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(oldSubscription);
    mockList.mockReturnValue(
      makeStripeList([oldSubscription, newSubscription]),
    );

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_old",
      "cus_test_current",
    );

    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
  });

  it("switches to a newer active subscription instead of downgrading a terminal stored subscription", async () => {
    const user = makeProUser({
      stripeCustomerId: "cus_test_current",
      stripeSubscriptionId: "sub_test_old",
    });
    const canceledSubscription = makeStripeSubscription({
      id: "sub_test_old",
      customer: "cus_test_current",
      status: "canceled",
      created: 100,
    });
    const newSubscription = makeStripeSubscription({
      id: "sub_test_new",
      customer: "cus_test_current",
      status: "active",
      created: 200,
    });
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(canceledSubscription);
    mockList.mockReturnValue(makeStripeList([newSubscription]));

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_old",
      "cus_test_current",
    );

    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_old", {
      plan: "pro",
      stripeSubscriptionId: "sub_test_new",
    });
  });

  it("ignores inactive and older active subscriptions when choosing a replacement", async () => {
    const user = makeProUser({
      stripeCustomerId: "cus_test_current",
      stripeSubscriptionId: "sub_test_old",
    });
    const canceledSubscription = makeStripeSubscription({
      id: "sub_test_old",
      customer: "cus_test_current",
      status: "canceled",
      created: 100,
    });
    const newestActiveSubscription = makeStripeSubscription({
      id: "sub_test_newest",
      customer: "cus_test_current",
      status: "active",
      created: 300,
    });
    const inactiveSubscription = makeStripeSubscription({
      id: "sub_test_inactive",
      customer: "cus_test_current",
      status: "incomplete_expired",
      created: 400,
    });
    const olderActiveSubscription = makeStripeSubscription({
      id: "sub_test_older",
      customer: "cus_test_current",
      status: "active",
      created: 200,
    });
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(canceledSubscription);
    mockList.mockReturnValue(
      makeStripeList([
        newestActiveSubscription,
        inactiveSubscription,
        olderActiveSubscription,
      ]),
    );

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_old",
      "cus_test_current",
    );

    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_old", {
      plan: "pro",
      stripeSubscriptionId: "sub_test_newest",
    });
  });

  it("uses a conditional update so concurrent checkout fulfillment cannot be overwritten", async () => {
    const user = makeUser({
      stripeCustomerId: "cus_test_current",
      stripeSubscriptionId: null,
    });
    const canceledSubscription = makeStripeSubscription({
      id: "sub_test_old",
      customer: "cus_test_current",
      status: "canceled",
    });
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(canceledSubscription);
    mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb.mockResolvedValue(
      false,
    );

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_old",
      "cus_test_current",
    );

    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, null, {
      plan: "free",
      stripeSubscriptionId: null,
    });
  });

  it("throws so Stripe can retry when no user exists for the customer", async () => {
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(
      missingUserByStripeCustomerId,
    );

    await expect(
      syncSubscriptionFromStripe(
        stripe,
        "sub_test_missing_user",
        "cus_test_missing_user",
      ),
    ).rejects.toThrow(
      "syncSubscriptionFromStripe: no user for customer cus_test_missing_user - will retry",
    );

    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
  });
});

describe("reconcileUserStripeSubscription", () => {
  let stripe: Stripe;
  let mockRetrieve: jest.Mock;
  let mockList: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRetrieve = jest.fn();
    mockList = jest.fn();
    stripe = {
      subscriptions: {
        retrieve: mockRetrieve,
        list: mockList,
      },
    } as unknown as Stripe;

    jest.clearAllMocks();
    mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb.mockResolvedValue(
      true,
    );
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("skips users without a stored subscription", async () => {
    const user = makeUser({
      id: "user_test_free",
      stripeSubscriptionId: null,
    });
    mockGetUserByIdDb.mockResolvedValue(user);

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "skipped",
      reason: "no_subscription",
    });

    expect(mockRetrieve).not.toHaveBeenCalled();
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
  });

  it("returns an error when Stripe returns a subscription without a customer", async () => {
    const user = makeProUser({
      id: "user_test_missing_customer",
      stripeSubscriptionId: "sub_test_missing_customer",
    });
    const subscription = makeStripeSubscription({
      id: "sub_test_missing_customer",
      customer: {} as Stripe.Customer,
    });
    mockGetUserByIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(subscription);

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "error",
      message: "subscription_missing_customer",
    });

    expect(mockList).not.toHaveBeenCalled();
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
  });

  it("skips reconciliation when the stored customer conflicts with Stripe", async () => {
    const user = makeProUser({
      id: "user_test_customer_mismatch",
      stripeCustomerId: "cus_test_stored",
      stripeSubscriptionId: "sub_test_customer_mismatch",
    });
    const subscription = makeStripeSubscription({
      id: "sub_test_customer_mismatch",
      customer: "cus_test_stripe",
    });
    mockGetUserByIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(subscription);

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "skipped",
      reason: "customer_mismatch",
    });

    expect(mockList).not.toHaveBeenCalled();
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
  });

  it("accepts expanded customer objects when the user has no stored customer id", async () => {
    const user = makeProUser({
      id: "user_test_expanded_customer",
      stripeCustomerId: null,
      stripeSubscriptionId: "sub_test_expanded_customer",
    });
    const subscription = makeStripeSubscription({
      id: "sub_test_expanded_customer",
      customer: { id: "cus_test_expanded" } as Stripe.Customer,
      status: "active",
    });
    mockGetUserByIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(subscription);

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: false,
    });

    expect(mockList).not.toHaveBeenCalled();
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
  });

  it("returns unchanged when Stripe already matches the stored subscription state", async () => {
    const user = makeProUser({
      id: "user_test_unchanged",
      stripeCustomerId: "cus_test_unchanged",
      stripeSubscriptionId: "sub_test_unchanged",
    });
    const subscription = makeStripeSubscription({
      id: "sub_test_unchanged",
      customer: "cus_test_unchanged",
      status: "active",
    });
    mockGetUserByIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(subscription);

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: false,
    });

    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
  });

  it("warns when a reconciliation update loses the concurrent row guard", async () => {
    const user = makeUser({
      id: "user_test_concurrent_update",
      stripeCustomerId: "cus_test_concurrent_update",
      stripeSubscriptionId: "sub_test_concurrent_update",
    });
    const subscription = makeStripeSubscription({
      id: "sub_test_concurrent_update",
      customer: "cus_test_concurrent_update",
      status: "active",
    });
    mockGetUserByIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(subscription);
    mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb.mockResolvedValue(
      false,
    );

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: false,
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[stripeSync] Skipped reconciliation update: row changed concurrently",
      {
        userId: user.id,
        priorStripeSubscriptionId: "sub_test_concurrent_update",
        stripeSubscriptionId: "sub_test_concurrent_update",
      },
    );
  });

  it("repairs a missing stored subscription by attaching another active customer subscription", async () => {
    const user = makeProUser({
      id: "user_test_repair",
      stripeCustomerId: "cus_test_repair",
      stripeSubscriptionId: "sub_test_missing",
    });
    const activeSubscription = makeStripeSubscription({
      id: "sub_test_active",
      customer: "cus_test_repair",
      status: "active",
    });
    mockGetUserByIdDb.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
    mockRetrieve.mockRejectedValue(makeMissingSubscriptionError());
    mockList.mockReturnValue(makeStripeList([activeSubscription]));

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: true,
    });

    expect(mockList).toHaveBeenCalledWith({
      customer: "cus_test_repair",
      status: "all",
      limit: 100,
    });
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_missing", {
      plan: "pro",
      stripeSubscriptionId: "sub_test_active",
    });
  });

  it("repairs a retrievable inactive stored subscription by attaching another active customer subscription", async () => {
    const user = makeProUser({
      id: "user_test_repair_inactive",
      stripeCustomerId: "cus_test_repair",
      stripeSubscriptionId: "sub_test_inactive",
    });
    const inactiveSubscription = makeStripeSubscription({
      id: "sub_test_inactive",
      customer: "cus_test_repair",
      status: "canceled",
    });
    const activeSubscription = makeStripeSubscription({
      id: "sub_test_active",
      customer: "cus_test_repair",
      status: "active",
    });
    mockGetUserByIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(inactiveSubscription);
    mockList.mockReturnValue(makeStripeList([activeSubscription]));

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: true,
    });

    expect(mockList).toHaveBeenCalledWith({
      customer: "cus_test_repair",
      status: "all",
      limit: 100,
    });
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_inactive", {
      plan: "pro",
      stripeSubscriptionId: "sub_test_active",
    });
  });

  it("downgrades a retrievable terminal subscription when no active customer subscription exists", async () => {
    const user = makeProUser({
      id: "user_test_terminal_no_repair",
      stripeCustomerId: "cus_test_terminal_no_repair",
      stripeSubscriptionId: "sub_test_terminal",
    });
    const terminalSubscription = makeStripeSubscription({
      id: "sub_test_terminal",
      customer: "cus_test_terminal_no_repair",
      status: "incomplete_expired",
    });
    mockGetUserByIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(terminalSubscription);
    mockList.mockReturnValue(makeStripeList([]));

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: true,
    });

    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_terminal", {
      plan: "free",
      stripeSubscriptionId: null,
    });
  });

  it("repairs a terminal stored subscription by attaching the newest active customer subscription", async () => {
    const user = makeProUser({
      id: "user_test_terminal_repair",
      stripeCustomerId: "cus_test_terminal_repair",
      stripeSubscriptionId: "sub_test_old",
    });
    const canceledSubscription = makeStripeSubscription({
      id: "sub_test_old",
      customer: "cus_test_terminal_repair",
      status: "canceled",
      created: 100,
    });
    const olderActiveSubscription = makeStripeSubscription({
      id: "sub_test_older_active",
      customer: "cus_test_terminal_repair",
      status: "active",
      created: 150,
    });
    const newestActiveSubscription = makeStripeSubscription({
      id: "sub_test_newest_active",
      customer: "cus_test_terminal_repair",
      status: "active",
      created: 200,
    });
    mockGetUserByIdDb.mockResolvedValue(user);
    mockRetrieve.mockResolvedValue(canceledSubscription);
    mockList.mockReturnValue(
      makeStripeList([olderActiveSubscription, newestActiveSubscription]),
    );

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: true,
    });

    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_old", {
      plan: "pro",
      stripeSubscriptionId: "sub_test_newest_active",
    });
  });

  it("downgrades a missing stored subscription only while the row still references it", async () => {
    const user = makeProUser({
      id: "user_test_downgrade",
      stripeCustomerId: "cus_test_downgrade",
      stripeSubscriptionId: "sub_test_missing",
    });
    mockGetUserByIdDb.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
    mockRetrieve.mockRejectedValue(makeMissingSubscriptionError());
    mockList.mockReturnValue(makeStripeList([]));

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: true,
    });

    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_missing", {
      plan: "free",
      stripeSubscriptionId: null,
    });
  });

  it("skips missing-subscription downgrade when the row changed before repair", async () => {
    const user = makeProUser({
      id: "user_test_stale_missing",
      stripeCustomerId: "cus_test_stale_missing",
      stripeSubscriptionId: "sub_test_missing",
    });
    const freshUser = makeProUser({
      id: "user_test_stale_missing",
      stripeCustomerId: "cus_test_stale_missing",
      stripeSubscriptionId: "sub_test_new",
    });
    mockGetUserByIdDb
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(freshUser);
    mockRetrieve.mockRejectedValue(makeMissingSubscriptionError());

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: false,
    });

    expect(mockList).not.toHaveBeenCalled();
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[stripeSync] Skipped downgrade after missing subscription: row changed concurrently",
      {
        userId: user.id,
        priorStripeSubscriptionId: "sub_test_missing",
        currentStripeSubscriptionId: "sub_test_new",
      },
    );
  });

  it("logs null current subscription context when the row disappears before repair", async () => {
    const user = makeProUser({
      id: "user_test_deleted_before_repair",
      stripeCustomerId: "cus_test_deleted_before_repair",
      stripeSubscriptionId: "sub_test_missing",
    });
    mockGetUserByIdDb
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(missingUserById);
    mockRetrieve.mockRejectedValue(makeMissingSubscriptionError());

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: false,
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[stripeSync] Skipped downgrade after missing subscription: row changed concurrently",
      {
        userId: user.id,
        priorStripeSubscriptionId: "sub_test_missing",
        currentStripeSubscriptionId: null,
      },
    );
  });

  it("downgrades a missing subscription when the fresh row has no customer fallback", async () => {
    const user = makeProUser({
      id: "user_test_missing_without_customer",
      stripeCustomerId: "cus_test_old",
      stripeSubscriptionId: "sub_test_missing",
    });
    const freshUser = makeProUser({
      id: "user_test_missing_without_customer",
      stripeCustomerId: null,
      stripeSubscriptionId: "sub_test_missing",
    });
    mockGetUserByIdDb
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(freshUser);
    mockRetrieve.mockRejectedValue(makeMissingSubscriptionError());

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: true,
    });

    expect(mockList).not.toHaveBeenCalled();
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_missing", {
      plan: "free",
      stripeSubscriptionId: null,
    });
  });

  it("warns when active subscription repair loses the concurrent row guard", async () => {
    const user = makeProUser({
      id: "user_test_repair_concurrent",
      stripeCustomerId: "cus_test_repair_concurrent",
      stripeSubscriptionId: "sub_test_missing",
    });
    const activeSubscription = makeStripeSubscription({
      id: "sub_test_active",
      customer: "cus_test_repair_concurrent",
      status: "active",
    });
    mockGetUserByIdDb.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
    mockRetrieve.mockRejectedValue(makeMissingSubscriptionError());
    mockList.mockReturnValue(makeStripeList([activeSubscription]));
    mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb.mockResolvedValue(
      false,
    );

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: false,
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[stripeSync] Skipped active subscription repair: row changed concurrently",
      {
        userId: user.id,
        priorStripeSubscriptionId: "sub_test_missing",
        activeStripeSubscriptionId: "sub_test_active",
      },
    );
  });

  it("warns when missing-subscription downgrade loses the concurrent row guard", async () => {
    const user = makeProUser({
      id: "user_test_downgrade_concurrent",
      stripeCustomerId: "cus_test_downgrade_concurrent",
      stripeSubscriptionId: "sub_test_missing",
    });
    mockGetUserByIdDb.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
    mockRetrieve.mockRejectedValue(makeMissingSubscriptionError());
    mockList.mockReturnValue(makeStripeList([]));
    mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb.mockResolvedValue(
      false,
    );

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).resolves.toEqual({
      kind: "ok",
      updated: false,
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[stripeSync] Skipped downgrade after missing subscription: row changed concurrently",
      {
        userId: user.id,
        priorStripeSubscriptionId: "sub_test_missing",
      },
    );
  });

  it("logs and rethrows unexpected Stripe retrieval failures", async () => {
    const user = makeProUser({
      id: "user_test_unexpected_retrieve_failure",
      stripeSubscriptionId: "sub_test_unexpected_retrieve_failure",
    });
    mockGetUserByIdDb.mockResolvedValue(user);
    mockRetrieve.mockRejectedValue("stripe temporarily unavailable");

    await expect(reconcileUserStripeSubscription(stripe, user.id)).rejects.toBe(
      "stripe temporarily unavailable",
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[stripeSync] reconcileUserStripeSubscription failed",
      {
        userId: user.id,
        stripeSubscriptionId: "sub_test_unexpected_retrieve_failure",
        error: "stripe temporarily unavailable",
      },
    );
  });

  it("logs Error messages for unexpected Stripe retrieval failures", async () => {
    const user = makeProUser({
      id: "user_test_unexpected_error",
      stripeSubscriptionId: "sub_test_unexpected_error",
    });
    const error = new Error("Stripe API unavailable");
    mockGetUserByIdDb.mockResolvedValue(user);
    mockRetrieve.mockRejectedValue(error);

    await expect(
      reconcileUserStripeSubscription(stripe, user.id),
    ).rejects.toThrow(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[stripeSync] reconcileUserStripeSubscription failed",
      {
        userId: user.id,
        stripeSubscriptionId: "sub_test_unexpected_error",
        error: "Stripe API unavailable",
      },
    );
  });
});
