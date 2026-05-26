jest.mock("sonner", () => ({
  toast: {
    dismiss: jest.fn(),
    error: jest.fn(),
  },
}));

import { fireEvent, render, screen } from "@testing-library/react";
import { isValidElement } from "react";
import { toast } from "sonner";

import { routes } from "@core/data/routes";
import {
  errorToast,
  FILE_SIZE_TOO_LARGE_MESSAGE,
  FILE_TYPE_NOT_SUPPORTED_MESSAGE,
  HUME_UNAVAILABLE_MESSAGE,
  PLAN_LIMIT_MESSAGE,
  RATE_LIMIT_MESSAGE,
} from "./errorToast";

const mockToast = jest.mocked(toast);

describe("errorToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.error.mockReturnValue("toast-id");
  });

  it("shows an upgrade action for plan limit errors and dismisses the toast when clicked", async () => {
    await errorToast(PLAN_LIMIT_MESSAGE);

    expect(mockToast.error).toHaveBeenCalledWith(
      "You have reached your plan limit.",
      {
        action: expect.any(Object),
      },
    );

    const options = mockToast.error.mock.calls[0][1];
    const action = options?.action;

    expect(isValidElement(action)).toBe(true);

    if (!isValidElement(action)) {
      throw new Error("Expected plan limit toast action to be a React element");
    }

    render(action);

    const upgradeLink = screen.getByRole("link", { name: "Upgrade" });
    expect(upgradeLink).toHaveAttribute("href", routes.upgrade);

    fireEvent.click(upgradeLink);

    expect(mockToast.dismiss).toHaveBeenCalledWith("toast-id");
  });

  it.each([
    [
      RATE_LIMIT_MESSAGE,
      "Whoa! Slow down.",
      "You are making too many requests. Please try again later.",
    ],
    [
      HUME_UNAVAILABLE_MESSAGE,
      "Ooopsie!",
      "Interviews are currently unavailable due to overwhelming demand.",
    ],
    [
      FILE_SIZE_TOO_LARGE_MESSAGE,
      "File size is too large",
      "Please upload a file smaller than 10MB.",
    ],
    [
      FILE_TYPE_NOT_SUPPORTED_MESSAGE,
      "File type not supported",
      "Please upload a file with a supported type.",
    ],
  ])("shows the mapped toast for %s", async (message, title, description) => {
    await errorToast(message);

    expect(mockToast.error).toHaveBeenCalledWith(title, { description });
    expect(mockToast.dismiss).not.toHaveBeenCalled();
  });

  it("falls back to the raw message for unknown errors", async () => {
    const message = "Something went wrong";

    await errorToast(message);

    expect(mockToast.error).toHaveBeenCalledWith(message);
    expect(mockToast.dismiss).not.toHaveBeenCalled();
  });
});
