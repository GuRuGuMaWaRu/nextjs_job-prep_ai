type AnyTable = unknown;
type AnyPredicate = unknown;
type AnySelection = unknown;
type AnyRecord = Record<string, unknown>;
type FixedMutationResult = unknown[] | AnyRecord | null | undefined;
type MutationResultOption =
  | FixedMutationResult
  | ((table: AnyTable) => FixedMutationResult);

export type DrizzleMutationChainMock<TResult = unknown> = {
  values: jest.Mock<DrizzleMutationChainMock<TResult>, [AnyRecord]>;
  set: jest.Mock<DrizzleMutationChainMock<TResult>, [AnyRecord]>;
  where: jest.Mock<DrizzleMutationChainMock<TResult>, [AnyPredicate]>;
  from: jest.Mock<DrizzleMutationChainMock<TResult>, [AnyTable]>;
  orderBy: jest.Mock<DrizzleMutationChainMock<TResult>, [AnyPredicate]>;
  limit: jest.Mock<DrizzleMutationChainMock<TResult>, [number]>;
  onConflictDoNothing: jest.Mock<DrizzleMutationChainMock<TResult>, [unknown?]>;
  returning: jest.Mock<Promise<TResult>, [AnySelection?]>;
  then: Promise<TResult>["then"];
  catch: Promise<TResult>["catch"];
  finally: Promise<TResult>["finally"];
};

export type MockDrizzleTableQuery<TFindFirst = unknown, TFindMany = unknown> = {
  findFirst: jest.Mock<Promise<TFindFirst>, [unknown?]>;
  findMany: jest.Mock<Promise<TFindMany>, [unknown?]>;
};

export type MockDrizzleDb = {
  query: Record<string, MockDrizzleTableQuery>;
  insert: jest.Mock<DrizzleMutationChainMock, [AnyTable]>;
  update: jest.Mock<DrizzleMutationChainMock, [AnyTable]>;
  delete: jest.Mock<DrizzleMutationChainMock, [AnyTable]>;
  select: jest.Mock<DrizzleMutationChainMock, [AnySelection?]>;
  transaction: jest.Mock<Promise<unknown>, [(tx: MockDrizzleDb) => unknown]>;
};

type MockDrizzleDbOptions = {
  query?: Record<string, MockDrizzleTableQuery>;
  insert?: MutationResultOption;
  update?: MutationResultOption;
  delete?: MutationResultOption;
  select?: MutationResultOption;
};

export function createDrizzleMutationChainMock<TResult = unknown>(
  result?: TResult,
): DrizzleMutationChainMock<TResult> {
  const chain = {
    values: jest.fn(),
    set: jest.fn(),
    where: jest.fn(),
    from: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    onConflictDoNothing: jest.fn(),
    returning: jest.fn(),
  } as DrizzleMutationChainMock<TResult>;

  chain.values.mockReturnValue(chain);
  chain.set.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.onConflictDoNothing.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.returning.mockResolvedValue(result as TResult);
  chain.then = (...args) => Promise.resolve(result as TResult).then(...args);
  chain.catch = (...args) => Promise.resolve(result as TResult).catch(...args);
  chain.finally = (...args) =>
    Promise.resolve(result as TResult).finally(...args);

  return chain;
}

export function createMockDrizzleTableQuery<
  TFindFirst = unknown,
  TFindMany = unknown,
>({
  findFirst,
  findMany,
}: {
  findFirst?: TFindFirst;
  findMany?: TFindMany;
} = {}): MockDrizzleTableQuery<TFindFirst, TFindMany> {
  return {
    findFirst: jest.fn().mockResolvedValue(findFirst),
    findMany: jest.fn().mockResolvedValue(findMany),
  };
}

export function createMockDrizzleDb({
  query = {},
  insert,
  update,
  delete: deleteResult,
  select,
}: MockDrizzleDbOptions = {}): MockDrizzleDb {
  const resolveResult = (option: MutationResultOption, table: AnyTable) => {
    if (typeof option === "function") {
      return option(table);
    }

    return option;
  };

  const db = {
    query,
    insert: jest.fn((table) =>
      createDrizzleMutationChainMock(resolveResult(insert, table)),
    ),
    update: jest.fn((table) =>
      createDrizzleMutationChainMock(resolveResult(update, table)),
    ),
    delete: jest.fn((table) =>
      createDrizzleMutationChainMock(resolveResult(deleteResult, table)),
    ),
    select: jest.fn((selection) =>
      createDrizzleMutationChainMock(resolveResult(select, selection)),
    ),
    transaction: jest.fn(),
  } as MockDrizzleDb;

  db.transaction.mockImplementation(async (callback) => callback(db));

  return db;
}
