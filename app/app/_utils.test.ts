jest.mock("@/core/features/billing/stripe", () => ({
  getStripe: jest.fn(),
}));

import { getStripe } from "@/core/features/billing/stripe";
import {
  makeProUser,
  makeStripeSubscription,
  makeUser,
} from "@/core/test-utils/factories";
import {
  asStripeClient,
  createMockStripe,
} from "@/core/test-utils/mocks/stripe";

import { getCanceledSubscriptionNotice } from "./_utils";

const mockGetStripe = jest.mocked(getStripe);

describe("_utils", () => {
  describe("getCanceledSubscriptionNotice", () => {
    const stripe = createMockStripe();

    beforeEach(() => {
      jest.clearAllMocks();
      mockGetStripe.mockReturnValue(asStripeClient(stripe));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns null without retrieving Stripe for a free user", async () => {
      const user = makeUser({
        stripeSubscriptionId: "sub_test_free",
      });

      await expect(getCanceledSubscriptionNotice(user)).resolves.toBeNull();

      expect(mockGetStripe).not.toHaveBeenCalled();
      expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    });

    it("returns null without retrieving Stripe when the Pro user has no subscription id", async () => {
      const user = makeProUser({
        stripeSubscriptionId: null,
      });

      await expect(getCanceledSubscriptionNotice(user)).resolves.toBeNull();

      expect(mockGetStripe).not.toHaveBeenCalled();
      expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    });

    it("returns null without retrieving a subscription when Stripe is unavailable", async () => {
      const user = makeProUser({
        stripeSubscriptionId: "sub_test_unavailable",
      });
      mockGetStripe.mockReturnValue(null);

      await expect(getCanceledSubscriptionNotice(user)).resolves.toBeNull();

      expect(mockGetStripe).toHaveBeenCalledTimes(1);
      expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    });

    it("returns null when the subscription is not scheduled to cancel", async () => {
      const user = makeProUser({
        stripeSubscriptionId: "sub_test_active",
      });
      stripe.subscriptions.retrieve.mockResolvedValue(
        makeStripeSubscription({
          cancelAtPeriodEnd: false,
          id: "sub_test_active",
        }),
      );

      await expect(getCanceledSubscriptionNotice(user)).resolves.toBeNull();

      expect(stripe.subscriptions.retrieve).toHaveBeenCalledTimes(1);
      expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith(
        "sub_test_active",
      );
    });

    it("returns a notice with a valid future cancellation time", async () => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date("2026-01-01T00:00:00.000Z").getTime());
      const cancelAt = 1_900_000_000;
      const user = makeProUser({
        stripeSubscriptionId: "sub_test_future",
      });
      stripe.subscriptions.retrieve.mockResolvedValue({
        ...makeStripeSubscription({
          cancelAtPeriodEnd: true,
          id: "sub_test_future",
        }),
        cancel_at: cancelAt,
      });

      await expect(getCanceledSubscriptionNotice(user)).resolves.toEqual({
        subscriptionId: "sub_test_future",
        periodEndUnix: cancelAt,
      });

      expect(stripe.subscriptions.retrieve).toHaveBeenCalledTimes(1);
      expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith(
        "sub_test_future",
      );
    });

    it.each([
      ["null", null],
      ["zero", 0],
      ["NaN", Number.NaN],
    ])("returns a notice with no cancellation time when cancel_at is %s", async (_description, cancelAt) => {
      const user = makeProUser({
        stripeSubscriptionId: "sub_test_missing_cancel_at",
      });
      stripe.subscriptions.retrieve.mockResolvedValue({
        ...makeStripeSubscription({
          cancelAtPeriodEnd: true,
          id: "sub_test_missing_cancel_at",
        }),
        cancel_at: cancelAt,
      });

      await expect(getCanceledSubscriptionNotice(user)).resolves.toEqual({
        subscriptionId: "sub_test_missing_cancel_at",
        periodEndUnix: null,
      });

      expect(stripe.subscriptions.retrieve).toHaveBeenCalledTimes(1);
      expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith(
        "sub_test_missing_cancel_at",
      );
    });

    it("returns null when the cancellation time is in the past", async () => {
      jest
        .useFakeTimers()
        .setSystemTime(new Date("2031-01-01T00:00:00.000Z").getTime());
      const cancelAt = 1_900_000_000;
      const user = makeProUser({
        stripeSubscriptionId: "sub_test_past",
      });
      stripe.subscriptions.retrieve.mockResolvedValue({
        ...makeStripeSubscription({
          cancelAtPeriodEnd: true,
          id: "sub_test_past",
        }),
        cancel_at: cancelAt,
      });

      await expect(getCanceledSubscriptionNotice(user)).resolves.toBeNull();

      expect(stripe.subscriptions.retrieve).toHaveBeenCalledTimes(1);
      expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith(
        "sub_test_past",
      );
    });

    it("returns null when retrieving the subscription fails", async () => {
      const user = makeProUser({
        stripeSubscriptionId: "sub_test_error",
      });
      stripe.subscriptions.retrieve.mockRejectedValue(
        new Error("Stripe unavailable"),
      );

      await expect(getCanceledSubscriptionNotice(user)).resolves.toBeNull();

      expect(stripe.subscriptions.retrieve).toHaveBeenCalledTimes(1);
      expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith(
        "sub_test_error",
      );
    });
  });
});
