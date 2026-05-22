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
    mockGetUserByStripeCustomerIdDb.mockResolvedValue(user);

    await syncSubscriptionFromStripe(
      stripe,
      "sub_test_stale",
      "cus_test_current",
    );

    expect(mockRetrieve).not.toHaveBeenCalled();
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
