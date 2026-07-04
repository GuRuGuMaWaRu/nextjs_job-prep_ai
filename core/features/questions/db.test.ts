jest.mock("@/core/drizzle/db", () => {
  const { createMockDrizzleDb } = jest.requireActual(
    "@/core/test-utils/mocks/db",
  );

  return { db: createMockDrizzleDb() };
});

jest.mock("@/core/features/questions/dbCache", () => ({
  revalidateQuestionCache: jest.fn(),
}));

import { db } from "@/core/drizzle/db";
import { revalidateQuestionCache } from "@/core/features/questions/dbCache";
import {
  createDrizzleMutationChainMock,
  MockDrizzleDb,
} from "@/core/test-utils/mocks/db";

import { tryInsertQuestionDb } from "./db";

function getMockDb(): MockDrizzleDb {
  // The module is replaced with MockDrizzleDb above; isolate the test boundary cast.
  return db as unknown as MockDrizzleDb;
}

const mockDb = getMockDb();
const mockRevalidateQuestionCache = jest.mocked(revalidateQuestionCache);

describe("tryInsertQuestionDb", () => {
  const userId = "00000000-0000-4000-8000-000000000001";
  const question = {
    text: "How do you serialize quota reservations?",
    jobInfoId: "00000000-0000-4000-8000-000000000101",
    difficulty: "medium" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation(async (callback) => callback(mockDb));
  });

  it("locks the user and returns null without inserting at the limit", async () => {
    const lockQuery = createDrizzleMutationChainMock([]);
    const countQuery = createDrizzleMutationChainMock([{ count: 10 }]);
    mockDb.select
      .mockReturnValueOnce(lockQuery)
      .mockReturnValueOnce(countQuery);

    await expect(
      tryInsertQuestionDb({ userId, question, limit: 10 }),
    ).resolves.toBeNull();

    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
    expect(lockQuery.for).toHaveBeenCalledWith("update");
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockRevalidateQuestionCache).not.toHaveBeenCalled();
  });

  it("inserts and revalidates below the limit", async () => {
    const inserted = { id: "question-id", jobInfoId: question.jobInfoId };
    const lockQuery = createDrizzleMutationChainMock([]);
    const countQuery = createDrizzleMutationChainMock([{ count: 9 }]);
    const insertQuery = createDrizzleMutationChainMock([inserted]);
    mockDb.select
      .mockReturnValueOnce(lockQuery)
      .mockReturnValueOnce(countQuery);
    mockDb.insert.mockReturnValueOnce(insertQuery);

    await expect(
      tryInsertQuestionDb({ userId, question, limit: 10 }),
    ).resolves.toEqual(inserted);

    expect(lockQuery.for).toHaveBeenCalledWith("update");
    expect(insertQuery.values).toHaveBeenCalledWith(question);
    expect(mockRevalidateQuestionCache).toHaveBeenCalledWith(inserted);
  });
});
