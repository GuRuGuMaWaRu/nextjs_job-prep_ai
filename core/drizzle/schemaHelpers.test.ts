import { pgTable } from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "./schemaHelpers";

describe("schema helpers", () => {
  const table = pgTable("coverage_probe", {
    id,
    createdAt,
    updatedAt,
  });

  it("configures id as a defaulted primary uuid column", () => {
    expect(table.id).toEqual(
      expect.objectContaining({
        columnType: "PgUUID",
        dataType: "string",
        hasDefault: true,
        notNull: true,
        primary: true,
      }),
    );
  });

  it("configures createdAt as a timezone-aware default timestamp", () => {
    expect(table.createdAt).toEqual(
      expect.objectContaining({
        columnType: "PgTimestamp",
        dataType: "date",
        hasDefault: true,
        notNull: true,
        primary: false,
        withTimezone: true,
      }),
    );
  });

  it("configures updatedAt with an on-update timestamp callback", () => {
    expect(table.updatedAt).toEqual(
      expect.objectContaining({
        columnType: "PgTimestamp",
        dataType: "date",
        hasDefault: true,
        notNull: true,
        withTimezone: true,
      }),
    );
    expect(table.updatedAt.onUpdateFn).toEqual(expect.any(Function));
    expect(table.updatedAt.onUpdateFn?.()).toBeInstanceOf(Date);
  });
});
