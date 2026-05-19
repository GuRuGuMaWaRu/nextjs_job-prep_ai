jest.mock("@/core/features/users/service", () => ({
  getUserService: jest.fn(),
}));

import { getUserAction } from "@/core/features/users/actions";
import { getUserService } from "@/core/features/users/service";
import { TEST_USER_ID } from "@/core/test-utils/constants";
import { makeUser } from "@/core/test-utils/factories";

const mockGetUserService = jest.mocked(getUserService);

describe("user actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("gets a user through the service", async () => {
    const user = makeUser({ id: TEST_USER_ID });
    mockGetUserService.mockResolvedValue(user);

    await expect(getUserAction(TEST_USER_ID)).resolves.toBe(user);

    expect(mockGetUserService).toHaveBeenCalledWith(TEST_USER_ID);
  });

  it("returns null when the service finds no user", async () => {
    mockGetUserService.mockResolvedValue(null);

    await expect(getUserAction(TEST_USER_ID)).resolves.toBe(null);

    expect(mockGetUserService).toHaveBeenCalledWith(TEST_USER_ID);
  });
});
