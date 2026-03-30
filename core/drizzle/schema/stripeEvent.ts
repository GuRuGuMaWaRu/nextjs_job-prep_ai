import { pgEnum, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * Lifecycle of a Stripe webhook event row in `stripe_events`.
 *
 * - `processing`: claim won the insert; handler must finish and set `processed`
 *   or delete the row on failure.
 * - `processed`: handler completed; duplicate deliveries are safe to ACK.
 * - `remediation_required`: handler failed and the claim row could not be
 *   removed; Stripe retries must not treat this as a successful duplicate.
 */
export const stripeEventStateEnum = pgEnum("stripe_event_state", [
  "processing",
  "processed",
  "remediation_required",
]);

/**
 * Tracks Stripe webhook event IDs for idempotency and processing state.
 *
 * Rows move `processing` → `processed` on success, or are deleted after a
 * failed handler when unclaim succeeds. If unclaim fails, state becomes
 * `remediation_required` so duplicate deliveries surface failure to Stripe.
 */
export const StripeEventTable = pgTable("stripe_events", {
  id: varchar().primaryKey(),
  type: varchar({ length: 255 }).notNull(),
  state: stripeEventStateEnum("state").notNull().default("processed"),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  /** Short, ops-facing note (e.g. unclaim failure); not for end users. */
  remediationDetail: varchar("remediation_detail", { length: 512 }),
});
