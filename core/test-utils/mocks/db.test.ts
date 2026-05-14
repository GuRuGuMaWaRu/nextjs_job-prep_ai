import {
  createDrizzleMutationChainMock,
  createMockDrizzleDb,
  createMockDrizzleTableQuery,
} from "./db";

describe("createDrizzleMutationChainMock", () => {
  it("returns the same chain through Drizzle builder methods", () => {
    const chain = createDrizzleMutationChainMock();

    expect(chain.values({ id: "user-1" })).toBe(chain);
    expect(chain.set({ name: "Updated" })).toBe(chain);
    expect(chain.where({ kind: "predicate" })).toBe(chain);
    expect(chain.from({ table: "users" })).toBe(chain);
    expect(chain.onConflictDoNothing()).toBe(chain);
  });

  it("resolves returning rows from returning()", async () => {
    const rows = [{ id: "user-1" }];
    const chain = createDrizzleMutationChainMock(rows);

    await expect(chain.returning({ id: "column" })).resolves.toBe(rows);
  });
});

describe("createMockDrizzleTableQuery", () => {
  it("exposes findFirst and findMany as jest functions with configured results", async () => {
    const query = createMockDrizzleTableQuery({
      findFirst: { id: "user-1" },
      findMany: [{ id: "user-1" }, { id: "user-2" }],
    });

    await expect(query.findFirst({ columns: { id: true } })).resolves.toEqual({
      id: "user-1",
    });
    await expect(query.findMany({})).resolves.toEqual([
      { id: "user-1" },
      { id: "user-2" },
    ]);
  });
});

describe("createMockDrizzleDb", () => {
  it("returns chainable insert, update, delete, and select builders", async () => {
    const db = createMockDrizzleDb({
      insert: [{ id: "inserted" }],
      update: [{ id: "updated" }],
      delete: [{ id: "deleted" }],
      select: [{ id: "selected" }],
    });

    await expect(
      db.insert({ table: "users" }).values({}).returning(),
    ).resolves.toEqual([{ id: "inserted" }]);
    await expect(
      db.update({ table: "users" }).set({}).where({}).returning(),
    ).resolves.toEqual([{ id: "updated" }]);
    await expect(
      db.delete({ table: "users" }).where({}).returning(),
    ).resolves.toEqual([{ id: "deleted" }]);
    await expect(
      db.select().from({ table: "users" }).where({}),
    ).resolves.toEqual([{ id: "selected" }]);
  });

  it("runs transaction callbacks with an isolated transaction mock", async () => {
    const db = createMockDrizzleDb();

    await expect(
      db.transaction(async (tx) => {
        await tx.insert({ table: "users" }).values({ id: "user-1" });

        return "committed";
      }),
    ).resolves.toBe("committed");

    expect(db.transaction).toHaveBeenCalledTimes(1);
  });

  it("allows mutation results to vary by table", async () => {
    const usersTable = { name: "users" };
    const sessionsTable = { name: "sessions" };
    const db = createMockDrizzleDb({
      insert: (table) => {
        if (table === usersTable) {
          return [{ id: "user-1" }];
        }

        return [{ id: "session-1" }];
      },
    });

    await expect(db.insert(usersTable).values({}).returning()).resolves.toEqual([
      { id: "user-1" },
    ]);
    await expect(
      db.insert(sessionsTable).values({}).returning(),
    ).resolves.toEqual([{ id: "session-1" }]);
  });
});
