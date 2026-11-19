import "dotenv/config";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prismaClient } from "store/client";
import { AuthInput } from "./types";
import { authMiddleware } from "./middleware";
import { hashPassword, verifyPassword } from "./password";
import { validatePublicUrl } from "url-security/validate";

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.json({
        name: "Keepwatch API",
        status: "operational",
        endpoints: {
            signup: "POST /user/signup",
            signin: "POST /user/signin",
            addWebsite: "POST /website",
            websiteStatus: "GET /status/:websiteId"
        }
    });
});

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not provided");
}

const WebsiteInput = z.object({
    url: z.string().min(1),
    intervalSeconds: z.number().int().min(30).max(86400).optional()
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.get("/ready", async (_req, res) => {
    try {
        await prismaClient.$queryRaw`SELECT 1`;
        res.json({ status: "ready" });
    } catch (error) {
        console.error("Readiness check failed:", error);
        res.status(503).json({ status: "not_ready" });
    }
});

app.post("/website", authMiddleware, async (req, res) => {
    const data = WebsiteInput.safeParse(req.body);
    if (!data.success) {
        res.status(400).json({ message: "A valid URL is required", errors: data.error.errors });
        return;
    }

    let url: URL;
    try {
        url = await validatePublicUrl(data.data.url);
    } catch {
        res.status(400).json({ message: "Invalid or inaccessible URL" });
        return;
    }

    try {
        const website = await prismaClient.website.create({
            data: {
                url: url.toString(),
                time_added: new Date(),
                interval_seconds: data.data.intervalSeconds || 180,
                next_check_at: new Date(),
                user_id: req.userId!
            }
        });
        res.status(201).json({ id: website.id });
    } catch (error) {
        console.error("Website creation failed:", error);
        res.status(500).json({ message: "Failed to create website" });
    }
});

app.get("/website/all", authMiddleware, async (req, res) => {
    try {
        const websites = await prismaClient.website.findMany({
            where: { user_id: req.userId! },
            orderBy: { time_added: "desc" },
            include: {
                ticks: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            }
        });
        res.json({ websites });
    } catch (error) {
        console.error("Website listing failed:", error);
        res.status(500).json({ message: "Failed to fetch websites" });
    }
});

app.get("/status/:websiteId", authMiddleware, async (req, res) => {
    try {
        const website = await prismaClient.website.findFirst({
            where: {
                user_id: req.userId!,
                id: req.params.websiteId
            },
            include: {
                ticks: {
                    orderBy: { createdAt: "desc" },
                    take: 20
                }
            }
        });

        if (!website) {
            res.status(404).json({ message: "Website not found" });
            return;
        }

        const completedTicks = website.ticks.filter((tick) => tick.status !== "Unknown");
        const uptimePercentage = completedTicks.length === 0
            ? null
            : completedTicks.filter((tick) => tick.status === "Up").length / completedTicks.length * 100;
        const averageResponseTime = completedTicks.length === 0
            ? null
            : completedTicks.reduce((sum, tick) => sum + tick.response_time_ms, 0) / completedTicks.length;

        res.json({
            id: website.id,
            url: website.url,
            enabled: website.enabled,
            interval_seconds: website.interval_seconds,
            last_checked_at: website.last_checked_at,
            failure_count: website.failure_count,
            last_error: website.last_error,
            uptime_percentage: uptimePercentage,
            average_response_time_ms: averageResponseTime,
            ticks: website.ticks
        });
    } catch (error) {
        console.error("Website status failed:", error);
        res.status(500).json({ message: "Failed to fetch website status" });
    }
});

app.post("/user/signup", async (req, res) => {
    const data = AuthInput.safeParse(req.body);
    if (!data.success) {
        res.status(400).json({ message: "Invalid signup data", errors: data.error.errors });
        return;
    }

    try {
        const user = await prismaClient.user.create({
            data: {
                username: data.data.username,
                password: await hashPassword(data.data.password)
            }
        });
        res.status(201).json({ id: user.id });
    } catch (error) {
        console.error("Signup failed:", error);
        res.status(409).json({ message: "Username is already in use" });
    }
});

app.post("/user/signin", async (req, res) => {
    const data = AuthInput.safeParse(req.body);
    if (!data.success) {
        res.status(400).json({ message: "Invalid signin data", errors: data.error.errors });
        return;
    }

    try {
        const user = await prismaClient.user.findFirst({
            where: { username: data.data.username }
        });

        if (!user || !(await verifyPassword(data.data.password, user.password))) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        res.json({ jwt: token });
    } catch (error) {
        console.error("Signin failed:", error);
        res.status(500).json({ message: "Sign in failed" });
    }
});

app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
