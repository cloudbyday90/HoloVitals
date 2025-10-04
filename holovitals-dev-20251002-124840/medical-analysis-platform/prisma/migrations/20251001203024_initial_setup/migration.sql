-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('BASIC', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'TRIAL');

-- CreateEnum
CREATE TYPE "TokenTransactionType" AS ENUM ('INITIAL_DEPOSIT', 'MONTHLY_REFRESH', 'PURCHASE', 'DEDUCTION', 'REFUND', 'BONUS', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "FileProcessingStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "EHRProvider" AS ENUM ('EPIC', 'CERNER', 'ALLSCRIPTS', 'ATHENAHEALTH', 'ECLINICALWORKS', 'NEXTGEN', 'MEDITECH', 'PRACTICE_FUSION', 'GREENWAY', 'OTHER');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('IDLE', 'QUEUED', 'SYNCING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FHIRResourceType" AS ENUM ('PATIENT', 'DOCUMENT_REFERENCE', 'OBSERVATION', 'CONDITION', 'MEDICATION_REQUEST', 'ALLERGY_INTOLERANCE', 'IMMUNIZATION', 'PROCEDURE', 'DIAGNOSTIC_REPORT', 'CARE_PLAN', 'ENCOUNTER', 'PRACTITIONER', 'ORGANIZATION', 'OTHER');

-- CreateEnum
CREATE TYPE "BulkExportType" AS ENUM ('PATIENT', 'GROUP', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BulkExportStatus" AS ENUM ('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PATIENT',
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "mfa_backup_codes" TEXT,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_failed_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "document_type" TEXT,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "document_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_results" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "raw_text" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocr_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracted_data" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "data_type" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_value" TEXT NOT NULL,
    "unit" TEXT,
    "reference_range" TEXT,
    "is_abnormal" BOOLEAN,
    "extracted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extracted_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_links" (
    "id" TEXT NOT NULL,
    "source_document_id" TEXT NOT NULL,
    "target_document_id" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_embeddings" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "session_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interactions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT,
    "context_documents" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'quick',
    "confidence" DOUBLE PRECISION,
    "needsEscalation" BOOLEAN NOT NULL DEFAULT false,
    "escalationReason" TEXT,
    "escalatedToTaskId" TEXT,
    "documentId" TEXT,
    "analysisId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_queue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "prompt" TEXT NOT NULL,
    "documents" JSONB NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "contextWindow" INTEGER NOT NULL,
    "needsSplitting" BOOLEAN NOT NULL DEFAULT false,
    "splitStrategy" TEXT,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "recommendedModel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "instanceId" TEXT,
    "actualCost" DOUBLE PRECISION,

    CONSTRAINT "analysis_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud_instances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "provider" TEXT NOT NULL,
    "instanceType" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "cloudInstanceId" TEXT,
    "publicIp" TEXT,
    "privateIp" TEXT,
    "status" TEXT NOT NULL,
    "diskSizeGB" INTEGER NOT NULL DEFAULT 100,
    "autoTerminateMinutes" INTEGER NOT NULL DEFAULT 60,
    "costPerHour" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purpose" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cloud_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_costs" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "instanceType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "terminatedAt" TIMESTAMP(3) NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "costPerMinute" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "tokensProcessed" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "instance_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_costs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',

    CONSTRAINT "chatbot_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_costs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "modelCost" DOUBLE PRECISION NOT NULL,
    "infrastructureCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "model" TEXT NOT NULL,
    "instanceType" TEXT,
    "duration" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "analysis_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_optimizations" (
    "id" TEXT NOT NULL,
    "originalPrompt" TEXT NOT NULL,
    "originalTokens" INTEGER NOT NULL,
    "optimizedPrompt" TEXT NOT NULL,
    "optimizedTokens" INTEGER NOT NULL,
    "strategy" TEXT NOT NULL,
    "tokenReduction" INTEGER NOT NULL,
    "reductionPercent" DOUBLE PRECISION NOT NULL,
    "executionTime" DOUBLE PRECISION,
    "successRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "prompt_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_splits" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "splitId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "dependencies" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "prompt_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_performance" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "avgResponseTime" DOUBLE PRECISION NOT NULL,
    "avgTokensPerSecond" DOUBLE PRECISION NOT NULL,
    "successRate" DOUBLE PRECISION NOT NULL,
    "errorRate" DOUBLE PRECISION NOT NULL,
    "avgCostPerRequest" DOUBLE PRECISION NOT NULL,
    "avgCostPerToken" DOUBLE PRECISION NOT NULL,
    "totalRequests" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "model_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_health" (
    "id" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseTime" DOUBLE PRECISION,
    "errorRate" DOUBLE PRECISION,
    "throughput" DOUBLE PRECISION,
    "cpuUsage" DOUBLE PRECISION,
    "memoryUsage" DOUBLE PRECISION,
    "diskUsage" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,
    "metadata" JSONB,

    CONSTRAINT "system_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_grants" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "specialist_id" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requested_duration" INTEGER NOT NULL,
    "urgency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "restrictions" TEXT,
    "granted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revocation_reason" TEXT,
    "denial_reason" TEXT,
    "last_accessed" TIMESTAMP(3),
    "access_count" INTEGER NOT NULL DEFAULT 0,
    "expiration_warning_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL,
    "consent_id" TEXT NOT NULL,
    "specialist_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "session_id" TEXT,
    "severity" TEXT NOT NULL,
    "requires_review" BOOLEAN NOT NULL DEFAULT false,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "consent_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "requires_action" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'high',
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_repositories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "primary_identity_hash" TEXT NOT NULL,
    "secondary_identity_hash" TEXT NOT NULL,
    "composite_identity_hash" TEXT NOT NULL,
    "encrypted_personal_info" TEXT NOT NULL,
    "has_mothers_maiden_name" BOOLEAN NOT NULL DEFAULT false,
    "has_previous_address" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_accessed_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "patient_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_diagnoses" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "icd10_code" TEXT,
    "diagnosed_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_medications" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "prescribed_by" TEXT,
    "purpose" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_allergies" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "diagnosed_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_vital_signs" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "blood_pressure_systolic" INTEGER,
    "blood_pressure_diastolic" INTEGER,
    "heart_rate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "oxygen_saturation" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_procedures" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "performed_by" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_immunizations" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dose_number" INTEGER,
    "administered_by" TEXT,
    "lot_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_immunizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_family_history" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "age_at_diagnosis" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_family_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_challenges" (
    "id" TEXT NOT NULL,
    "repository_id" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextOptimization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalTokens" INTEGER NOT NULL,
    "optimizedTokens" INTEGER NOT NULL,
    "reductionPercentage" DOUBLE PRECISION NOT NULL,
    "strategy" TEXT NOT NULL,
    "compressionRatio" DOUBLE PRECISION NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "informationDensity" DOUBLE PRECISION NOT NULL,
    "processingTimeMs" INTEGER NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContextOptimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "data" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 2,
    "estimatedCompletionTime" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "AnalysisTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "code" TEXT,
    "statusCode" INTEGER,
    "stack" TEXT,
    "details" TEXT,
    "userId" TEXT,
    "requestId" TEXT,
    "endpoint" TEXT,
    "method" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "monthly_price" DOUBLE PRECISION NOT NULL,
    "billing_cycle_start" TIMESTAMP(3) NOT NULL,
    "billing_cycle_end" TIMESTAMP(3) NOT NULL,
    "next_billing_date" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_history" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "from_tier" "SubscriptionTier",
    "to_tier" "SubscriptionTier" NOT NULL,
    "from_status" "SubscriptionStatus",
    "to_status" "SubscriptionStatus" NOT NULL,
    "reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_balances" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "current_balance" INTEGER NOT NULL DEFAULT 0,
    "total_earned" INTEGER NOT NULL DEFAULT 0,
    "total_used" INTEGER NOT NULL DEFAULT 0,
    "total_purchased" INTEGER NOT NULL DEFAULT 0,
    "free_upload_used" INTEGER NOT NULL DEFAULT 0,
    "last_refresh_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_transactions" (
    "id" TEXT NOT NULL,
    "token_balance_id" TEXT NOT NULL,
    "type" "TokenTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "description" TEXT,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "status" "FileProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "estimated_tokens" INTEGER,
    "estimated_cost" DOUBLE PRECISION,
    "actual_tokens" INTEGER,
    "actual_cost" DOUBLE PRECISION,
    "processing_started_at" TIMESTAMP(3),
    "processing_completed_at" TIMESTAMP(3),
    "scheduled_months" INTEGER,
    "current_month" INTEGER,
    "error_message" TEXT,
    "used_free_upload" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "payment_method" TEXT,
    "payment_method_id" TEXT,
    "tokens_purchased" INTEGER,
    "description" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rbac_access_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "allowed" BOOLEAN NOT NULL,
    "reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rbac_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "metadata" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ehr_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "EHRProvider" NOT NULL,
    "provider_name" TEXT NOT NULL,
    "fhir_base_url" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "patient_id" TEXT,
    "patient_name" TEXT,
    "auto_sync" BOOLEAN NOT NULL DEFAULT true,
    "sync_frequency" INTEGER NOT NULL DEFAULT 24,
    "last_sync_at" TIMESTAMP(3),
    "next_sync_at" TIMESTAMP(3),
    "metadata" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ehr_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fhir_resources" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "resource_type" "FHIRResourceType" NOT NULL,
    "fhir_id" TEXT NOT NULL,
    "fhir_version" TEXT NOT NULL DEFAULT 'R4',
    "raw_data" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "category" TEXT,
    "status" TEXT,
    "content_type" TEXT,
    "content_url" TEXT,
    "content_size" INTEGER,
    "document_downloaded" BOOLEAN NOT NULL DEFAULT false,
    "local_file_path" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "tokens_used" INTEGER,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fhir_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_history" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'QUEUED',
    "sync_type" TEXT NOT NULL DEFAULT 'incremental',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "resources_queried" INTEGER NOT NULL DEFAULT 0,
    "resources_created" INTEGER NOT NULL DEFAULT 0,
    "resources_updated" INTEGER NOT NULL DEFAULT 0,
    "resources_skipped" INTEGER NOT NULL DEFAULT 0,
    "resources_failed" INTEGER NOT NULL DEFAULT 0,
    "documents_downloaded" INTEGER NOT NULL DEFAULT 0,
    "total_bytes_downloaded" BIGINT NOT NULL DEFAULT 0,
    "tokens_estimated" INTEGER,
    "tokens_used" INTEGER,
    "cost_estimated" DOUBLE PRECISION,
    "cost_actual" DOUBLE PRECISION,
    "error_message" TEXT,
    "error_details" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_configurations" (
    "id" TEXT NOT NULL,
    "provider" "EHRProvider" NOT NULL,
    "provider_name" TEXT NOT NULL,
    "fhir_base_url" TEXT NOT NULL,
    "authorization_url" TEXT NOT NULL,
    "token_url" TEXT NOT NULL,
    "client_id" TEXT,
    "client_secret" TEXT,
    "redirect_uri" TEXT,
    "scopes" TEXT NOT NULL,
    "supports_document_reference" BOOLEAN NOT NULL DEFAULT true,
    "supports_observation" BOOLEAN NOT NULL DEFAULT true,
    "supports_condition" BOOLEAN NOT NULL DEFAULT true,
    "supports_medication" BOOLEAN NOT NULL DEFAULT true,
    "supports_allergy" BOOLEAN NOT NULL DEFAULT true,
    "supports_immunization" BOOLEAN NOT NULL DEFAULT true,
    "supports_procedure" BOOLEAN NOT NULL DEFAULT true,
    "rate_limit" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_sandbox" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_export_jobs" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "export_type" "BulkExportType" NOT NULL,
    "status" "BulkExportStatus" NOT NULL DEFAULT 'INITIATED',
    "kickoff_url" TEXT,
    "status_url" TEXT,
    "output_urls" TEXT,
    "resource_types" TEXT,
    "since" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "resource_count" INTEGER NOT NULL DEFAULT 0,
    "total_size" BIGINT NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "error_details" TEXT,
    "metadata" TEXT,

    CONSTRAINT "bulk_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epic_specific_data" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "extensions" TEXT,
    "custom_fields" TEXT,
    "clinical_notes" TEXT,
    "lab_result_details" TEXT,
    "imaging_metadata" TEXT,
    "care_plan_details" TEXT,
    "encounter_details" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epic_specific_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "document_links_source_document_id_target_document_id_key" ON "document_links"("source_document_id", "target_document_id");

-- CreateIndex
CREATE INDEX "chat_conversations_userId_idx" ON "chat_conversations"("userId");

-- CreateIndex
CREATE INDEX "chat_conversations_lastMessageAt_idx" ON "chat_conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_idx" ON "chat_messages"("conversationId");

-- CreateIndex
CREATE INDEX "chat_messages_timestamp_idx" ON "chat_messages"("timestamp");

-- CreateIndex
CREATE INDEX "analysis_queue_userId_idx" ON "analysis_queue"("userId");

-- CreateIndex
CREATE INDEX "analysis_queue_status_idx" ON "analysis_queue"("status");

-- CreateIndex
CREATE INDEX "analysis_queue_priority_createdAt_idx" ON "analysis_queue"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "analysis_queue_createdAt_idx" ON "analysis_queue"("createdAt");

-- CreateIndex
CREATE INDEX "cloud_instances_userId_idx" ON "cloud_instances"("userId");

-- CreateIndex
CREATE INDEX "cloud_instances_taskId_idx" ON "cloud_instances"("taskId");

-- CreateIndex
CREATE INDEX "cloud_instances_status_idx" ON "cloud_instances"("status");

-- CreateIndex
CREATE INDEX "cloud_instances_provider_idx" ON "cloud_instances"("provider");

-- CreateIndex
CREATE INDEX "cloud_instances_createdAt_idx" ON "cloud_instances"("createdAt");

-- CreateIndex
CREATE INDEX "instance_costs_createdAt_idx" ON "instance_costs"("createdAt");

-- CreateIndex
CREATE INDEX "instance_costs_provider_idx" ON "instance_costs"("provider");

-- CreateIndex
CREATE INDEX "instance_costs_model_idx" ON "instance_costs"("model");

-- CreateIndex
CREATE INDEX "chatbot_costs_userId_idx" ON "chatbot_costs"("userId");

-- CreateIndex
CREATE INDEX "chatbot_costs_timestamp_idx" ON "chatbot_costs"("timestamp");

-- CreateIndex
CREATE INDEX "analysis_costs_userId_idx" ON "analysis_costs"("userId");

-- CreateIndex
CREATE INDEX "analysis_costs_timestamp_idx" ON "analysis_costs"("timestamp");

-- CreateIndex
CREATE INDEX "prompt_optimizations_createdAt_idx" ON "prompt_optimizations"("createdAt");

-- CreateIndex
CREATE INDEX "prompt_splits_taskId_idx" ON "prompt_splits"("taskId");

-- CreateIndex
CREATE INDEX "prompt_splits_order_idx" ON "prompt_splits"("order");

-- CreateIndex
CREATE INDEX "model_performance_model_idx" ON "model_performance"("model");

-- CreateIndex
CREATE INDEX "model_performance_periodStart_idx" ON "model_performance"("periodStart");

-- CreateIndex
CREATE INDEX "system_health_component_idx" ON "system_health"("component");

-- CreateIndex
CREATE INDEX "system_health_timestamp_idx" ON "system_health"("timestamp");

-- CreateIndex
CREATE INDEX "system_health_status_idx" ON "system_health"("status");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "consent_grants_patient_id_idx" ON "consent_grants"("patient_id");

-- CreateIndex
CREATE INDEX "consent_grants_specialist_id_idx" ON "consent_grants"("specialist_id");

-- CreateIndex
CREATE INDEX "consent_grants_status_idx" ON "consent_grants"("status");

-- CreateIndex
CREATE INDEX "consent_grants_expires_at_idx" ON "consent_grants"("expires_at");

-- CreateIndex
CREATE INDEX "access_logs_consent_id_idx" ON "access_logs"("consent_id");

-- CreateIndex
CREATE INDEX "access_logs_specialist_id_idx" ON "access_logs"("specialist_id");

-- CreateIndex
CREATE INDEX "access_logs_timestamp_idx" ON "access_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_requires_review_idx" ON "audit_logs"("requires_review");

-- CreateIndex
CREATE INDEX "notifications_patient_id_idx" ON "notifications"("patient_id");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "security_alerts_user_id_idx" ON "security_alerts"("user_id");

-- CreateIndex
CREATE INDEX "security_alerts_acknowledged_idx" ON "security_alerts"("acknowledged");

-- CreateIndex
CREATE INDEX "security_alerts_created_at_idx" ON "security_alerts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "patient_repositories_user_id_key" ON "patient_repositories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_repositories_primary_identity_hash_key" ON "patient_repositories"("primary_identity_hash");

-- CreateIndex
CREATE UNIQUE INDEX "patient_repositories_composite_identity_hash_key" ON "patient_repositories"("composite_identity_hash");

-- CreateIndex
CREATE INDEX "patient_repositories_user_id_idx" ON "patient_repositories"("user_id");

-- CreateIndex
CREATE INDEX "patient_repositories_composite_identity_hash_idx" ON "patient_repositories"("composite_identity_hash");

-- CreateIndex
CREATE INDEX "patient_diagnoses_repository_id_idx" ON "patient_diagnoses"("repository_id");

-- CreateIndex
CREATE INDEX "patient_diagnoses_diagnosed_date_idx" ON "patient_diagnoses"("diagnosed_date");

-- CreateIndex
CREATE INDEX "patient_medications_repository_id_idx" ON "patient_medications"("repository_id");

-- CreateIndex
CREATE INDEX "patient_medications_status_idx" ON "patient_medications"("status");

-- CreateIndex
CREATE INDEX "patient_allergies_repository_id_idx" ON "patient_allergies"("repository_id");

-- CreateIndex
CREATE INDEX "patient_vital_signs_repository_id_idx" ON "patient_vital_signs"("repository_id");

-- CreateIndex
CREATE INDEX "patient_vital_signs_date_idx" ON "patient_vital_signs"("date");

-- CreateIndex
CREATE INDEX "patient_procedures_repository_id_idx" ON "patient_procedures"("repository_id");

-- CreateIndex
CREATE INDEX "patient_procedures_date_idx" ON "patient_procedures"("date");

-- CreateIndex
CREATE INDEX "patient_immunizations_repository_id_idx" ON "patient_immunizations"("repository_id");

-- CreateIndex
CREATE INDEX "patient_immunizations_date_idx" ON "patient_immunizations"("date");

-- CreateIndex
CREATE INDEX "patient_family_history_repository_id_idx" ON "patient_family_history"("repository_id");

-- CreateIndex
CREATE INDEX "identity_challenges_repository_id_idx" ON "identity_challenges"("repository_id");

-- CreateIndex
CREATE INDEX "identity_challenges_expires_at_idx" ON "identity_challenges"("expires_at");

-- CreateIndex
CREATE INDEX "ContextOptimization_userId_idx" ON "ContextOptimization"("userId");

-- CreateIndex
CREATE INDEX "ContextOptimization_createdAt_idx" ON "ContextOptimization"("createdAt");

-- CreateIndex
CREATE INDEX "ContextOptimization_strategy_idx" ON "ContextOptimization"("strategy");

-- CreateIndex
CREATE INDEX "AnalysisTask_userId_idx" ON "AnalysisTask"("userId");

-- CreateIndex
CREATE INDEX "AnalysisTask_status_idx" ON "AnalysisTask"("status");

-- CreateIndex
CREATE INDEX "AnalysisTask_priority_idx" ON "AnalysisTask"("priority");

-- CreateIndex
CREATE INDEX "AnalysisTask_type_idx" ON "AnalysisTask"("type");

-- CreateIndex
CREATE INDEX "AnalysisTask_createdAt_idx" ON "AnalysisTask"("createdAt");

-- CreateIndex
CREATE INDEX "error_logs_userId_idx" ON "error_logs"("userId");

-- CreateIndex
CREATE INDEX "error_logs_timestamp_idx" ON "error_logs"("timestamp");

-- CreateIndex
CREATE INDEX "error_logs_severity_idx" ON "error_logs"("severity");

-- CreateIndex
CREATE INDEX "error_logs_code_idx" ON "error_logs"("code");

-- CreateIndex
CREATE INDEX "error_logs_endpoint_idx" ON "error_logs"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_next_billing_date_idx" ON "subscriptions"("next_billing_date");

-- CreateIndex
CREATE INDEX "subscription_history_subscription_id_idx" ON "subscription_history"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_history_changed_at_idx" ON "subscription_history"("changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "token_balances_user_id_key" ON "token_balances"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "token_balances_subscription_id_key" ON "token_balances"("subscription_id");

-- CreateIndex
CREATE INDEX "token_balances_user_id_idx" ON "token_balances"("user_id");

-- CreateIndex
CREATE INDEX "token_balances_subscription_id_idx" ON "token_balances"("subscription_id");

-- CreateIndex
CREATE INDEX "token_transactions_token_balance_id_idx" ON "token_transactions"("token_balance_id");

-- CreateIndex
CREATE INDEX "token_transactions_type_idx" ON "token_transactions"("type");

-- CreateIndex
CREATE INDEX "token_transactions_reference_id_idx" ON "token_transactions"("reference_id");

-- CreateIndex
CREATE INDEX "token_transactions_created_at_idx" ON "token_transactions"("created_at");

-- CreateIndex
CREATE INDEX "file_uploads_user_id_idx" ON "file_uploads"("user_id");

-- CreateIndex
CREATE INDEX "file_uploads_status_idx" ON "file_uploads"("status");

-- CreateIndex
CREATE INDEX "file_uploads_created_at_idx" ON "file_uploads"("created_at");

-- CreateIndex
CREATE INDEX "payment_intents_user_id_idx" ON "payment_intents"("user_id");

-- CreateIndex
CREATE INDEX "payment_intents_status_idx" ON "payment_intents"("status");

-- CreateIndex
CREATE INDEX "payment_intents_created_at_idx" ON "payment_intents"("created_at");

-- CreateIndex
CREATE INDEX "rbac_access_logs_user_id_idx" ON "rbac_access_logs"("user_id");

-- CreateIndex
CREATE INDEX "rbac_access_logs_timestamp_idx" ON "rbac_access_logs"("timestamp");

-- CreateIndex
CREATE INDEX "rbac_access_logs_allowed_idx" ON "rbac_access_logs"("allowed");

-- CreateIndex
CREATE INDEX "rbac_access_logs_resource_type_idx" ON "rbac_access_logs"("resource_type");

-- CreateIndex
CREATE INDEX "system_notifications_user_id_idx" ON "system_notifications"("user_id");

-- CreateIndex
CREATE INDEX "system_notifications_created_at_idx" ON "system_notifications"("created_at");

-- CreateIndex
CREATE INDEX "system_notifications_read_idx" ON "system_notifications"("read");

-- CreateIndex
CREATE INDEX "ehr_connections_user_id_idx" ON "ehr_connections"("user_id");

-- CreateIndex
CREATE INDEX "ehr_connections_status_idx" ON "ehr_connections"("status");

-- CreateIndex
CREATE INDEX "ehr_connections_provider_idx" ON "ehr_connections"("provider");

-- CreateIndex
CREATE INDEX "ehr_connections_next_sync_at_idx" ON "ehr_connections"("next_sync_at");

-- CreateIndex
CREATE INDEX "fhir_resources_connection_id_idx" ON "fhir_resources"("connection_id");

-- CreateIndex
CREATE INDEX "fhir_resources_resource_type_idx" ON "fhir_resources"("resource_type");

-- CreateIndex
CREATE INDEX "fhir_resources_date_idx" ON "fhir_resources"("date");

-- CreateIndex
CREATE INDEX "fhir_resources_processed_idx" ON "fhir_resources"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "fhir_resources_connection_id_fhir_id_resource_type_key" ON "fhir_resources"("connection_id", "fhir_id", "resource_type");

-- CreateIndex
CREATE INDEX "sync_history_connection_id_idx" ON "sync_history"("connection_id");

-- CreateIndex
CREATE INDEX "sync_history_status_idx" ON "sync_history"("status");

-- CreateIndex
CREATE INDEX "sync_history_started_at_idx" ON "sync_history"("started_at");

-- CreateIndex
CREATE INDEX "sync_history_created_at_idx" ON "sync_history"("created_at");

-- CreateIndex
CREATE INDEX "provider_configurations_provider_idx" ON "provider_configurations"("provider");

-- CreateIndex
CREATE INDEX "provider_configurations_enabled_idx" ON "provider_configurations"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "provider_configurations_provider_provider_name_key" ON "provider_configurations"("provider", "provider_name");

-- CreateIndex
CREATE INDEX "bulk_export_jobs_connection_id_idx" ON "bulk_export_jobs"("connection_id");

-- CreateIndex
CREATE INDEX "bulk_export_jobs_status_idx" ON "bulk_export_jobs"("status");

-- CreateIndex
CREATE INDEX "bulk_export_jobs_started_at_idx" ON "bulk_export_jobs"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "epic_specific_data_resource_id_key" ON "epic_specific_data"("resource_id");

-- CreateIndex
CREATE INDEX "epic_specific_data_resource_id_idx" ON "epic_specific_data"("resource_id");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_results" ADD CONSTRAINT "ocr_results_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_data" ADD CONSTRAINT "extracted_data_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_links" ADD CONSTRAINT "document_links_target_document_id_fkey" FOREIGN KEY ("target_document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_embeddings" ADD CONSTRAINT "document_embeddings_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_sessions" ADD CONSTRAINT "analysis_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_sessions" ADD CONSTRAINT "analysis_sessions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "analysis_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_queue" ADD CONSTRAINT "analysis_queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_queue" ADD CONSTRAINT "analysis_queue_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "cloud_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud_instances" ADD CONSTRAINT "cloud_instances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cloud_instances" ADD CONSTRAINT "cloud_instances_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "AnalysisTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_costs" ADD CONSTRAINT "chatbot_costs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_costs" ADD CONSTRAINT "analysis_costs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_grants" ADD CONSTRAINT "consent_grants_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_grants" ADD CONSTRAINT "consent_grants_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_consent_id_fkey" FOREIGN KEY ("consent_id") REFERENCES "consent_grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_diagnoses" ADD CONSTRAINT "patient_diagnoses_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "patient_repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_medications" ADD CONSTRAINT "patient_medications_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "patient_repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_allergies" ADD CONSTRAINT "patient_allergies_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "patient_repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_vital_signs" ADD CONSTRAINT "patient_vital_signs_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "patient_repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_procedures" ADD CONSTRAINT "patient_procedures_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "patient_repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_immunizations" ADD CONSTRAINT "patient_immunizations_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "patient_repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_family_history" ADD CONSTRAINT "patient_family_history_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "patient_repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextOptimization" ADD CONSTRAINT "ContextOptimization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisTask" ADD CONSTRAINT "AnalysisTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_balances" ADD CONSTRAINT "token_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_balances" ADD CONSTRAINT "token_balances_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_transactions" ADD CONSTRAINT "token_transactions_token_balance_id_fkey" FOREIGN KEY ("token_balance_id") REFERENCES "token_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rbac_access_logs" ADD CONSTRAINT "rbac_access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_notifications" ADD CONSTRAINT "system_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ehr_connections" ADD CONSTRAINT "ehr_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fhir_resources" ADD CONSTRAINT "fhir_resources_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "ehr_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "ehr_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_export_jobs" ADD CONSTRAINT "bulk_export_jobs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "ehr_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epic_specific_data" ADD CONSTRAINT "epic_specific_data_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "fhir_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
