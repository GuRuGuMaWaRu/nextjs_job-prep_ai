jest.mock("next/cache", () => {
  const { createNextCacheMock } = jest.requireActual<
    typeof import("@core/test-utils/mocks/next")
  >("@core/test-utils/mocks/next");

  return createNextCacheMock();
});

jest.mock("@/core/lib/getCurrentUser", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/core/features/users/cache", () => ({
  revalidateUserCache: jest.fn(),
}));

import { revalidatePath } from "next/cache";

import { routes } from "@/core/data/routes";
import { getCurrentUser } from "@/core/lib/getCurrentUser";
import { revalidateUserCache } from "@/core/features/users/cache";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeUser } from "@/core/test-utils/factories";

import { revalidateUpgradePage } from "../actions";

const mockGetCurrentUser = jest.mocked(getCurrentUser);
const mockRevalidatePath = jest.mocked(revalidatePath);
const mockRevalidateUserCache = jest.mocked(revalidateUserCache);

describe("revalidateUpgradePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("revalidates the upgrade path and signed-in user cache", async () => {
    mockGetCurrentUser.mockResolvedValue(makeUser({ id: TEST_USER_ID }));

    await expect(revalidateUpgradePage()).resolves.toBeUndefined();

    expect(routes.upgrade).toBe("/app/upgrade");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/app/upgrade");
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
    expect(mockRevalidateUserCache).toHaveBeenCalledTimes(1);
    expect(mockRevalidateUserCache).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it("revalidates the upgrade path without a user cache for anonymous users", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    await expect(revalidateUpgradePage()).resolves.toBeUndefined();

    expect(mockRevalidatePath).toHaveBeenCalledWith("/app/upgrade");
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1);
    expect(mockRevalidateUserCache).not.toHaveBeenCalled();
  });
});
