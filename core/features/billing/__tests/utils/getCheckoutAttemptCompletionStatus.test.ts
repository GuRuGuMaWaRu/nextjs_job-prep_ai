import { getCheckoutAttemptCompletionState } from "../../utils/getCheckoutAttemptCompletionState";

type SessionFields = Parameters<typeof getCheckoutAttemptCompletionState>[0];

describe("getCheckoutAttemptCompletionState", () => {
  it.each([
    {
      status: "open",
      payment_status: "no_payment_required",
    },
    {
      status: "open",
      payment_status: "paid",
    },
    {
      status: "open",
      payment_status: "unpaid",
    },
    { status: null, payment_status: "no_payment_required" },
    { status: null, payment_status: "paid" },
    { status: null, payment_status: "unpaid" },
    {
      status: "expired",
      payment_status: "no_payment_required",
    },
    {
      status: "expired",
      payment_status: "paid",
    },
    {
      status: "expired",
      payment_status: "unpaid",
    },
  ] satisfies SessionFields[])(
    "returns NULL when a session status is '$status'",
    (session) => {
      const result = getCheckoutAttemptCompletionState({
        status: session.status,
        payment_status: session.payment_status,
      });

      expect(result).toBeNull();
    },
  );

  it("returns 'payment_pending' when session status is 'complete' and session payment status is 'unpaid'", () => {
    const result = getCheckoutAttemptCompletionState({
      status: "complete",
      payment_status: "unpaid",
    });

    expect(result).toEqual("payment_pending");
  });

  it.each([
    ["complete", "paid"],
    ["complete", "no_payment_required"],
  ] as const)(
    "returns 'completed' when session status is '%s' and session payment status is `%s`",
    (status, payment_status) => {
      const result = getCheckoutAttemptCompletionState({
        status,
        payment_status,
      });

      expect(result).toEqual("completed");
    },
  );
});
