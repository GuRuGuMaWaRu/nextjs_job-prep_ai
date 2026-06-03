jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("@/core/features/jobInfos/actions", () => ({
  createJobInfoAction: jest.fn(),
  updateJobInfoAction: jest.fn(),
}));

import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { routes } from "@/core/data/routes";
import {
  createJobInfoAction,
  updateJobInfoAction,
} from "@/core/features/jobInfos/actions";
import { render, screen, waitFor } from "@/core/test-utils/render";

import { JobInfoForm } from "./JobInfoForm";

const mockCreateJobInfoAction = jest.mocked(createJobInfoAction);
const mockUpdateJobInfoAction = jest.mocked(updateJobInfoAction);
const mockToast = jest.mocked(toast);
const mockUseRouter = jest.mocked(useRouter);
const mockPush = jest.fn();

const validJobInfoInput = {
  name: "Frontend prep",
  title: "Senior Frontend Engineer",
  experienceLevel: "junior",
  description: "React and Next.js interview preparation.",
} as const;

function mockRouter() {
  mockUseRouter.mockReturnValue({
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    push: mockPush,
    refresh: jest.fn(),
    replace: jest.fn(),
  });
}

async function fillRequiredFields() {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText("Name"), validJobInfoInput.name);
  await user.type(screen.getByLabelText("Job Title"), validJobInfoInput.title);
  await user.type(
    screen.getByLabelText("Description"),
    validJobInfoInput.description,
  );

  return user;
}

describe("JobInfoForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter();
  });

  it("renders empty defaults for a new job info and submits valid data to createJobInfoAction", async () => {
    mockCreateJobInfoAction.mockResolvedValue({
      success: true,
      data: { id: "job-info-new" },
    });

    render(<JobInfoForm />);

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Job Title")).toHaveValue("");
    expect(
      screen.getByRole("combobox", { name: "Experience Level" }),
    ).toHaveTextContent("Junior");
    expect(screen.getByLabelText("Description")).toHaveValue("");

    const user = await fillRequiredFields();
    await user.click(
      screen.getByRole("button", { name: "Save Job Information" }),
    );

    await waitFor(() => {
      expect(mockCreateJobInfoAction).toHaveBeenCalledWith(validJobInfoInput);
    });
    expect(mockUpdateJobInfoAction).not.toHaveBeenCalled();
  });

  it("renders existing job info and submits edits to updateJobInfoAction with the job id", async () => {
    mockUpdateJobInfoAction.mockResolvedValue({
      success: true,
      data: { id: "job-info-existing" },
    });

    render(
      <JobInfoForm
        jobInfo={{
          id: "job-info-existing",
          name: "Backend prep",
          title: "Platform Engineer",
          experienceLevel: "senior",
          description: "Systems design interview prep.",
        }}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Backend prep");
    expect(screen.getByLabelText("Job Title")).toHaveValue("Platform Engineer");
    expect(
      screen.getByRole("combobox", { name: "Experience Level" }),
    ).toHaveTextContent("Senior");
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Systems design interview prep.",
    );

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), validJobInfoInput.name);
    await user.clear(screen.getByLabelText("Job Title"));
    await user.type(
      screen.getByLabelText("Job Title"),
      validJobInfoInput.title,
    );
    await user.clear(screen.getByLabelText("Description"));
    await user.type(
      screen.getByLabelText("Description"),
      validJobInfoInput.description,
    );
    await user.click(
      screen.getByRole("button", { name: "Save Job Information" }),
    );

    await waitFor(() => {
      expect(mockUpdateJobInfoAction).toHaveBeenCalledWith(
        "job-info-existing",
        {
          ...validJobInfoInput,
          experienceLevel: "senior",
        },
      );
    });
    expect(mockCreateJobInfoAction).not.toHaveBeenCalled();
  });

  it("does not call server actions and shows validation feedback when required fields are invalid", async () => {
    render(<JobInfoForm />);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Save Job Information" }),
    );

    expect(mockCreateJobInfoAction).not.toHaveBeenCalled();
    expect(mockUpdateJobInfoAction).not.toHaveBeenCalled();
    expect(await screen.findAllByText("Required")).toHaveLength(2);
  });

  it("shows toast.error and does not navigate when the action fails", async () => {
    mockCreateJobInfoAction.mockResolvedValue({
      success: false,
      message: "Unable to save job info.",
    });

    render(<JobInfoForm />);

    const user = await fillRequiredFields();
    await user.click(
      screen.getByRole("button", { name: "Save Job Information" }),
    );

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Unable to save job info.");
    });
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows toast.success, resets the form, and routes to the saved job info when the action succeeds", async () => {
    mockCreateJobInfoAction.mockResolvedValue({
      success: true,
      data: { id: "job-info-created" },
    });

    render(<JobInfoForm />);

    const user = await fillRequiredFields();
    await user.click(
      screen.getByRole("button", { name: "Save Job Information" }),
    );

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        "Job information created!",
      );
    });
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Job Title")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
    expect(mockPush).toHaveBeenCalledWith(routes.jobInfo("job-info-created"));
  });
});
