-- Add role column to User table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'role'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'PATIENT';
  END IF;
END $$;

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- Update existing users to have PATIENT role if null
UPDATE "User" SET "role" = 'PATIENT' WHERE "role" IS NULL;

-- Add AccessLog table for audit logging
CREATE TABLE IF NOT EXISTS "AccessLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "allowed" BOOLEAN NOT NULL,
  "reason" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for AccessLog
CREATE INDEX IF NOT EXISTS "AccessLog_userId_idx" ON "AccessLog"("userId");
CREATE INDEX IF NOT EXISTS "AccessLog_timestamp_idx" ON "AccessLog"("timestamp");
CREATE INDEX IF NOT EXISTS "AccessLog_allowed_idx" ON "AccessLog"("allowed");
CREATE INDEX IF NOT EXISTS "AccessLog_resourceType_idx" ON "AccessLog"("resourceType");

-- Add comment explaining the role system
COMMENT ON COLUMN "User"."role" IS 'User role: OWNER, ADMIN, DOCTOR, PATIENT, SUPPORT, ANALYST';