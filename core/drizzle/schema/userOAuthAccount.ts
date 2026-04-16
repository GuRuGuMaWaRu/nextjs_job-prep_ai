import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  varchar,
  text,
  primaryKey,
} from "drizzle-orm/pg-core";

import { createdAt, updatedAt } from "../schemaHelpers";
import { UserTable } from "./user";
import { oAuthProviders } from "./oauthProviderIds";

export const oAuthProviderEnum = pgEnum("oauth_provider", oAuthProviders);

export const UserOAuthAccountTable = pgTable(
  "user_oauth_accounts",
  {
    userId: varchar()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    provider: oAuthProviderEnum().notNull(),
    providerAccountId: text().notNull().unique(),
    createdAt,
    updatedAt,
  },
  (table) => [
    primaryKey({ columns: [table.providerAccountId, table.provider] }),
  ],
);

export const userOAuthAccountsRelations = relations(
  UserOAuthAccountTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [UserOAuthAccountTable.userId],
      references: [UserTable.id],
    }),
  }),
);
