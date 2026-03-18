-- Account type enum
CREATE TYPE "account_type" AS ENUM ('particulier', 'organisation');

-- Add account_type, organization_name, organization_role columns to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_type" "account_type" DEFAULT 'particulier';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "organization_name" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "organization_role" text;
