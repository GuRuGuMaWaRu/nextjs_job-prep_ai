import {
  pgTable,
  pgEnum,
  varchar,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

import { id, createdAt, updatedAt } from "../schemaHelpers";
import { UserTable } from "./user";

export const checkoutAttemptStatuses = [
  "creating",
  "open",
  "payment_pending",
  "completed",
  "expired",
  "failed",
] as const;

export type CheckoutAttemptStatus = (typeof checkoutAttemptStatuses)[number];

export const checkoutAttemptEnum = pgEnum(
  "checkout_attempt_status",
  checkoutAttemptStatuses,
);

export const CheckoutAttemptTable = pgTable(
  "checkout_attempts",
  {
    id,
    userId: varchar()
      .notNull()
      .references(() => UserTable.id, { onDelete: "no action" }),
    status: checkoutAttemptEnum("status").notNull().default("creating"),
    stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
    stripeCustomerId: varchar("stripe_customer_id"),
    stripeSessionId: varchar("stripe_session_id").unique(),
    stripeCheckoutUrl: varchar("stripe_checkout_url"),
    stripeExpiresAt: timestamp("stripe_expires_at", { withTimezone: true }),
    successUrl: varchar("success_url").notNull(),
    cancelUrl: varchar("cancel_url").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("checkout_attempts_live_user_price_unique")
      .on(table.stripePriceId, table.userId)
      .where(sql`${table.status} IN ('creating', 'open', 'payment_pending')`),
  ],
);

export const checkoutAttemptRelations = relations(
  CheckoutAttemptTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [CheckoutAttemptTable.userId],
      references: [UserTable.id],
    }),
  }),
);
