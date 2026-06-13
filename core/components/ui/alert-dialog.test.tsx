import userEvent from "@testing-library/user-event";

import { render, screen, waitFor } from "@/core/test-utils/render";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";

type ConfirmDeleteDialogProps = {
  defaultOpen?: boolean;
  onConfirm?: () => void;
};

function ConfirmDeleteDialog({
  defaultOpen = false,
  onConfirm = jest.fn(),
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button">Delete interview</Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="custom-content">
        <AlertDialogHeader className="custom-header">
          <AlertDialogTitle className="custom-title">
            Delete this interview?
          </AlertDialogTitle>
          <AlertDialogDescription className="custom-description">
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="custom-footer">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe("AlertDialog", () => {
  describe("composition and prop forwarding", () => {
    it("forwards overlay props when composed through the portal", () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogPortal>
            <AlertDialogOverlay className="custom-overlay" />
          </AlertDialogPortal>
        </AlertDialog>,
      );

      const overlay = document.querySelector(
        "[data-slot='alert-dialog-overlay']",
      );

      expect(overlay).toHaveClass("custom-overlay");
    });

    it("renders dialog sections with slot attributes and custom classes", () => {
      render(<ConfirmDeleteDialog defaultOpen />);

      const trigger = document.querySelector(
        "[data-slot='alert-dialog-trigger']",
      );
      const dialog = screen.getByRole("alertdialog");
      const title = screen.getByText("Delete this interview?");
      const description = screen.getByText("This action cannot be undone.");
      const header = title.parentElement;
      const footer = screen.getByRole("button", {
        name: "Cancel",
      }).parentElement;
      const overlay = document.querySelector(
        "[data-slot='alert-dialog-overlay']",
      );

      expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
      expect(overlay).toHaveAttribute("data-slot", "alert-dialog-overlay");
      expect(dialog).toHaveAttribute("data-slot", "alert-dialog-content");
      expect(dialog).toHaveClass("custom-content");
      expect(header).toHaveAttribute("data-slot", "alert-dialog-header");
      expect(header).toHaveClass("custom-header");
      expect(title).toHaveAttribute("data-slot", "alert-dialog-title");
      expect(title).toHaveClass("custom-title");
      expect(description).toHaveAttribute(
        "data-slot",
        "alert-dialog-description",
      );
      expect(description).toHaveClass("custom-description");
      expect(footer).toHaveAttribute("data-slot", "alert-dialog-footer");
      expect(footer).toHaveClass("custom-footer");
    });
  });

  describe("interactions", () => {
    it("opens from the trigger", async () => {
      const user = userEvent.setup();

      render(<ConfirmDeleteDialog />);

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "Delete interview" }),
      );

      expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText("Delete this interview?")).toBeVisible();
      expect(screen.getByText("This action cannot be undone.")).toBeVisible();
    });

    it("dismisses from cancel without confirming", async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();

      render(<ConfirmDeleteDialog onConfirm={onConfirm} />);

      await user.click(
        screen.getByRole("button", { name: "Delete interview" }),
      );
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("runs the confirm action once and closes", async () => {
      const user = userEvent.setup();
      const onConfirm = jest.fn();

      render(<ConfirmDeleteDialog onConfirm={onConfirm} />);

      await user.click(
        screen.getByRole("button", { name: "Delete interview" }),
      );
      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(onConfirm).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("uses the title as its name and associates the description", () => {
      render(<ConfirmDeleteDialog defaultOpen />);

      expect(
        screen.getByRole("alertdialog", {
          name: "Delete this interview?",
          description: "This action cannot be undone.",
        }),
      ).toBeInTheDocument();
    });
  });
});
