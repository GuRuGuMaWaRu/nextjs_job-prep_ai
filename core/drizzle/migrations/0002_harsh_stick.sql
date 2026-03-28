ALTER TABLE "stripe_events" ADD COLUMN "remediation_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "stripe_events" ADD COLUMN "remediation_detail" varchar(512);