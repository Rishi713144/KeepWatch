import { describe, expect, it } from "bun:test";
import { hashPassword, verifyPassword } from "./password";
import { validatePublicUrl } from "url-security/validate";

describe("password storage", () => {
    it("stores a salted hash and verifies only the original password", async () => {
        const hash = await hashPassword("correct horse battery staple");

        expect(hash).not.toContain("correct horse battery staple");
        expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
        expect(await verifyPassword("wrong password", hash)).toBe(false);
    });
});

describe("public URL validation", () => {
    it("rejects local network targets and unsupported protocols", async () => {
        await expect(validatePublicUrl("http://127.0.0.1")).rejects.toThrow();
        await expect(validatePublicUrl("file:///etc/passwd")).rejects.toThrow();
    });
});
