jest.mock("@/core/features/auth/tokens", () => ({
  generateUserId: () => "generated-user-id",
}));

jest.mock("@/core/drizzle/db", () => ({
  db: {
    transaction: jest.fn(),
  },
}));

import { db } from "@/core/drizzle/db";
import { UserOAuthAccountTable, UserTable } from "@/core/drizzle/schema";
import {
  createDrizzleMutationChainMock,
  createMockDrizzleDb,
  createMockDrizzleTableQuery,
} from "@core/test-utils/mocks/db";

import { connectUserToAccount } from "@/core/features/auth/oauth/connectUser";
import { OAuthUnverifiedEmailError } from "@/core/features/auth/oauth/errors";

const mockTransaction = db.transaction as jest.MockedFunction<
  typeof db.transaction
>;

/** Shared tx shape: no OAuth link, email first null then row after insert conflict. */
function createMockTxForInsertConflictRace() {
  const userQuery = createMockDrizzleTableQuery();
  userQuery.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
    id: "winner-id",
    emailVerified: null,
  });

  return createMockDrizzleDb({
    query: {
      UserOAuthAccountTable: createMockDrizzleTableQuery({ findFirst: null }),
      UserTable: userQuery,
    },
    insert: (table) => {
      if (table === UserTable) {
        return [];
      }

      return undefined;
    },
    update: undefined,
  });
}

