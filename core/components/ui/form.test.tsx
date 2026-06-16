import { useForm } from "react-hook-form";
import userEvent from "@testing-library/user-event";

import { render, screen, waitFor } from "@/core/test-utils/render";

import { Button } from "./button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "./form";
import { Input } from "./input";

type TestFormValues = {
  title: string;
};

function RequiredTitleForm() {
  const form = useForm<TestFormValues>({
    defaultValues: {
      title: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(jest.fn())}>
        <FormField
          control={form.control}
          name="title"
          rules={{ required: "Title is required." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Shown on generated interviews.</FormDescription>
              <FormMessage>Use the exact role name.</FormMessage>
            </FormItem>
          )}
        />

        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}

function OptionalMessageForm() {
  const form = useForm<TestFormValues>({
    defaultValues: {
      title: "",
    },
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Job title</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

function EmptyValidationErrorForm() {
  const form = useForm<TestFormValues>({
    defaultValues: {
      title: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          form.setError("title", { type: "manual", message: "" });
        }}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="custom-form-item">
              <FormLabel>Job title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}

function UndefinedValidationErrorForm() {
  const form = useForm<TestFormValues>({
    defaultValues: {
      title: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          form.setError("title", { type: "manual" });
        }}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Save</Button>
      </form>
    </Form>
  );
}

function FieldNameProbe() {
  const { name } = useFormField();

  return <span>{name}</span>;
}

function HookProbeForm() {
  const form = useForm<TestFormValues>({
    defaultValues: {
      title: "",
    },
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="title"
        render={() => (
          <FormItem>
            <FieldNameProbe />
          </FormItem>
        )}
      />
    </Form>
  );
}

function LabelWithoutFieldForm() {
  const form = useForm<TestFormValues>({
    defaultValues: {
      title: "",
    },
  });

  return (
    <Form {...form}>
      <FormItem>
        <FormLabel>Job title</FormLabel>
      </FormItem>
    </Form>
  );
}

describe("Form", () => {
  it("connects labels, descriptions, and fallback messages to the form control", () => {
    render(<RequiredTitleForm />);

    const input = screen.getByRole("textbox", { name: "Job title" });
    const description = screen.getByText("Shown on generated interviews.");
    const message = screen.getByText("Use the exact role name.");

    expect(input).toHaveAccessibleDescription("Shown on generated interviews.");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).toHaveAttribute("aria-describedby", description.id);
    expect(input).not.toHaveAttribute("aria-describedby", message.id);
  });

  it("replaces fallback message text with validation errors and marks the control invalid", async () => {
    const user = userEvent.setup();

    render(<RequiredTitleForm />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    const input = screen.getByRole("textbox", { name: "Job title" });
    const description = screen.getByText("Shown on generated interviews.");
    const errorMessage = await screen.findByText("Title is required.");

    await waitFor(() => {
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    expect(input).toHaveAccessibleDescription(
      "Shown on generated interviews. Title is required.",
    );
    expect(input).toHaveAttribute(
      "aria-describedby",
      `${description.id} ${errorMessage.id}`,
    );
    expect(
      screen.queryByText("Use the exact role name."),
    ).not.toBeInTheDocument();
  });

  it("does not render an empty message when the field has no error", () => {
    render(<OptionalMessageForm />);

    expect(screen.getByRole("textbox", { name: "Job title" })).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    expect(document.querySelector("[data-slot='form-message']")).toBeNull();
  });

  describe("FormMessage", () => {
    it("renders nothing when the validation error message is empty", async () => {
      const user = userEvent.setup();

      render(<EmptyValidationErrorForm />);

      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(
          screen.getByRole("textbox", { name: "Job title" }),
        ).toHaveAttribute("aria-invalid", "true");
      });

      expect(document.querySelector("[data-slot='form-message']")).toBeNull();
    });

    it("renders nothing when the validation error message is undefined", async () => {
      const user = userEvent.setup();

      render(<UndefinedValidationErrorForm />);

      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(
          screen.getByRole("textbox", { name: "Job title" }),
        ).toHaveAttribute("aria-invalid", "true");
      });

      expect(document.querySelector("[data-slot='form-message']")).toBeNull();
    });
  });

  describe("FormLabel", () => {
    it("marks the label as errored when the field is invalid", async () => {
      const user = userEvent.setup();

      render(<RequiredTitleForm />);

      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => {
        expect(screen.getByText("Job title")).toHaveAttribute(
          "data-error",
          "true",
        );
      });
    });

    it("does not mark the label as errored when the field is valid", () => {
      render(<RequiredTitleForm />);

      expect(screen.getByText("Job title")).toHaveAttribute(
        "data-error",
        "false",
      );
    });
  });

  describe("FormItem", () => {
    it("forwards className and exposes the form-item slot", () => {
      render(<EmptyValidationErrorForm />);

      const item = document.querySelector("[data-slot='form-item']");

      expect(item).toHaveAttribute("data-slot", "form-item");
      expect(item).toHaveClass("custom-form-item");
    });
  });

  describe("useFormField", () => {
    it("exposes the current field context to composed children", () => {
      render(<HookProbeForm />);

      expect(screen.getByText("title")).toBeInTheDocument();
    });

    it("throws a clear error when used outside FormField", () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(jest.fn());

      expect(() => render(<LabelWithoutFieldForm />)).toThrow(
        "useFormField should be used within <FormField>",
      );

      consoleError.mockRestore();
    });
  });
});
