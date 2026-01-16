-- Add is_staff column for Data Ring staff members
-- Staff members have access to Lab tools (Assistants, Automations, Veille, etc.)
-- Non-staff (citizens) only have access to public features (School, Citizen Tools, Actions)

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_staff" boolean DEFAULT false NOT NULL;

-- Update existing users: set all current users as staff (they were the original Data Ring members)
UPDATE "users" SET "is_staff" = true WHERE "is_staff" = false;