describe("connectUserToAccount", () => {
  beforeEach(() => {
    mockTransaction.mockReset();
  });

  it("returns existing user when OAuth account is already linked", async () => {
    mockTransaction.mockImplementation(async (fn) => {
      const tx = createMockDrizzleDb({
        query: {
          UserOAuthAccountTable: createMockDrizzleTableQuery({
            findFirst: { userId: "prior-user" },
          }),
          UserTable: createMockDrizzleTableQuery(),
        },
      });
      return fn(tx as never);
    });

    await expect(
      connectUserToAccount(
        {
          id: "oauth-sub",
          email: "a@b.com",
          name: "A",
          emailVerified: true,
        },
        "google",
      ),
    ).resolves.toEqual({ id: "prior-user" });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it("reuses user by email and updates emailVerified when needed", async () => {
    const updateChain = createDrizzleMutationChainMock();
    const updateMock = jest.fn().mockReturnValue({
      set: updateChain.set,
    });

    mockTransaction.mockImplementation(async (fn) => {
      const tx = createMockDrizzleDb({
        query: {
          UserOAuthAccountTable: createMockDrizzleTableQuery({
            findFirst: null,
          }),
          UserTable: createMockDrizzleTableQuery({
            findFirst: { id: "by-email", emailVerified: null },
          }),
        },
        insert: (table) => {
          if (table === UserOAuthAccountTable) {
            return undefined;
          }
          throw new Error("Unexpected UserTable insert when matching by email");
        },
      });
      tx.update = updateMock;
      return fn(tx as never);
    });

    await expect(
      connectUserToAccount(
        {
          id: "oauth-sub",
          email: "a@b.com",
          name: "A",
          emailVerified: true,
        },
        "google",
      ),
    ).resolves.toEqual({ id: "by-email" });

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith(UserTable);
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        emailVerified: expect.any(Date),
      }),
    );
  });

  it("reuses user by email without updating when already verified", async () => {
    const verifiedAt = new Date(0);
    const updateMock = jest.fn();

    mockTransaction.mockImplementation(async (fn) => {
      const tx = createMockDrizzleDb({
        query: {
          UserOAuthAccountTable: createMockDrizzleTableQuery({
            findFirst: null,
          }),
          UserTable: createMockDrizzleTableQuery({
            findFirst: { id: "by-email", emailVerified: verifiedAt },
          }),
        },
        insert: (table) => {
          if (table === UserOAuthAccountTable) {
            return undefined;
          }
          throw new Error("Unexpected UserTable insert when matching by email");
        },
      });
      tx.update = updateMock;
      return fn(tx as never);
    });

    await expect(
      connectUserToAccount(
        {
          id: "oauth-sub",
          email: "verified@test.local",
          name: "Verified",
          emailVerified: true,
        },
        "google",
      ),
    ).resolves.toEqual({ id: "by-email" });

    expect(updateMock).not.toHaveBeenCalled();
  });

  it("creates a user when insert returns a row", async () => {
    mockTransaction.mockImplementation(async (fn) => {
      const tx = createMockDrizzleDb({
        query: {
          UserOAuthAccountTable: createMockDrizzleTableQuery({
            findFirst: null,
          }),
          UserTable: createMockDrizzleTableQuery({ findFirst: null }),
        },
        insert: (table) => {
          if (table === UserTable) {
            return [{ id: "generated-user-id" }];
          }
          return undefined;
        },
      });
      return fn(tx as never);
    });

    await expect(
      connectUserToAccount(
        {
          id: "oauth-sub",
          email: "new@b.com",
          name: "N",
          emailVerified: true,
        },
        "google",
      ),
    ).resolves.toEqual({ id: "generated-user-id" });
  });

  it("stores new OAuth-created users as email verified", async () => {
    const userInsertChain = createDrizzleMutationChainMock([
      { id: "generated-user-id" },
    ]);

    mockTransaction.mockImplementation(async (fn) => {
      const tx = createMockDrizzleDb({
        query: {
          UserOAuthAccountTable: createMockDrizzleTableQuery({
            findFirst: null,
          }),
          UserTable: createMockDrizzleTableQuery({ findFirst: null }),
        },
        insert: (table) => {
          if (table === UserTable) {
            return [{ id: "generated-user-id" }];
          }
          return undefined;
        },
      });

      tx.insert.mockImplementation((table) => {
        if (table === UserTable) {
          return userInsertChain;
        }

        return createDrizzleMutationChainMock();
      });

      return fn(tx as never);
    });

    await expect(
      connectUserToAccount(
        {
          id: "oauth-sub",
          email: "new@test.local",
          name: "N",
          emailVerified: true,
        },
        "google",
      ),
    ).resolves.toEqual({ id: "generated-user-id" });

    expect(userInsertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        emailVerified: expect.any(Date),
      }),
    );
  });

  it("rejects unverified OAuth email before creating a user", async () => {
    const tx = createMockDrizzleDb({
      query: {
        UserOAuthAccountTable: createMockDrizzleTableQuery({ findFirst: null }),
        UserTable: createMockDrizzleTableQuery({ findFirst: null }),
      },
    });
    mockTransaction.mockImplementation(async (fn) => fn(tx as never));

    await expect(
      connectUserToAccount(
        {
          id: "oauth-sub",
          email: "new@b.com",
          name: "N",
          emailVerified: false,
        },
        "discord",
      ),
    ).rejects.toBeInstanceOf(OAuthUnverifiedEmailError);

    expect(tx.insert).not.toHaveBeenCalled();
  });

  it("re-queries by email after insert conflict and completes sign-in", async () => {
    mockTransaction.mockImplementation(async (fn) => {
      const tx = createMockTxForInsertConflictRace();
      return fn(tx as never);
    });

    await expect(
      connectUserToAccount(
        {
          id: "oauth-sub",
          email: "race@b.com",
          name: "R",
          emailVerified: true,
        },
        "google",
      ),
    ).resolves.toEqual({ id: "winner-id" });
  });

  it("throws when insert conflict re-query still finds no user row", async () => {
    const userQuery = createMockDrizzleTableQuery();
    userQuery.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const tx = createMockDrizzleDb({
      query: {
        UserOAuthAccountTable: createMockDrizzleTableQuery({ findFirst: null }),
        UserTable: userQuery,
      },
      insert: (table) => {
        if (table === UserTable) {
          return [];
        }

        return undefined;
      },
    });
    mockTransaction.mockImplementation(async (fn) => fn(tx as never));

    await expect(
      connectUserToAccount(
        {
          id: "oauth-sub",
          email: "missing-after-conflict@test.local",
          name: "Race",
          emailVerified: true,
        },
        "google",
      ),
    ).rejects.toThrow("Expected user row after insert conflict on email");

    expect(tx.insert).toHaveBeenCalledTimes(1);
  });
});
