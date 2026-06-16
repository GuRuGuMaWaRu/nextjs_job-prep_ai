import userEvent from "@testing-library/user-event";

import { render, screen, waitFor } from "@/core/test-utils/render";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

type ExperienceLevelSelectProps = {
  defaultOpen?: boolean;
  defaultValue?: string;
};

function ExperienceLevelSelect({
  defaultOpen = false,
  defaultValue,
}: ExperienceLevelSelectProps) {
  return (
    <Select defaultOpen={defaultOpen} defaultValue={defaultValue}>
      <SelectTrigger className="custom-trigger" aria-label="Experience level">
        <SelectValue placeholder="Pick a level" />
      </SelectTrigger>
      <SelectContent className="custom-content">
        <SelectGroup>
          <SelectLabel className="custom-label">Levels</SelectLabel>
          <SelectItem value="junior" className="custom-item">
            Junior
          </SelectItem>
          <SelectItem value="senior">Senior</SelectItem>
        </SelectGroup>
        <SelectSeparator className="custom-separator" />
      </SelectContent>
    </Select>
  );
}

describe("Select", () => {
  describe("composition and prop forwarding", () => {
    it("renders wrappers with slot attributes and custom classes", () => {
      render(<ExperienceLevelSelect defaultOpen defaultValue="junior" />);

      const trigger = document.querySelector("[data-slot='select-trigger']");
      const value = document.querySelector("[data-slot='select-value']");
      const content = screen.getByRole("listbox");
      const group = document.querySelector("[data-slot='select-group']");
      const label = screen.getByText("Levels");
      const item = screen.getByRole("option", { name: "Junior" });
      const separator = document.querySelector(
        "[data-slot='select-separator']",
      );

      expect(trigger).toHaveAttribute("data-slot", "select-trigger");
      expect(trigger).toHaveAttribute("data-size", "default");
      expect(trigger).toHaveClass("custom-trigger");
      expect(value).toHaveAttribute("data-slot", "select-value");
      expect(content).toHaveAttribute("data-slot", "select-content");
      expect(content).toHaveClass("custom-content");
      expect(group).toHaveAttribute("data-slot", "select-group");
      expect(label).toHaveAttribute("data-slot", "select-label");
      expect(label).toHaveClass("custom-label");
      expect(item).toHaveAttribute("data-slot", "select-item");
      expect(item).toHaveClass("custom-item");
      expect(separator).toHaveAttribute("data-slot", "select-separator");
      expect(separator).toHaveClass("custom-separator");
    });

    it("forwards the small trigger size to its data attribute", () => {
      render(
        <Select>
          <SelectTrigger size="sm" aria-label="Experience level">
            <SelectValue placeholder="Pick a level" />
          </SelectTrigger>
        </Select>,
      );

      expect(
        screen.getByRole("combobox", { name: "Experience level" }),
      ).toHaveAttribute("data-size", "sm");
    });

    it("supports item-aligned content positioning", () => {
      render(
        <Select defaultOpen defaultValue="senior">
          <SelectTrigger aria-label="Experience level">
            <SelectValue placeholder="Pick a level" />
          </SelectTrigger>
          <SelectContent position="item-aligned">
            <SelectItem value="senior">Senior</SelectItem>
          </SelectContent>
        </Select>,
      );

      expect(screen.getByRole("listbox")).toHaveAttribute(
        "data-slot",
        "select-content",
      );
    });

    it("exports scroll buttons for composed select content", () => {
      expect(SelectScrollDownButton).toEqual(expect.any(Function));
      expect(SelectScrollUpButton).toEqual(expect.any(Function));
    });
  });

  describe("interactions", () => {
    it("opens from the trigger and selects an option", async () => {
      const user = userEvent.setup();

      render(<ExperienceLevelSelect />);

      const trigger = screen.getByRole("combobox", {
        name: "Experience level",
      });

      expect(trigger).toHaveTextContent("Pick a level");

      await user.click(trigger);
      await user.click(await screen.findByRole("option", { name: "Senior" }));

      await waitFor(() => {
        expect(trigger).toHaveTextContent("Senior");
      });
    });
  });

  describe("accessibility", () => {
    it("uses the trigger aria-label as its accessible name", () => {
      render(<ExperienceLevelSelect />);

      expect(
        screen.getByRole("combobox", { name: "Experience level" }),
      ).toBeInTheDocument();
    });

    it("exposes options when opened", async () => {
      const user = userEvent.setup();

      render(<ExperienceLevelSelect />);

      await user.click(
        screen.getByRole("combobox", { name: "Experience level" }),
      );

      expect(
        await screen.findByRole("option", { name: "Junior" }),
      ).toHaveTextContent("Junior");
      expect(screen.getByRole("option", { name: "Senior" })).toHaveTextContent(
        "Senior",
      );
    });
  });
});
