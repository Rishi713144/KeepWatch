import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!header) {
        res.status(401).json({ message: "Authorization required" });
        return;
    }

    try {
        const data = jwt.verify(header, process.env.JWT_SECRET!);
        if (typeof data === "string" || typeof data.sub !== "string") {
            res.status(401).json({ message: "Invalid authorization token" });
            return;
        }
        req.userId = data.sub;
        next();
    } catch (error) {
        console.error("Authentication failed:", error);
        res.status(401).json({ message: "Invalid authorization token" });
    }
}
