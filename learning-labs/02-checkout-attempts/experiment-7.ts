import { drizzle } from "drizzle-orm/node-postgres";
import {
  pgEnum,
  pgTable,
  varchar,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { and, or, eq, inArray, isNull } from "drizzle-orm";
import type Stripe from "stripe";

import { makeStripeEvent } from "@core/test-utils/factories";

export const stripeEventStateEnum = pgEnum("stripe_event_state", [
  "pending",
  "processing",
  "processed",
  "remediation_required",
]);
export const StripeEventTable = pgTable("stripe_events", {
  id: varchar().primaryKey(),
  type: varchar({ length: 255 }).notNull(),
  state: stripeEventStateEnum("state").notNull().default("processed"),
  payload: jsonb(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  remediationDetail: varchar("remediation_detail", { length: 512 }),
});

const db = drizzle(process.env.TEST_DB as string);

const object = { id: "arbitrary" };

const event = makeStripeEvent({ type: "custom.event.type", object });

export async function markStripeEventProcessed(eventId: string): Promise<void> {
  await db
    .update(StripeEventTable)
    .set({ state: "processed", processedAt: new Date() })
    .where(eq(StripeEventTable.id, eventId));
}

export async function storeStripeEvent(event: Stripe.Event) {
  const [inserted] = await db
    .insert(StripeEventTable)
    .values({
      id: event.id,
      type: event.type,
      state: "pending",
      payload: event,
    })
    .onConflictDoNothing({ target: StripeEventTable.id })
    .returning();

  return inserted;
}

async function main() {
  const stripeEvent = await storeStripeEvent(event);
  await markStripeEventProcessed(stripeEvent.id);

  await storeStripeEvent(event);

  const resultingStripeEvent = await db
    .select()
    .from(StripeEventTable)
    .where(eq(StripeEventTable.id, stripeEvent.id));

  console.log("resultingStripeEvent:", resultingStripeEvent);
}

main();

// npx dotenv -e .env -- npx tsx learning-labs/02-checkout-attempts/experiment-7.ts
