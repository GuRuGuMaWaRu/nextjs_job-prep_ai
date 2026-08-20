jest.mock("@/core/features/resumeAnalysis/service", () => ({
  checkResumeAnalysisPermissionService: jest.fn(),
}));

import { canAnalyzeResumeAction } from "@/core/features/resumeAnalysis/actions";
import { checkResumeAnalysisPermissionService } from "@/core/features/resumeAnalysis/service";

const mockCheckResumeAnalysisPermissionService = jest.mocked(
  checkResumeAnalysisPermissionService,
);

describe("resume analysis actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("checks resume analysis permission through the service", async () => {
    mockCheckResumeAnalysisPermissionService.mockResolvedValue(false);

    await expect(canAnalyzeResumeAction()).resolves.toBe(false);

    expect(mockCheckResumeAnalysisPermissionService).toHaveBeenCalledWith();
  });

  it("bubbles permission check failures", async () => {
    const error = new Error("permission");
    mockCheckResumeAnalysisPermissionService.mockRejectedValue(error);

    await expect(canAnalyzeResumeAction()).rejects.toBe(error);
  });
});
