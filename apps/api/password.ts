import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    const derivedKey = await scrypt(password, salt, KEY_LENGTH);
    if (!Buffer.isBuffer(derivedKey)) {
        throw new Error("Password derivation failed");
    }
    return derivedKey;
}

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derivedKey = await deriveKey(password, salt);
    return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [saltHex, keyHex] = storedHash.split(":");
    if (!saltHex || !keyHex) {
        return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const expectedKey = Buffer.from(keyHex, "hex");
    if (salt.length !== SALT_LENGTH || expectedKey.length !== KEY_LENGTH) {
        return false;
    }

    const derivedKey = await deriveKey(password, salt);
    return timingSafeEqual(expectedKey, derivedKey);
}
