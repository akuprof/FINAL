CREATE TYPE "public"."checklist_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."fuel_record_type" AS ENUM('refuel', 'distribution', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'approved', 'rejected', 'paid');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('pending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'driver');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('active', 'maintenance', 'inactive');--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" varchar,
	"vehicle_id" varchar,
	"assigned_at" timestamp DEFAULT now(),
	"unassigned_at" timestamp,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_id" varchar,
	"item_name" varchar NOT NULL,
	"item_category" varchar NOT NULL,
	"is_checked" boolean DEFAULT false,
	"condition" varchar,
	"quantity" integer,
	"notes" text,
	"image_url" varchar
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"document_type" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_path" varchar NOT NULL,
	"file_size" integer,
	"uploaded_at" timestamp DEFAULT now(),
	"expiry_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "driver_checklists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" varchar,
	"vehicle_id" varchar,
	"checklist_type" varchar NOT NULL,
	"status" "checklist_status" DEFAULT 'pending',
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"employee_id" varchar NOT NULL,
	"phone_number" varchar,
	"address" text,
	"license_number" varchar,
	"license_expiry_date" timestamp,
	"date_of_birth" timestamp,
	"emergency_contact" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "drivers_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "drivers_license_number_unique" UNIQUE("license_number")
);
--> statement-breakpoint
CREATE TABLE "fuel_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" varchar,
	"driver_id" varchar,
	"fuel_station_id" varchar,
	"record_type" "fuel_record_type" NOT NULL,
	"fuel_type" varchar NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"price_per_liter" numeric(10, 2) NOT NULL,
	"total_cost" numeric(10, 2) NOT NULL,
	"odometer_reading" integer,
	"receipt_number" varchar,
	"notes" text,
	"refuel_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fuel_stations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"location" text NOT NULL,
	"contact_person" varchar,
	"phone" varchar,
	"contract_details" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" varchar,
	"driver_id" varchar,
	"vehicle_id" varchar,
	"incident_type" varchar NOT NULL,
	"description" text NOT NULL,
	"damage_amount" numeric(10, 2),
	"reported_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	"is_resolved" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_name" varchar NOT NULL,
	"item_code" varchar,
	"category" varchar NOT NULL,
	"current_stock" integer DEFAULT 0,
	"minimum_stock" integer DEFAULT 0,
	"max_stock" integer,
	"unit_price" numeric(10, 2),
	"location" varchar,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "inventory_items_item_code_unique" UNIQUE("item_code")
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" varchar,
	"maintenance_type" varchar NOT NULL,
	"description" text NOT NULL,
	"status" "maintenance_status" DEFAULT 'scheduled',
	"scheduled_date" timestamp,
	"completed_date" timestamp,
	"cost" numeric(10, 2),
	"service_provider" varchar,
	"odometer_reading" integer,
	"next_service_due" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "maintenance_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"maintenance_record_id" varchar,
	"task_name" varchar NOT NULL,
	"description" text,
	"is_completed" boolean DEFAULT false,
	"assigned_to" varchar,
	"completed_by" varchar,
	"estimated_duration" integer,
	"actual_duration" integer,
	"parts_used" text,
	"cost" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" varchar,
	"driver_id" varchar,
	"revenue" numeric(10, 2) NOT NULL,
	"calculated_amount" numeric(10, 2) NOT NULL,
	"approved_amount" numeric(10, 2),
	"status" "payout_status" DEFAULT 'pending',
	"approved_by" varchar,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" varchar,
	"vehicle_id" varchar,
	"pickup_location" text NOT NULL,
	"drop_location" text NOT NULL,
	"distance" numeric(10, 2),
	"revenue" numeric(10, 2) NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"status" "trip_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'driver',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_number" varchar NOT NULL,
	"make" varchar NOT NULL,
	"model" varchar NOT NULL,
	"year" integer,
	"capacity" integer,
	"fuel_type" varchar,
	"insurance_number" varchar,
	"insurance_expiry_date" timestamp,
	"permit_number" varchar,
	"permit_expiry_date" timestamp,
	"status" "vehicle_status" DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vehicles_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_driver_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."driver_checklists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_checklists" ADD CONSTRAINT "driver_checklists_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_checklists" ADD CONSTRAINT "driver_checklists_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_fuel_station_id_fuel_stations_id_fk" FOREIGN KEY ("fuel_station_id") REFERENCES "public"."fuel_stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_maintenance_record_id_maintenance_records_id_fk" FOREIGN KEY ("maintenance_record_id") REFERENCES "public"."maintenance_records"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");