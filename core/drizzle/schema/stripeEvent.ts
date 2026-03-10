import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * Tracks Stripe webhook event IDs that have already been processed.
 * Used for idempotency: if the same event is delivered more than once
 * (Stripe retries, network replays, etc.) we skip re-processing it.
 */
export const StripeEventTable = pgTable("stripe_events", {
  id: varchar().primaryKey(),
  type: varchar({ length: 255 }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
