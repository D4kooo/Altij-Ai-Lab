-- Migration: Add audit_logs table for security tracking
-- Created: Production security hardening

CREATE TYPE "public"."audit_action" AS ENUM(
  'login',
  'logout',
  'login_failed',
  'user_created',
  'user_updated',
  'user_deleted',
  'role_assigned',
  'role_removed',
  'permission_granted',
  'permission_revoked',
  'automation_run',
  'settings_changed',
  'security_alert'
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "action" "audit_action" NOT NULL,
  "resource_type" text,
  "resource_id" text,
  "details" jsonb,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Add foreign key constraint (nullable, SET NULL on delete)
ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_user_id_users_id_fk"
  FOREIGN KEY ("user_id")
  REFERENCES "public"."users"("id")
  ON DELETE SET NULL
  ON UPDATE NO ACTION;--> statement-breakpoint

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" ("created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_resource_idx" ON "audit_logs" ("resource_type", "resource_id");
