import "dotenv/config";
import axios from "axios";
import { createServer } from "node:http";
import { xAck, xAddBulk, ensureConsumerGroup, xReadGroup } from "redisstream/client";
import type { WebsiteEvent } from "redisstream/client";
import { prismaClient } from "store/client";
import { validatePublicUrl } from "url-security/validate";

const REGION_ID = process.env.REGION_ID || (() => {
    throw new Error("REGION_ID not provided");
})();
const WORKER_ID = process.env.WORKER_ID || (() => {
    throw new Error("WORKER_ID not provided");
})();
const HEALTH_PORT = Number(process.env.HEALTH_PORT || 3002);
const BASE_RETRY_DELAY_MS = 5000;

createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ status: "ok", workerId: WORKER_ID }));
}).listen(HEALTH_PORT);

function nextRetryAt(retryCount: number): number {
    return Date.now() + BASE_RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

async function ensureRegionExists() {
    await prismaClient.region.upsert({
        where: { id: REGION_ID },
        update: {},
        create: { id: REGION_ID, name: REGION_ID }
    });
}

async function fetchWebsite(url: string): Promise<{ responseTimeMs: number; statusCode: number }> {
    const validatedUrl = await validatePublicUrl(url);
    const startTime = Date.now();
    const response = await axios.get(validatedUrl.toString(), {
        maxRedirects: 0,
        timeout: 10000,
        validateStatus: () => true
    });
    const responseTimeMs = Date.now() - startTime;

    if (response.status < 200 || response.status >= 400) {
        throw new Error(`HTTP status ${response.status}`);
    }

    return { responseTimeMs, statusCode: response.status };
}

async function writeTick(
    job: WebsiteEvent,
    status: "Up" | "Down" | "Unknown",
    responseTimeMs: number,
    statusCode: number | undefined,
    error: string | undefined
) {
    await prismaClient.website_tick.create({
        data: {
            response_time_ms: responseTimeMs,
            status,
            http_status_code: statusCode,
            error_message: error,
            attempt: job.retryCount + 1,
            region_id: REGION_ID,
            website_id: job.id
        }
    });
}

async function processJob(streamMessageId: string, job: WebsiteEvent) {
    if (Date.now() < job.nextRunAt) {
        await new Promise((resolve) => setTimeout(resolve, job.nextRunAt - Date.now()));
    }

    try {
        const result = await fetchWebsite(job.url);
        await writeTick(job, "Up", result.responseTimeMs, result.statusCode, undefined);
        await prismaClient.website.update({
            where: { id: job.id },
            data: {
                last_checked_at: new Date(),
                failure_count: 0,
                last_error: null
            }
        });
    } catch (error) {
        const message = errorMessage(error);
        const nextRetryCount = job.retryCount + 1;
        const responseTimeMs = 0;

        if (nextRetryCount <= job.maxRetries) {
            const retryJob = {
                ...job,
                retryCount: nextRetryCount,
                nextRunAt: nextRetryAt(nextRetryCount)
            };
            await writeTick(job, "Unknown", responseTimeMs, undefined, message);
            await prismaClient.website.update({
                where: { id: job.id },
                data: {
                    last_checked_at: new Date(),
                    failure_count: { increment: 1 },
                    last_error: message
                }
            });
            await xAddBulk([retryJob]);
        } else {
            await writeTick(job, "Down", responseTimeMs, undefined, message);
            await prismaClient.website.update({
                where: { id: job.id },
                data: {
                    last_checked_at: new Date(),
                    failure_count: { increment: 1 },
                    last_error: message
                }
            });
            await prismaClient.job_failure.create({
                data: {
                    job_id: job.jobId,
                    website_id: job.id,
                    url: job.url,
                    total_attempts: nextRetryCount,
                    final_error: message
                }
            });
        }
    }

    await xAck(REGION_ID, streamMessageId);
}

async function main() {
    await ensureRegionExists();
    await ensureConsumerGroup(REGION_ID);

    while (true) {
        try {
            const response = await xReadGroup(REGION_ID, WORKER_ID);
            if (!response) {
                continue;
            }

            for (const { id, message } of response) {
                await processJob(id, message);
            }
        } catch (error) {
            console.error("Worker error:", error);
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
}

main().catch((error) => {
    console.error("Worker failed:", error);
    process.exitCode = 1;
});
