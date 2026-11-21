CREATE TYPE "public"."claim_status" AS ENUM('pending', 'confirmed', 'pickup_scheduled', 'picked_up', 'delivered', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."conflict_resolution" AS ENUM('pending', 'local', 'remote', 'merged', 'manual');--> statement-breakpoint
CREATE TYPE "public"."device_platform" AS ENUM('web', 'ios', 'android');--> statement-breakpoint
CREATE TYPE "public"."donation_status" AS ENUM('draft', 'published', 'claimed', 'pickup_scheduled', 'picked_up', 'delivered', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."organization_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."pickup_task_status" AS ENUM('unassigned', 'assigned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."quantity_unit" AS ENUM('servings', 'kilograms', 'litres', 'pieces');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'investigating', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."storage_type" AS ENUM('ambient', 'refrigerated', 'frozen');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'conflict');--> statement-breakpoint
CREATE TYPE "public"."transition_actor" AS ENUM('donor', 'recipient', 'volunteer', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('donor', 'recipient', 'volunteer', 'admin');--> statement-breakpoint
CREATE TABLE "device_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "device_platform" NOT NULL,
	"device_id" text NOT NULL,
	"push_token" text,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "donor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"food_types" text[],
	"pickup_window" text,
	"notes" text,
	CONSTRAINT "donor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "organization_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"email" text,
	"phone" text,
	"address" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"phone" text,
	"locale" text DEFAULT 'en-IN' NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"avatar_url" text,
	"bio" text,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "recipient_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"household_size" integer DEFAULT 1 NOT NULL,
	"dietary_restrictions" text[],
	"preferred_categories" text[],
	"max_distance_km" integer,
	"transport_capacity_kg" integer,
	CONSTRAINT "recipient_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "recipient_household_non_negative" CHECK ("recipient_profiles"."household_size" >= 0),
	CONSTRAINT "recipient_max_distance_non_negative" CHECK ("recipient_profiles"."max_distance_km" >= 0),
	CONSTRAINT "recipient_transport_non_negative" CHECK ("recipient_profiles"."transport_capacity_kg" >= 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"name" text NOT NULL,
	"image_url" text,
	"role" "user_role" NOT NULL,
	"active_organization_id" uuid,
	"last_sign_in_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "volunteer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"vehicle_type" text,
	"capacity_kg" integer,
	"availability" text[],
	"verified_at" timestamp with time zone,
	CONSTRAINT "volunteer_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "volunteer_capacity_non_negative" CHECK ("volunteer_profiles"."capacity_kg" >= 0)
);
--> statement-breakpoint
CREATE TABLE "donation_allergens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"donation_id" uuid NOT NULL,
	"allergen_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donation_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"donation_id" uuid NOT NULL,
	"url" text NOT NULL,
	"provider_public_id" text,
	"alt_text" text,
	"position" integer DEFAULT 0 NOT NULL,
	"uploaded_by_user_id" uuid,
	CONSTRAINT "donation_images_position_non_negative" CHECK ("donation_images"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "donation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"donation_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid,
	"quantity" integer NOT NULL,
	"unit" "quantity_unit" DEFAULT 'servings' NOT NULL,
	"food_expiry_at" timestamp with time zone,
	"best_before_at" timestamp with time zone,
	"storage" "storage_type" DEFAULT 'ambient' NOT NULL,
	"notes" text,
	CONSTRAINT "donation_items_quantity_non_negative" CHECK ("donation_items"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"organization_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category_id" uuid,
	"status" "donation_status" DEFAULT 'draft' NOT NULL,
	"food_expiry_at" timestamp with time zone,
	"best_before_at" timestamp with time zone,
	"pickup_deadline_at" timestamp with time zone,
	"effective_deadline_at" timestamp with time zone,
	"quantity" integer NOT NULL,
	"remaining_quantity" integer NOT NULL,
	"quantity_unit" "quantity_unit" DEFAULT 'servings' NOT NULL,
	"storage" "storage_type" NOT NULL,
	"packaging" text,
	"address" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"contact_name" text,
	"contact_phone" text,
	"pickup_instructions" text,
	"splittable" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "donations_quantity_non_negative" CHECK ("donations"."quantity" >= 0),
	CONSTRAINT "donations_remaining_non_negative" CHECK ("donations"."remaining_quantity" >= 0),
	CONSTRAINT "donations_remaining_lte_quantity" CHECK ("donations"."remaining_quantity" <= "donations"."quantity")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"donation_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_allergens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "food_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" uuid,
	"icon" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "recipient_needs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"organization_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"category_id" uuid,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit" "quantity_unit" DEFAULT 'servings' NOT NULL,
	"needed_by" timestamp with time zone,
	"fulfilled_at" timestamp with time zone,
	"notes" text,
	CONSTRAINT "recipient_needs_quantity_non_negative" CHECK ("recipient_needs"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "claim_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"claim_id" uuid NOT NULL,
	"donation_item_id" uuid,
	"quantity" integer NOT NULL,
	CONSTRAINT "claim_items_quantity_non_negative" CHECK ("claim_items"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"donation_id" uuid NOT NULL,
	"recipient_org_id" uuid NOT NULL,
	"claimed_by_user_id" uuid NOT NULL,
	"status" "claim_status" DEFAULT 'pending' NOT NULL,
	"quantity" integer NOT NULL,
	"unit" "quantity_unit" DEFAULT 'servings' NOT NULL,
	"expires_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	CONSTRAINT "claims_quantity_non_negative" CHECK ("claims"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "donation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"donation_id" uuid NOT NULL,
	"claim_id" uuid,
	"actor_type" "transition_actor" NOT NULL,
	"actor_id" text,
	"from_status" text,
	"to_status" text NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"data" jsonb,
	"read_at" timestamp with time zone,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pickup_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"task_id" uuid NOT NULL,
	"volunteer_id" uuid NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pickup_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"donation_id" uuid NOT NULL,
	"claim_id" uuid,
	"status" "pickup_task_status" DEFAULT 'unassigned' NOT NULL,
	"window_start" timestamp with time zone,
	"window_end" timestamp with time zone,
	"address" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"capacity_kg" integer,
	"notes" text,
	CONSTRAINT "pickup_tasks_capacity_non_negative" CHECK ("pickup_tasks"."capacity_kg" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ai_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"donation_id" uuid,
	"kind" text NOT NULL,
	"model" text NOT NULL,
	"input_hash" text,
	"result" jsonb NOT NULL,
	"confidence" numeric(5, 4),
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"actor_type" "transition_actor" NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"ip_address" text,
	"user_agent" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impact_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"organization_id" uuid NOT NULL,
	"donation_id" uuid,
	"claim_id" uuid,
	"metric" text NOT NULL,
	"value" integer NOT NULL,
	"unit" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "impact_records_value_non_negative" CHECK ("impact_records"."value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"reporter_id" uuid,
	"donation_id" uuid,
	"claim_id" uuid,
	"reason" text NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sync_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"operation_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"local_version" jsonb,
	"remote_version" jsonb,
	"resolution" "conflict_resolution" DEFAULT 'pending' NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sync_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"device_id" text NOT NULL,
	"user_id" uuid,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"operation" text NOT NULL,
	"payload" jsonb,
	"status" "sync_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"completed_at" timestamp with time zone,
	CONSTRAINT "sync_operations_attempts_non_negative" CHECK ("sync_operations"."attempts" >= 0)
);
--> statement-breakpoint
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor_profiles" ADD CONSTRAINT "donor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donor_profiles" ADD CONSTRAINT "donor_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipient_profiles" ADD CONSTRAINT "recipient_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipient_profiles" ADD CONSTRAINT "recipient_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_active_organization_id_organizations_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_allergens" ADD CONSTRAINT "donation_allergens_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_allergens" ADD CONSTRAINT "donation_allergens_allergen_id_food_allergens_id_fk" FOREIGN KEY ("allergen_id") REFERENCES "public"."food_allergens"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_images" ADD CONSTRAINT "donation_images_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_images" ADD CONSTRAINT "donation_images_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_items" ADD CONSTRAINT "donation_items_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_items" ADD CONSTRAINT "donation_items_category_id_food_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."food_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_category_id_food_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."food_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipient_needs" ADD CONSTRAINT "recipient_needs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipient_needs" ADD CONSTRAINT "recipient_needs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipient_needs" ADD CONSTRAINT "recipient_needs_category_id_food_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."food_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_items" ADD CONSTRAINT "claim_items_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_items" ADD CONSTRAINT "claim_items_donation_item_id_donation_items_id_fk" FOREIGN KEY ("donation_item_id") REFERENCES "public"."donation_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_recipient_org_id_organizations_id_fk" FOREIGN KEY ("recipient_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_claimed_by_user_id_users_id_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_events" ADD CONSTRAINT "donation_events_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_events" ADD CONSTRAINT "donation_events_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_assignments" ADD CONSTRAINT "pickup_assignments_task_id_pickup_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."pickup_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_assignments" ADD CONSTRAINT "pickup_assignments_volunteer_id_users_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_tasks" ADD CONSTRAINT "pickup_tasks_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_tasks" ADD CONSTRAINT "pickup_tasks_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_records" ADD CONSTRAINT "impact_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_records" ADD CONSTRAINT "impact_records_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_records" ADD CONSTRAINT "impact_records_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_operation_id_sync_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."sync_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_conflicts" ADD CONSTRAINT "sync_conflicts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_operations" ADD CONSTRAINT "sync_operations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "device_sessions_user_device_unique" ON "device_sessions" USING btree ("user_id","device_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_members_org_user_unique" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_members_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_unique" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_location_idx" ON "organizations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_active_org_idx" ON "users" USING btree ("active_organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "donation_allergens_unique" ON "donation_allergens" USING btree ("donation_id","allergen_id");--> statement-breakpoint
CREATE INDEX "donation_images_donation_idx" ON "donation_images" USING btree ("donation_id");--> statement-breakpoint
CREATE INDEX "donation_items_donation_idx" ON "donation_items" USING btree ("donation_id");--> statement-breakpoint
CREATE INDEX "donations_status_expiry_idx" ON "donations" USING btree ("status","food_expiry_at");--> statement-breakpoint
CREATE INDEX "donations_status_deadline_idx" ON "donations" USING btree ("status","pickup_deadline_at");--> statement-breakpoint
CREATE INDEX "donations_organization_idx" ON "donations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "donations_category_idx" ON "donations" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "donations_location_idx" ON "donations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_donation_unique" ON "favorites" USING btree ("user_id","donation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "food_categories_slug_unique" ON "food_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "food_categories_parent_idx" ON "food_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "recipient_needs_org_idx" ON "recipient_needs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "recipient_needs_category_idx" ON "recipient_needs" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "claim_items_claim_idx" ON "claim_items" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "claims_donation_status_idx" ON "claims" USING btree ("donation_id","status");--> statement-breakpoint
CREATE INDEX "claims_recipient_status_idx" ON "claims" USING btree ("recipient_org_id","status");--> statement-breakpoint
CREATE INDEX "claims_status_expiry_idx" ON "claims" USING btree ("status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "claims_active_donation_org_unique" ON "claims" USING btree ("donation_id","recipient_org_id") WHERE "claims"."status" not in ('cancelled', 'expired');--> statement-breakpoint
CREATE INDEX "donation_events_donation_time_idx" ON "donation_events" USING btree ("donation_id","occurred_at");--> statement-breakpoint
CREATE INDEX "donation_events_claim_idx" ON "donation_events" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pickup_assignments_task_volunteer_unique" ON "pickup_assignments" USING btree ("task_id","volunteer_id");--> statement-breakpoint
CREATE INDEX "pickup_assignments_volunteer_idx" ON "pickup_assignments" USING btree ("volunteer_id");--> statement-breakpoint
CREATE INDEX "pickup_tasks_donation_idx" ON "pickup_tasks" USING btree ("donation_id");--> statement-breakpoint
CREATE INDEX "pickup_tasks_status_window_idx" ON "pickup_tasks" USING btree ("status","window_start");--> statement-breakpoint
CREATE INDEX "ai_analysis_donation_idx" ON "ai_analysis" USING btree ("donation_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_occurred_idx" ON "audit_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "impact_records_org_metric_idx" ON "impact_records" USING btree ("organization_id","metric");--> statement-breakpoint
CREATE INDEX "impact_records_recorded_idx" ON "impact_records" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_donation_idx" ON "reports" USING btree ("donation_id");--> statement-breakpoint
CREATE INDEX "sync_conflicts_operation_idx" ON "sync_conflicts" USING btree ("operation_id");--> statement-breakpoint
CREATE INDEX "sync_operations_device_status_idx" ON "sync_operations" USING btree ("device_id","status");--> statement-breakpoint
CREATE INDEX "sync_operations_status_idx" ON "sync_operations" USING btree ("status");