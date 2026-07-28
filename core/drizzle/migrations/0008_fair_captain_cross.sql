CREATE TYPE "public"."user_plans" AS ENUM('free', 'pro');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "plan" SET DEFAULT 'free'::"public"."user_plans";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "plan" SET DATA TYPE "public"."user_plans" USING "plan"::"public"."user_plans";