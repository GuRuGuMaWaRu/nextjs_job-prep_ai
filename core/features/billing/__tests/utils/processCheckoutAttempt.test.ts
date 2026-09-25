jest.mock("@/core/features/billing/utils/recordCheckoutCompleted", () => ({
  recordCheckoutCompleted: jest.fn(),
}));
jest.mock("@/core/features/billing/utils/recordCheckoutPaymentPending", () => ({
  recordCheckoutPaymentPending: jest.fn(),
}));

import { recordCheckoutCompleted } from "@/core/features/billing/utils/recordCheckoutCompleted";
import { recordCheckoutPaymentPending } from "@/core/features/billing/utils/recordCheckoutPaymentPending";
import {
  makeStripeSession,
  makeCheckoutAttempt,
} from "@/core/test-utils/factories";

import { processCheckoutAttempt } from "../../utils/processCheckoutAttempt";

const mockRecordCheckoutCompleted = jest.mocked(recordCheckoutCompleted);
const mockRecordCheckoutPending = jest.mocked(recordCheckoutPaymentPending);

describe("processCheckoutAttempt", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns NULL if there is no 'checkoutAttemptId' in Session 'metadata'", async () => {
    const session = makeStripeSession({ metadata: {} });

    const result = await processCheckoutAttempt(session);

    expect(mockRecordCheckoutPending).not.toHaveBeenCalled();
    expect(mockRecordCheckoutCompleted).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("returns NULL if Session 'status' is not 'complete'", async () => {
    const session = makeStripeSession({
      metadata: { checkoutAttemptId: "attempt_A" },
      status: "open",
    });

    const result = await processCheckoutAttempt(session);

    expect(mockRecordCheckoutPending).not.toHaveBeenCalled();
    expect(mockRecordCheckoutCompleted).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("changes Checkout attempt 'status' to 'payment_pending' and returns the updated Checkout attempt when Session 'status' is 'complete' and Session 'payment_status' is 'unpaid'", async () => {
    const session = makeStripeSession({
      metadata: { checkoutAttemptId: "attempt_A" },
      status: "complete",
      payment_status: "unpaid",
    });
    const updatedCheckoutAttempt = makeCheckoutAttempt({
      id: "attempt_A",
      stripeSessionId: session.id,
      status: "payment_pending",
    });

    mockRecordCheckoutPending.mockResolvedValue(updatedCheckoutAttempt);

    const result = await processCheckoutAttempt(session);

    expect(mockRecordCheckoutCompleted).not.toHaveBeenCalled();
    expect(mockRecordCheckoutPending).toHaveBeenCalledTimes(1);
    expect(mockRecordCheckoutPending).toHaveBeenCalledWith({
      checkoutAttemptId: session.metadata?.checkoutAttemptId,
      stripeSessionId: session.id,
    });
    expect(result).toBe(updatedCheckoutAttempt);
  });

  it("changes Checkout attempt 'status' to 'completed' and returns the updated Checkout attempt when Session 'status' is 'complete' and Session 'payment_status' is 'paid'", async () => {
    const session = makeStripeSession({
      metadata: { checkoutAttemptId: "attempt_A" },
      status: "complete",
      payment_status: "paid",
    });
    const updatedCheckoutAttempt = makeCheckoutAttempt({
      id: "attempt_A",
      stripeSessionId: session.id,
      status: "completed",
    });

    mockRecordCheckoutCompleted.mockResolvedValue(updatedCheckoutAttempt);

    const result = await processCheckoutAttempt(session);

    expect(mockRecordCheckoutPending).not.toHaveBeenCalled();
    expect(mockRecordCheckoutCompleted).toHaveBeenCalledTimes(1);
    expect(mockRecordCheckoutCompleted).toHaveBeenCalledWith({
      checkoutAttemptId: session.metadata?.checkoutAttemptId,
      stripeSessionId: session.id,
    });
    expect(result).toBe(updatedCheckoutAttempt);
  });
});
