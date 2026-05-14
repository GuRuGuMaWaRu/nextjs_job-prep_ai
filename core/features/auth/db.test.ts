jest.mock("@/core/drizzle/db", () => ({
  db: {
    query: {},
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    select: jest.fn(),
    transaction: jest.fn(),
  },
}));

import { db } from "@/core/drizzle/db";
import { SessionTable, UserTable } from "@/core/drizzle/schema";
import {
  createMockDrizzleDb,
  createMockDrizzleTableQuery,
  type MockDrizzleDb,
} from "@core/test-utils/mocks/db";
import { TEST_FIXTURE_NOW_ISO } from "@core/test-utils/fixture-dates";
import { makeSession } from "@core/test-utils/factories/session";
import { makeUser } from "@core/test-utils/factories/user";

import {
  createSessionDb,
  createUserDb,
  deleteAllUserSessionsDb,
  deleteExpiredSessionsDb,
  deleteSessionDb,
  extendSessionDb,
  findUserByEmailDb,
  getUserSessionsDb,
  validateSessionDb,
} from "./db";

const mockDb = db as unknown as MockDrizzleDb;

function useMockDb(nextDb: MockDrizzleDb) {
  Object.assign(mockDb, nextDb);
}

function makeFixtureNow(): Date {
  return new Date(TEST_FIXTURE_NOW_ISO);
}

function getSqlParamValues(predicate: unknown): unknown[] {
  if (!predicate || typeof predicate !== "object") {
    return [];
  }

  const values: unknown[] = [];
  const queryChunks = (predicate as { queryChunks?: unknown[] }).queryChunks;

  if (!queryChunks) {
    return values;
  }

  for (const chunk of queryChunks) {
    if (!chunk || typeof chunk !== "object") {
      continue;
    }

    const value = (chunk as { value?: unknown }).value;

    if (value !== undefined && !Array.isArray(value)) {
      values.push(value);
    }

    values.push(...getSqlParamValues(chunk));
  }

  return values;
}

function expectWhereParams(whereMock: jest.Mock, expectedValues: unknown[]) {
  const callArg = whereMock.mock.calls[0][0];
  const predicate =
    callArg && typeof callArg === "object" && "where" in callArg
      ? (callArg as { where: unknown }).where
      : callArg;

  expect(getSqlParamValues(predicate)).toEqual(
    expect.arrayContaining(expectedValues),
  );
}

describe("auth db helpers", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("finds a user by normalized email", async () => {
    const user = makeUser({ email: "person@test.local" });
    const userQuery = createMockDrizzleTableQuery({ findFirst: user });

    useMockDb(
      createMockDrizzleDb({
        query: {
          UserTable: userQuery,
        },
      }),
    );

    await expect(findUserByEmailDb("PERSON@Test.Local")).resolves.toBe(user);

    expect(userQuery.findFirst).toHaveBeenCalledWith({
      where: expect.any(Object),
    });
    expectWhereParams(userQuery.findFirst, ["person@test.local"]);
  });

  it("creates users with auth defaults", async () => {
    const userData = {
      id: "user-1",
      name: "Ada Lovelace",
      email: "ada@test.local",
      passwordHash: "hashed-password",
    };

    useMockDb(createMockDrizzleDb());

    await createUserDb(userData);

    expect(mockDb.insert).toHaveBeenCalledWith(UserTable);
    expect(mockDb.insert.mock.results[0].value.values).toHaveBeenCalledWith({
      ...userData,
      image: null,
      emailVerified: null,
    });
  });

  it("creates sessions and returns inserted rows", async () => {
    const session = makeSession({ id: "session-1" });

    useMockDb(
      createMockDrizzleDb({
        insert: [session],
      }),
    );

    await expect(
      createSessionDb({
        userId: session.userId,
        token: session.token,
        expiresAt: session.expiresAt,
      }),
    ).resolves.toEqual([session]);

    const insertChain = mockDb.insert.mock.results[0].value;

    expect(mockDb.insert).toHaveBeenCalledWith(SessionTable);
    expect(insertChain.values).toHaveBeenCalledWith({
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
    });
    expect(insertChain.returning).toHaveBeenCalledTimes(1);
  });

  it("validates a non-expired session by token", async () => {
    const now = makeFixtureNow();
    const session = makeSession({ token: "session-token" });
    const sessionQuery = createMockDrizzleTableQuery({ findFirst: session });

    jest.useFakeTimers().setSystemTime(now.getTime());
    useMockDb(
      createMockDrizzleDb({
        query: {
          SessionTable: sessionQuery,
        },
      }),
    );

    await expect(validateSessionDb("session-token")).resolves.toBe(session);

    expect(sessionQuery.findFirst).toHaveBeenCalledWith({
      where: expect.any(Object),
    });
    expectWhereParams(sessionQuery.findFirst, ["session-token", now]);
  });

  it("extends a session expiry and returns updated rows", async () => {
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(makeFixtureNow().getTime() + oneWeekMs);
    const updatedSession = makeSession({ id: "session-1", expiresAt });

    useMockDb(
      createMockDrizzleDb({
        update: [updatedSession],
      }),
    );

    await expect(extendSessionDb("session-1", expiresAt)).resolves.toEqual([
      updatedSession,
    ]);

    const updateChain = mockDb.update.mock.results[0].value;

    expect(mockDb.update).toHaveBeenCalledWith(SessionTable);
    expect(updateChain.set).toHaveBeenCalledWith({ expiresAt });
    expectWhereParams(updateChain.where, ["session-1"]);
    expect(updateChain.returning).toHaveBeenCalledTimes(1);
  });

  it("deletes one session by token", async () => {
    useMockDb(createMockDrizzleDb());

    await deleteSessionDb("session-token");

    expect(mockDb.delete).toHaveBeenCalledWith(SessionTable);
    expectWhereParams(mockDb.delete.mock.results[0].value.where, [
      "session-token",
    ]);
  });

  it("deletes all sessions for a user", async () => {
    useMockDb(createMockDrizzleDb());

    await deleteAllUserSessionsDb("user-1");

    expect(mockDb.delete).toHaveBeenCalledWith(SessionTable);
    expectWhereParams(mockDb.delete.mock.results[0].value.where, ["user-1"]);
  });

  it("deletes expired sessions relative to current time", async () => {
    const now = makeFixtureNow();

    jest.useFakeTimers().setSystemTime(now.getTime());
    useMockDb(createMockDrizzleDb());

    await deleteExpiredSessionsDb();

    expect(mockDb.delete).toHaveBeenCalledWith(SessionTable);
    expectWhereParams(mockDb.delete.mock.results[0].value.where, [now]);
  });

  it("selects active sessions for a user", async () => {
    const now = makeFixtureNow();
    const sessions = [makeSession({ userId: "user-1" })];

    jest.useFakeTimers().setSystemTime(now.getTime());
    useMockDb(
      createMockDrizzleDb({
        select: sessions,
      }),
    );

    await expect(getUserSessionsDb("user-1")).resolves.toBe(sessions);

    const selectChain = mockDb.select.mock.results[0].value;

    expect(mockDb.select).toHaveBeenCalledWith();
    expect(selectChain.from).toHaveBeenCalledWith(SessionTable);
    expectWhereParams(selectChain.where, ["user-1", now]);
  });
});
