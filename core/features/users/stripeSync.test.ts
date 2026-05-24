import Stripe from "stripe";

import {
  makeProUser,
  makeStripeSubscription,
  makeUser,
} from "@core/test-utils/factories";

jest.mock("./db", () => ({
  getUserByIdDb: jest.fn(),
  getUserByStripeCustomerIdDb: jest.fn(),
  updateUserPlanAndStripeIdsDb: jest.fn(),
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

function makeStripeList(
  subscriptions: Stripe.Subscription[],
): Stripe.ApiList<Stripe.Subscription> {
  return {
    object: "list",
    data: subscriptions,
    has_more: false,
    url: "/v1/subscriptions",
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
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRetrieve = jest.fn();
    stripe = {
      subscriptions: {
        retrieve: mockRetrieve,
        list: jest.fn(),
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

  it("skips stale subscription events when the user already references a newer subscription", async () => {
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

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_stale",
      "cus_test_current",
    );

    expect(mockRetrieve).toHaveBeenCalledWith("sub_test_stale");
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
  });

  it("attaches a newer active subscription when the stored subscription is stale", async () => {
    const user = makeProUser({
      stripeCustomerId: "cus_test_current",
      stripeSubscriptionId: "sub_test_old",
    });
    const newSubscription = makeStripeSubscription({
      id: "sub_test_new",
      customer: "cus_test_current",
      status: "active",
    });
    const oldSubscription = makeStripeSubscription({
      id: "sub_test_old",
      customer: "cus_test_current",
      status: "canceled",
    });
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);
    mockRetrieve
      .mockResolvedValueOnce(newSubscription)
      .mockResolvedValueOnce(oldSubscription);

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_new",
      "cus_test_current",
    );

    expect(mockRetrieve).toHaveBeenNthCalledWith(1, "sub_test_new");
    expect(mockRetrieve).toHaveBeenNthCalledWith(2, "sub_test_old");
    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).toHaveBeenCalledWith(user.id, "sub_test_old", {
      plan: "pro",
      stripeSubscriptionId: "sub_test_new",
    });
  });

  it("skips a mismatched active event when the stored subscription is still active", async () => {
    const user = makeProUser({
      stripeCustomerId: "cus_test_current",
      stripeSubscriptionId: "sub_test_current",
    });
    const eventSubscription = makeStripeSubscription({
      id: "sub_test_other",
      customer: "cus_test_current",
      status: "active",
    });
    const currentSubscription = makeStripeSubscription({
      id: "sub_test_current",
      customer: "cus_test_current",
      status: "active",
    });
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);
    mockRetrieve
      .mockResolvedValueOnce(eventSubscription)
      .mockResolvedValueOnce(currentSubscription);

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_other",
      "cus_test_current",
    );

    expect(
      mockUpdateUserPlanAndStripeIdsIfSubscriptionMatchesDb,
    ).not.toHaveBeenCalled();
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
    mockList.mockResolvedValue(makeStripeList([activeSubscription]));

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
    mockList.mockResolvedValue(makeStripeList([activeSubscription]));

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

  it("downgrades a missing stored subscription only while the row still references it", async () => {
    const user = makeProUser({
      id: "user_test_downgrade",
      stripeCustomerId: "cus_test_downgrade",
      stripeSubscriptionId: "sub_test_missing",
    });
    mockGetUserByIdDb.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
    mockRetrieve.mockRejectedValue(makeMissingSubscriptionError());
    mockList.mockResolvedValue(makeStripeList([]));

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
});
