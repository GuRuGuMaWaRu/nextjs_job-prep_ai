jest.mock("@core/features/interviews/db", () => ({
  insertInterviewDb: jest.fn(),
}));

import { InterviewTable } from "@/core/drizzle/schema";
import { insertInterviewDb } from "@core/features/interviews/db";

import { createTestInterview } from "./createTestInterview";

const mockInsertInterviewDb = jest.mocked(insertInterviewDb);

describe("createTestInterview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps the explicit job info id when overrides contain another id", async () => {
    const overrides: Partial<typeof InterviewTable.$inferInsert> = {
      jobInfoId: "other-job-info",
      duration: "10m",
    };

    await createTestInterview("expected-job-info", overrides);

    expect(mockInsertInterviewDb).toHaveBeenCalledWith({
      duration: "10m",
      humeChatId: "e2e-completed-interview",
      jobInfoId: "expected-job-info",
    });
  });

  it("adds seed context when the database insert fails", async () => {
    const cause = new Error("insert failed");
    mockInsertInterviewDb.mockRejectedValueOnce(cause);

    await expect(createTestInterview("job-info-1")).rejects.toMatchObject({
      message: 'Failed to seed interview for job info "job-info-1".',
      cause,
    });
  });
});
