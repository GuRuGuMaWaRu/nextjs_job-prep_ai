jest.mock("@/core/lib/errorToast", () => ({
  errorToast: jest.fn(),
}));

jest.mock("sonner", () => ({
  Toaster: () => null,
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { errorToast } from "@/core/lib/errorToast";

import { render, screen, waitFor } from "@/core/test-utils/render";

import { ActionButton } from "./action-button";

const mockErrorToast = jest.mocked(errorToast);

function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => {
    throw new Error("Deferred promise resolved before initialization.");
  };

  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe("ActionButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs the action and forwards the click handler without confirmation", async () => {
    const user = userEvent.setup();
    const action = jest.fn().mockResolvedValue({ success: true });
    const onClick = jest.fn();

    render(
      <ActionButton
        action={action}
        aria-label="Archive job"
        onClick={onClick}
        successMessage="Archived"
      >
        Archive
      </ActionButton>,
    );

    await user.click(screen.getByRole("button", { name: "Archive job" }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledTimes(1);
    });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Archived");
  });

  it("shows an error toast when the action fails", async () => {
    const user = userEvent.setup();
    const action = jest
      .fn()
      .mockResolvedValue({ success: false, message: "Archive failed" });

    render(
      <ActionButton action={action} aria-label="Archive job">
        Archive
      </ActionButton>,
    );

    await user.click(screen.getByRole("button", { name: "Archive job" }));

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith("Archive failed");
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows a friendly rate limit toast when the action returns the rate limit message", async () => {
    const user = userEvent.setup();
    const action = jest
      .fn()
      .mockResolvedValue({ success: false, message: "RATE_LIMIT" });

    render(
      <ActionButton action={action} aria-label="Generate feedback">
        Generate Feedback
      </ActionButton>,
    );

    await user.click(screen.getByRole("button", { name: "Generate feedback" }));

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith("RATE_LIMIT");
    });
  });

  it("falls back to a generic error toast when the action fails without a message", async () => {
    const user = userEvent.setup();
    const action = jest.fn().mockResolvedValue({ success: false });

    render(
      <ActionButton action={action} aria-label="Archive job">
        Archive
      </ActionButton>,
    );

    await user.click(screen.getByRole("button", { name: "Archive job" }));

    await waitFor(() => {
      expect(mockErrorToast).toHaveBeenCalledWith("Error");
    });
  });

  it("keeps the confirmation dialog open while the action is pending", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<{ success: boolean }>();
    const action = jest.fn().mockReturnValue(deferred.promise);

    render(
      <ActionButton
        action={action}
        aria-label="Delete job"
        requireAreYouSure
        areYouSureDescription="Delete this saved job."
      >
        Delete
      </ActionButton>,
    );

    await user.click(screen.getByRole("button", { name: "Delete job" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    deferred.resolve({ success: true });

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });
});
