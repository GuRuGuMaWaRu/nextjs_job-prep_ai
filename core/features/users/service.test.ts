jest.mock("next/cache", () => ({
  cacheTag: jest.fn(),
}));

jest.mock("@/core/features/users/db", () => ({
  getUserByIdDb: jest.fn(),
}));

jest.mock("@/core/features/users/dbCache", () => ({
  getUserIdTag: jest.fn(),
}));

import { cacheTag } from "next/cache";

import { getUserByIdDb } from "@/core/features/users/db";
import { getUserIdTag } from "@/core/features/users/dbCache";
import { getUserService } from "@/core/features/users/service";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeUser } from "@/core/test-utils/factories";

const mockCacheTag = jest.mocked(cacheTag);
const mockGetUserByIdDb = jest.mocked(getUserByIdDb);
const mockGetUserIdTag = jest.mocked(getUserIdTag);

describe("user service", () => {
  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserIdTag.mockReturnValue(`id:${TEST_USER_ID}:users`);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns a user by id and marks the user cache tag", async () => {
    const user = makeUser({ id: TEST_USER_ID });
    mockGetUserByIdDb.mockResolvedValue(user);

    await expect(getUserService(TEST_USER_ID)).resolves.toBe(user);

    expect(mockGetUserIdTag).toHaveBeenCalledWith(TEST_USER_ID);
    expect(mockCacheTag).toHaveBeenCalledWith(`id:${TEST_USER_ID}:users`);
    expect(mockGetUserByIdDb).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it("returns null when the user does not exist", async () => {
    mockGetUserByIdDb.mockResolvedValue(
      null as unknown as Awaited<ReturnType<typeof getUserByIdDb>>,
    );

    await expect(getUserService(TEST_USER_ID)).resolves.toBe(null);
  });

  it("maps database failures to DatabaseError", async () => {
    const cause = new Error("db unavailable");
    mockGetUserByIdDb.mockRejectedValue(cause);

    const promise = getUserService(TEST_USER_ID);

    await expect(promise).rejects.toMatchObject({
      name: "DatabaseError",
      message: "Failed to fetch user from database",
      originalError: cause,
      cause,
    });
  });
});
