CREATE TYPE "public"."stripe_event_state" AS ENUM('processing', 'processed', 'remediation_required');--> statement-breakpoint
ALTER TABLE "stripe_events" ADD COLUMN "state" "stripe_event_state" DEFAULT 'processed' NOT NULL;--> statement-breakpoint
UPDATE "stripe_events" SET "state" = 'remediation_required' WHERE "remediation_required" = true;--> statement-breakpoint
ALTER TABLE "stripe_events" DROP COLUMN "remediation_required";
