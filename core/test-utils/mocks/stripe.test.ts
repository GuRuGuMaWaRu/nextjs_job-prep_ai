import { createMockStripe } from "./stripe";

describe("createMockStripe", () => {
  it("returns jest.fn() instances for the surfaces the app consumes", () => {
    const stripe = createMockStripe();

    expect(jest.isMockFunction(stripe.webhooks.constructEvent)).toBe(true);
    expect(jest.isMockFunction(stripe.subscriptions.retrieve)).toBe(true);
  });

  it("records constructEvent arguments so tests can assert the call shape", () => {
    const stripe = createMockStripe();

    stripe.webhooks.constructEvent("raw-body", "sig-header", "whsec_test");

    expect(stripe.webhooks.constructEvent).toHaveBeenCalledTimes(1);
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      "raw-body",
      "sig-header",
      "whsec_test",
    );
  });

  it("returns a fresh set of mocks per call so tests don't share state", () => {
    const a = createMockStripe();
    const b = createMockStripe();

    expect(a.webhooks.constructEvent).not.toBe(b.webhooks.constructEvent);
    expect(a.subscriptions.retrieve).not.toBe(b.subscriptions.retrieve);
  });
});
