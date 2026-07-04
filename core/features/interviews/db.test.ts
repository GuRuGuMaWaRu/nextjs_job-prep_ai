jest.mock("@/core/drizzle/db", () => {
  const { createMockDrizzleDb } = jest.requireActual(
    "@/core/test-utils/mocks/db",
  );

  return { db: createMockDrizzleDb() };
});

jest.mock("@/core/features/interviews/dbCache", () => ({
  revalidateInterviewCache: jest.fn(),
}));

import { db } from "@/core/drizzle/db";
import { revalidateInterviewCache } from "@/core/features/interviews/dbCache";
import {
  createDrizzleMutationChainMock,
  MockDrizzleDb,
} from "@/core/test-utils/mocks/db";

import { tryInsertInterviewDb } from "./db";

function getMockDb(): MockDrizzleDb {
  // The module is replaced with MockDrizzleDb above; isolate the test boundary cast.
  return db as unknown as MockDrizzleDb;
}

const mockDb = getMockDb();
const mockRevalidateInterviewCache = jest.mocked(revalidateInterviewCache);

describe("tryInsertInterviewDb", () => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const interview = {
    jobInfoId: "00000000-0000-4000-8000-000000000101",
    duration: "00:00:00",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation(async (callback) => callback(mockDb));
  });

  it("locks the user and returns null without inserting at the limit", async () => {
    const lockQuery = createDrizzleMutationChainMock([]);
    const countQuery = createDrizzleMutationChainMock([{ count: 1 }]);
    mockDb.select
      .mockReturnValueOnce(lockQuery)
      .mockReturnValueOnce(countQuery);

    await expect(
      tryInsertInterviewDb({ userId, interview, limit: 1 }),
    ).resolves.toBeNull();

    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(lockQuery.for).toHaveBeenCalledWith("update");
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockRevalidateInterviewCache).not.toHaveBeenCalled();
  });

  it("inserts and revalidates below the limit", async () => {
    const inserted = { id: "interview-id", jobInfoId: interview.jobInfoId };
    const lockQuery = createDrizzleMutationChainMock([]);
    const countQuery = createDrizzleMutationChainMock([{ count: 0 }]);
    const insertQuery = createDrizzleMutationChainMock([inserted]);
    mockDb.select
      .mockReturnValueOnce(lockQuery)
      .mockReturnValueOnce(countQuery);
    mockDb.insert.mockReturnValueOnce(insertQuery);

    await expect(
      tryInsertInterviewDb({ userId, interview, limit: 1 }),
    ).resolves.toEqual(inserted);

    expect(lockQuery.for).toHaveBeenCalledWith("update");
    expect(insertQuery.values).toHaveBeenCalledWith(interview);
    expect(mockRevalidateInterviewCache).toHaveBeenCalledWith(inserted);
  });
});
