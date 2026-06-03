jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("@/core/features/jobInfos/actions", () => ({
  removeJobInfoAction: jest.fn(),
}));

import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { routes } from "@/core/data/routes";
import { JobInfoTable } from "@/core/drizzle/schema";
import { removeJobInfoAction } from "@/core/features/jobInfos/actions";
import { render, screen, waitFor } from "@/core/test-utils/render";

import { JobInfoCard } from "./JobInfoCard";

const mockRemoveJobInfoAction = jest.mocked(removeJobInfoAction);
const mockToast = jest.mocked(toast);

function buildJobInfo(
  overrides: Partial<typeof JobInfoTable.$inferSelect> = {},
) {
  return {
    id: "job-info-1",
    title: "Senior Frontend Engineer",
    name: "Frontend interview prep",
    experienceLevel: "mid-level",
    description: "Practice React, TypeScript, and system design questions.",
    userId: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  } satisfies typeof JobInfoTable.$inferSelect;
}

describe("JobInfoCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the job info name, formatted experience level, and title when present", () => {
    render(<JobInfoCard jobInfo={buildJobInfo()} />);

    expect(screen.getByText("Frontend interview prep")).toBeInTheDocument();
    expect(screen.getByText("Mid-Level")).toBeInTheDocument();
    expect(screen.getByText("Senior Frontend Engineer")).toBeInTheDocument();
  });

  it("does not render the title badge when title is null or empty", () => {
    const { rerender } = render(
      <JobInfoCard jobInfo={buildJobInfo({ title: null })} />,
    );

    expect(
      screen.queryByText("Senior Frontend Engineer"),
    ).not.toBeInTheDocument();

    rerender(<JobInfoCard jobInfo={buildJobInfo({ title: "" })} />);

    expect(
      screen.queryByText("Senior Frontend Engineer"),
    ).not.toBeInTheDocument();
  });

  it("renders view and delete actions for the job info", () => {
    const jobInfo = buildJobInfo();

    render(<JobInfoCard jobInfo={jobInfo} />);

    expect(screen.getByRole("link", { name: "View job info" })).toHaveAttribute(
      "href",
      routes.jobInfo(jobInfo.id),
    );
    expect(
      screen.getByRole("button", { name: "Delete job info" }),
    ).toBeInTheDocument();
  });

  it("shows a confirmation dialog and cancels without removing the job info", async () => {
    render(<JobInfoCard jobInfo={buildJobInfo()} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete job info" }));

    expect(
      screen.getByRole("alertdialog", { name: "Are you sure?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Deleting this Job Info will also remove all related interviews and questions.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockRemoveJobInfoAction).not.toHaveBeenCalled();
  });

  it("confirms removal and shows a success toast when the action succeeds", async () => {
    const jobInfo = buildJobInfo();
    mockRemoveJobInfoAction.mockResolvedValue({
      success: true,
      data: jobInfo,
    });

    render(<JobInfoCard jobInfo={jobInfo} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete job info" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));

    await waitFor(() => {
      expect(mockRemoveJobInfoAction).toHaveBeenCalledWith(jobInfo.id);
    });
    expect(mockToast.success).toHaveBeenCalledWith(
      'Job info for "Frontend interview prep" removed successfully',
    );
  });

  it("confirms removal and shows an error toast when the action fails", async () => {
    mockRemoveJobInfoAction.mockResolvedValue({
      success: false,
      message: "Unable to remove job info.",
    });

    render(<JobInfoCard jobInfo={buildJobInfo()} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete job info" }));
    await user.click(screen.getByRole("button", { name: "Yes" }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Unable to remove job info.",
      );
    });
    expect(mockToast.success).not.toHaveBeenCalled();
  });
});
