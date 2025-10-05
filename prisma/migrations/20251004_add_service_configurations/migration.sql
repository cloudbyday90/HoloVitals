-- CreateTable: Service Configuration
CREATE TABLE "service_configurations" (
    "id" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "configuration" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "service_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GitHub Configuration
CREATE TABLE "github_configurations" (
    "id" TEXT NOT NULL,
    "personal_access_token" TEXT NOT NULL,
    "token_name" TEXT,
    "scopes" TEXT,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "github_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_configurations_service_name_key" ON "service_configurations"("service_name");

-- CreateIndex
CREATE INDEX "service_configurations_service_name_idx" ON "service_configurations"("service_name");