CREATE TABLE "stripe_events" (
	"id" varchar PRIMARY KEY NOT NULL,
	"type" varchar(255) NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
