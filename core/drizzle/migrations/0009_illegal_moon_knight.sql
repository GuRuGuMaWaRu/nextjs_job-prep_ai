CREATE TYPE "public"."checkout_attempt_status" AS ENUM('creating', 'open', 'payment_pending', 'completed', 'expired', 'failed');--> statement-breakpoint
CREATE TABLE "checkout_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar NOT NULL,
	"status" "checkout_attempt_status" DEFAULT 'creating' NOT NULL,
	"stripe_price_id" varchar(255) NOT NULL,
	"stripe_customer_id" varchar,
	"stripe_session_id" varchar,
	"stripe_checkout_url" varchar,
	"stripe_expires_at" timestamp with time zone,
	"success_url" varchar NOT NULL,
	"cancel_url" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_attempts_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
ALTER TABLE "checkout_attempts" ADD CONSTRAINT "checkout_attempts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_attempts_live_user_price_unique" ON "checkout_attempts" USING btree ("stripe_price_id","userId") WHERE "checkout_attempts"."status" IN ('creating', 'open', 'payment_pending');