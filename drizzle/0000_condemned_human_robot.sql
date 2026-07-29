CREATE TABLE "ai_problems" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer,
	"stage_id" integer,
	"reported_by" integer,
	"category" text,
	"description" text,
	"status" text DEFAULT 'Open',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_solutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"problem_id" integer,
	"ai_suggestion" text,
	"final_solution" text,
	"approved_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"linked_type" text,
	"linked_id" integer,
	"requested_by" integer,
	"approved_by" integer,
	"status" text DEFAULT 'Pending',
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checklist_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"response_id" integer,
	"item_id" integer,
	"answer_value" text,
	"remarks" text,
	"quantity" real,
	"photo_metadata" text
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer,
	"question_text" text,
	"answer_type" text,
	"is_mandatory" integer DEFAULT 1,
	"requires_photo" integer DEFAULT 0,
	"order_no" integer
);
--> statement-breakpoint
CREATE TABLE "checklist_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer,
	"site_id" integer,
	"filled_by" integer,
	"status" text DEFAULT 'Draft',
	"submitted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "checklist_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"stage_id" integer,
	"name" text,
	"is_active" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"config" text,
	"is_enabled" integer DEFAULT 0,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "integrations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text,
	"details" text,
	"site_id" integer,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer,
	"receiver_id" integer,
	"content" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"message" text,
	"type" text,
	"is_read" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"linked_type" text,
	"linked_id" integer,
	"site_id" integer,
	"uploaded_by" integer,
	"file_path" text,
	"is_locked" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reports_ai_weekly" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_start" text,
	"summary" text,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "safety_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer,
	"reported_by" integer,
	"category" text,
	"description" text,
	"severity" text,
	"photo_proof" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text,
	"site_custom_id" text,
	"name" text,
	"district" text,
	"client" text,
	"client_site_id" text,
	"location" text,
	"latitude" real,
	"longitude" real,
	"current_stage_id" integer,
	"supervisor_id" integer,
	"vendor_id" integer,
	"status" text DEFAULT 'On Time',
	"stage_started_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stage_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer,
	"from_stage_id" integer,
	"to_stage_id" integer,
	"changed_by" integer,
	"change_date" timestamp DEFAULT now(),
	"approved_by" integer,
	"delay_reason" text
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"sequence_order" integer,
	"max_allowed_days" integer,
	"working_principle" text,
	"necessary_functions" text,
	"assigned_role" text DEFAULT 'Site Supervisor',
	"attendance_mode" text DEFAULT 'Free for All Users',
	"who_assigns_work" text DEFAULT 'Project Manager',
	"approver_role" text DEFAULT 'Project Manager',
	"required_checklist_id" integer
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text,
	"description" text,
	"type" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_id" integer,
	"assigned_to" integer,
	"title" text,
	"description" text,
	"status" text DEFAULT 'Pending',
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text,
	"full_name" text,
	"phone" text,
	"phone_verified" integer DEFAULT 0,
	"email" text NOT NULL,
	"password_hash" text,
	"role_id" integer,
	"status" text DEFAULT 'Active',
	"language_preference" text DEFAULT 'English',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "warehouse_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"category" text,
	"unit" text,
	"min_stock" real
);
--> statement-breakpoint
CREATE TABLE "warehouse_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer,
	"type" text,
	"quantity" real,
	"site_id" integer,
	"user_id" integer,
	"photo_proof" text,
	"remarks" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_problems" ADD CONSTRAINT "ai_problems_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_problems" ADD CONSTRAINT "ai_problems_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_problems" ADD CONSTRAINT "ai_problems_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_solutions" ADD CONSTRAINT "ai_solutions_problem_id_ai_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."ai_problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_solutions" ADD CONSTRAINT "ai_solutions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_answers" ADD CONSTRAINT "checklist_answers_response_id_checklist_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."checklist_responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_answers" ADD CONSTRAINT "checklist_answers_item_id_checklist_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."checklist_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_filled_by_users_id_fk" FOREIGN KEY ("filled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_logs" ADD CONSTRAINT "safety_logs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_logs" ADD CONSTRAINT "safety_logs_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_current_stage_id_stages_id_fk" FOREIGN KEY ("current_stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_from_stage_id_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_to_stage_id_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_material_id_warehouse_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."warehouse_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;