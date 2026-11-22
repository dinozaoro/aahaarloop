CREATE TABLE "admin_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_idempotency" (
	"key" text PRIMARY KEY NOT NULL,
	"status" integer NOT NULL,
	"body_text" text NOT NULL,
	"content_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telemetry_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "target_type" text DEFAULT 'donation' NOT NULL;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "target_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "ai_analysis" jsonb;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "resolution_note" text;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "favorites_user_org_idx" ON "favorites" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "reports_target_idx" ON "reports" USING btree ("target_type","target_id");