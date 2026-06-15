jest.mock("./actions", () => ({
  revalidateUpgradePage: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

import { useRouter } from "next/navigation";

import { render, waitFor } from "@/core/test-utils/render";

import { RevalidateOnStripeReturn } from "./_RevalidateOnStripeReturn";
import { revalidateUpgradePage } from "./actions";

const mockRevalidateUpgradePage = jest.mocked(revalidateUpgradePage);
const mockUseRouter = jest.mocked(useRouter);
const mockRefresh = jest.fn();

function mockRouter(): void {
  mockUseRouter.mockReturnValue({
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    push: jest.fn(),
    refresh: mockRefresh,
    replace: jest.fn(),
  });
}

describe("RevalidateOnStripeReturn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter();
    mockRevalidateUpgradePage.mockResolvedValue();
  });

  it("does not revalidate or refresh without Stripe return flags", () => {
    render(
      <RevalidateOnStripeReturn
        success={false}
        canceled={false}
        canceledSubscription={false}
      />,
    );

    expect(mockRevalidateUpgradePage).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it.each([
    [
      "success",
      { success: true, canceled: false, canceledSubscription: false },
    ],
    [
      "canceled",
      { success: false, canceled: true, canceledSubscription: false },
    ],
    [
      "canceled subscription",
      { success: false, canceled: false, canceledSubscription: true },
    ],
  ])("revalidates and refreshes after a %s return", async (_name, props) => {
    let settleRevalidation: (() => void) | undefined;
    mockRevalidateUpgradePage.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        settleRevalidation = resolve;
      }),
    );

    render(<RevalidateOnStripeReturn {...props} />);

    await waitFor(() => {
      expect(mockRevalidateUpgradePage).toHaveBeenCalledTimes(1);
    });
    expect(mockRefresh).not.toHaveBeenCalled();

    settleRevalidation?.();

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("logs revalidation failures and still refreshes", async () => {
    const error = new Error("cache unavailable");
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      mockRevalidateUpgradePage.mockRejectedValueOnce(error);

      render(
        <RevalidateOnStripeReturn
          success
          canceled={false}
          canceledSubscription={false}
        />,
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "revalidateUpgradePage failed:",
          error,
        );
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("runs revalidation only once across rerenders", async () => {
    const { rerender } = render(
      <RevalidateOnStripeReturn
        success
        canceled={false}
        canceledSubscription={false}
      />,
    );

    await waitFor(() => {
      expect(mockRevalidateUpgradePage).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    rerender(
      <RevalidateOnStripeReturn
        success={false}
        canceled
        canceledSubscription={false}
      />,
    );

    expect(mockRevalidateUpgradePage).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
