ALTER TABLE "website"
    ADD COLUMN "interval_seconds" INTEGER NOT NULL DEFAULT 180,
    ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "next_check_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "last_checked_at" TIMESTAMP(3),
    ADD COLUMN "failure_count" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "last_error" TEXT;

ALTER TABLE "website_tick"
    ADD COLUMN "http_status_code" INTEGER,
    ADD COLUMN "error_message" TEXT,
    ADD COLUMN "attempt" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "job_failure" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "website_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "total_attempts" INTEGER NOT NULL,
    "final_error" TEXT NOT NULL,
    "failed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_failure_pkey" PRIMARY KEY ("id")
);
