import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/core/data/env/server";
import { getUserIdsWithStripeSubscriptionDb } from "@/core/features/users/db";
import { reconcileUserStripeSubscription } from "@/core/features/users/stripeSync";
import { getStripe, isStripeConfigured } from "@/core/lib/stripe";

const BATCH_LIMIT = 500;

/**
 * Vercel Cron (or any caller with CRON_SECRET): reconciles users who still
 * have a Stripe subscription id with Stripe’s current state. Catches missed
 * webhooks by downgrading or updating plan/subscription fields.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 501 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 501 },
    );
  }

  const userIds = await getUserIdsWithStripeSubscriptionDb(BATCH_LIMIT);

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const errorSamples: string[] = [];

  for (const userId of userIds) {
    try {
      const result = await reconcileUserStripeSubscription(stripe, userId);
      processed += 1;

      if (result.kind === "skipped") {
        skipped += 1;
        continue;
      }

      if (result.kind === "error") {
        errors += 1;
        if (errorSamples.length < 5) {
          errorSamples.push(`${userId}:${result.message}`);
        }
        continue;
      }

      if (result.updated) {
        updated += 1;
      }
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      if (errorSamples.length < 5) {
        errorSamples.push(`${userId}:${message}`);
      }
    }
  }

  const body = {
    ok: true,
    batchLimit: BATCH_LIMIT,
    candidates: userIds.length,
    processed,
    updated,
    skipped,
    errors,
    ...(errorSamples.length > 0 && { errorSamples }),
  };

  return NextResponse.json(body);
}
