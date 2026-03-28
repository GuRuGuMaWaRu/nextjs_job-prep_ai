import { boolean, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * Tracks Stripe webhook event IDs that have already been processed.
 * Used for idempotency: if the same event is delivered more than once
 * (Stripe retries, network replays, etc.) we skip re-processing it.
 *
 * `remediationRequired` is set when handler processing failed and we could not
 * remove the claim row (unclaim failed). Those rows must not be treated like
 * successfully processed duplicates — callers should surface failure to Stripe.
 */
export const StripeEventTable = pgTable("stripe_events", {
  id: varchar().primaryKey(),
  type: varchar({ length: 255 }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  remediationRequired: boolean("remediation_required")
    .notNull()
    .default(false),
  /** Short, ops-facing note (e.g. unclaim failure); not for end users. */
  remediationDetail: varchar("remediation_detail", { length: 512 }),
});
