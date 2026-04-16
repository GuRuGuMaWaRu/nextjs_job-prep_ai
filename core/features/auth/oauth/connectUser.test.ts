jest.mock("@/core/features/auth/tokens", () => ({
  generateUserId: () => "generated-user-id",
}));

jest.mock("@/core/drizzle/db", () => ({
  db: {
    transaction: jest.fn(),
  },
}));

import { db } from "@/core/drizzle/db";
import {
  UserOAuthAccountTable,
  UserTable,
} from "@/core/drizzle/schema";

import { connectUserToAccount } from "@/core/features/auth/oauth/connectUser";
import { OAuthUnverifiedEmailError } from "@/core/features/auth/oauth/errors";

const mockTransaction = db.transaction as jest.MockedFunction<typeof db.transaction>;

function chainUserInsert(insertReturning: { id: string }[]) {
  return {
    values: jest.fn().mockReturnValue({
      onConflictDoNothing: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue(insertReturning),
      }),
    }),
  };
}

function chainOAuthInsert() {
  return {
    values: jest.fn().mockReturnValue({
      onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
    }),
  };
}

function chainUpdate() {
  return {
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    }),
  };
}

/** Shared tx shape: no OAuth link, email first null then row after insert conflict. */
function createMockTxForInsertConflictRace() {
  return {
    query: {
      UserOAuthAccountTable: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      UserTable: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: "winner-id",
            emailVerified: null,
          }),
      },
    },
    insert: jest.fn((table: unknown) => {
      if (table === UserTable) {
        return chainUserInsert([]);
      }
      return chainOAuthInsert();
    }),
    update: jest.fn(() => chainUpdate()),
  };
}

describe("connectUserToAccount", () => {
  beforeEach(() => {
    mockTransaction.mockReset();
  });

  it("returns existing user when OAuth account is already linked", async () => {
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        query: {
          UserOAuthAccountTable: {
            findFirst: jest.fn().mockResolvedValue({ userId: "prior-user" }),
          },
          UserTable: { findFirst: jest.fn() },
        },
        insert: jest.fn(),
        update: jest.fn(),
      };
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
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        query: {
          UserOAuthAccountTable: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          UserTable: {
            findFirst: jest
              .fn()
              .mockResolvedValue({ id: "by-email", emailVerified: null }),
          },
        },
        insert: jest.fn((table: unknown) => {
          if (table === UserOAuthAccountTable) {
            return chainOAuthInsert();
          }
          throw new Error("Unexpected UserTable insert when matching by email");
        }),
        update: jest.fn(() => chainUpdate()),
      };
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
  });

  it("creates a user when insert returns a row", async () => {
    mockTransaction.mockImplementation(async (fn) => {
      const tx = {
        query: {
          UserOAuthAccountTable: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          UserTable: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        },
        insert: jest.fn((table) => {
          if (table === UserTable) {
            return chainUserInsert([{ id: "generated-user-id" }]);
          }
          return chainOAuthInsert();
        }),
        update: jest.fn(),
      };
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

  it("applies OAuth email-link policy after insert conflict", async () => {
    const tx = createMockTxForInsertConflictRace();
    mockTransaction.mockImplementation(async (fn) => fn(tx as never));

    await expect(
      connectUserToAccount(
        {
          id: "oauth-sub",
          email: "race@b.com",
          name: "R",
          emailVerified: false,
        },
        "google",
      ),
    ).rejects.toBeInstanceOf(OAuthUnverifiedEmailError);

    expect(tx.update).not.toHaveBeenCalled();
  });
});
