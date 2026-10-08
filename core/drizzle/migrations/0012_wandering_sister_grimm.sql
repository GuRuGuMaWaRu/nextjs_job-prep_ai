ALTER TYPE "public"."stripe_event_state" ADD VALUE 'pending' BEFORE 'processing';--> statement-breakpoint
ALTER TABLE "stripe_events" ALTER COLUMN "processed_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "stripe_events" ALTER COLUMN "processed_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stripe_events" ADD COLUMN "payload" jsonb;