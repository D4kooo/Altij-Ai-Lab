-- API Usage Tracking table
CREATE TABLE IF NOT EXISTS "api_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "model" text NOT NULL,
  "prompt_tokens" integer DEFAULT 0 NOT NULL,
  "completion_tokens" integer DEFAULT 0 NOT NULL,
  "total_tokens" integer DEFAULT 0 NOT NULL,
  "cost_estimate" real DEFAULT 0 NOT NULL,
  "source" text NOT NULL,
  "conversation_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Index for querying usage by user and date
CREATE INDEX IF NOT EXISTS "api_usage_user_id_idx" ON "api_usage" ("user_id");
CREATE INDEX IF NOT EXISTS "api_usage_created_at_idx" ON "api_usage" ("created_at");

-- Add credit_limit column to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credit_limit" real;
