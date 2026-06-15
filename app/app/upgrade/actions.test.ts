jest.mock("next/cache", () => {
  const { createNextCacheMock } = jest.requireActual<
    typeof import("@core/test-utils/mocks/next")
  >("@core/test-utils/mocks/next");

  return createNextCacheMock();
});

jest.mock("@/core/features/auth/actions", () => ({
  getCurrentUserAction: jest.fn(),
}));

jest.mock("@/core/features/users/dbCache", () => ({
  revalidateUserCache: jest.fn(),
}));

import { revalidatePath } from "next/cache";

import { routes } from "@/core/data/routes";
import { getCurrentUserAction } from "@/core/features/auth/actions";
import { revalidateUserCache } from "@/core/features/users/dbCache";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeCurrentUser } from "@/core/test-utils/factories";

import { revalidateUpgradePage } from "./actions";

const mockGetCurrentUserAction = jest.mocked(getCurrentUserAction);
const mockRevalidatePath = jest.mocked(revalidatePath);
const mockRevalidateUserCache = jest.mocked(revalidateUserCache);

describe("revalidateUpgradePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("revalidates the upgrade path and signed-in user cache", async () => {
    mockGetCurrentUserAction.mockResolvedValue(
      makeCurrentUser({ userId: TEST_USER_ID }),
    );

    await expect(revalidateUpgradePage()).resolves.toBeUndefined();

    expect(routes.upgrade).toBe("/app/upgrade");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/app/upgrade");
    expect(mockGetCurrentUserAction).toHaveBeenCalledTimes(1);
    expect(mockRevalidateUserCache).toHaveBeenCalledTimes(1);
    expect(mockRevalidateUserCache).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it("revalidates the upgrade path without a user cache for anonymous users", async () => {
    mockGetCurrentUserAction.mockResolvedValue(
      makeCurrentUser({ userId: null }),
    );

    await expect(revalidateUpgradePage()).resolves.toBeUndefined();

    expect(mockRevalidatePath).toHaveBeenCalledWith("/app/upgrade");
    expect(mockGetCurrentUserAction).toHaveBeenCalledTimes(1);
    expect(mockRevalidateUserCache).not.toHaveBeenCalled();
  });
});
