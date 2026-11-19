import { createClient } from "redis";

const client = await createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export type WebsiteEvent = {
    url: string;
    id: string;
    jobId: string;
    retryCount: number;
    maxRetries: number;
    nextRunAt: number;
};

export type MessageType = {
    id: string,
    message: WebsiteEvent;
}

const STREAM_NAME = "keepwatch:website";

async function xAdd(event: WebsiteEvent) {
    await client.xAdd(
        STREAM_NAME, '*', {
            url: event.url,
            id: event.id,
            jobId: event.jobId,
            retryCount: String(event.retryCount),
            maxRetries: String(event.maxRetries),
            nextRunAt: String(event.nextRunAt)
        }
    );
}

export async function xAddBulk(websites: WebsiteEvent[]) {
    for (const website of websites) {
        await xAdd(website);
    }
}

export async function ensureConsumerGroup(group: string) {
    try {
        await client.xGroupCreate(STREAM_NAME, group, "0", { MKSTREAM: true });
    } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("BUSYGROUP")) {
            throw error;
        }
    }
}

export async function xReadGroup(consumerGroup: string, workerId: string): Promise<MessageType[] | undefined> {
    const res = await client.xReadGroup(
        consumerGroup, workerId, {
            key: STREAM_NAME,
            id: '>'
        }, {
        COUNT: 5,
        BLOCK: 5000
        }
    ) as Array<{
        messages: Array<{
            id: string;
            message: Record<string, string>;
        }>;
    }> | null;

    const messages = res?.[0]?.messages;
    return messages?.map(({ id, message }) => ({
        id,
        message: {
            url: message.url,
            id: message.id,
            jobId: message.jobId,
            retryCount: Number(message.retryCount),
            maxRetries: Number(message.maxRetries),
            nextRunAt: Number(message.nextRunAt)
        }
    }));
}

export async function xAck(consumerGroup: string, eventId: string) {
    await client.xAck(STREAM_NAME, consumerGroup, eventId)
}

export async function xAckBulk(consumerGroup: string, eventIds: string[]) {
    await Promise.all(eventIds.map(eventId => xAck(consumerGroup, eventId)));
}