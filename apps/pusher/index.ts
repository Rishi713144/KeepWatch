import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prismaClient } from "store/client";
import { xAddBulk } from "redisstream/client";

async function main() {
    const now = new Date();
    const websites = await prismaClient.website.findMany({
        where: {
            enabled: true,
            next_check_at: {
                lte: now
            }
        },
        select: {
            url: true,
            id: true,
            interval_seconds: true
        }
    });

    const queued = [];
    for (const website of websites) {
        const claimed = await prismaClient.website.updateMany({
            where: {
                id: website.id,
                enabled: true,
                next_check_at: {
                    lte: now
                }
            },
            data: {
                next_check_at: new Date(now.getTime() + website.interval_seconds * 1000)
            }
        });
        if (claimed.count === 1) {
            queued.push({
                url: website.url,
                id: website.id,
                jobId: randomUUID(),
                retryCount: 0,
                maxRetries: 3,
                nextRunAt: now.getTime()
            });
        }
    }

    await xAddBulk(queued);
}

setInterval(() => {
    main().catch((error) => console.error("Pusher error:", error));
}, 10 * 1000);

main().catch((error) => {
    console.error("Pusher failed:", error);
    process.exitCode = 1;
});