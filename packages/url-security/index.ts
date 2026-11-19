import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateIPv4(address: string): boolean {
    const octets = address.split(".").map(Number);
    return octets[0] === 10
        || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
        || (octets[0] === 192 && octets[1] === 168)
        || octets[0] === 127
        || (octets[0] === 169 && octets[1] === 254)
        || octets[0] === 0;
}

function isPrivateIPv6(address: string): boolean {
    const normalized = address.toLowerCase();
    return normalized === "::"
        || normalized === "::1"
        || normalized.startsWith("fc")
        || normalized.startsWith("fd")
        || normalized.startsWith("fe8")
        || normalized.startsWith("fe9")
        || normalized.startsWith("fea")
        || normalized.startsWith("feb")
        || normalized.startsWith("::ffff:127.")
        || normalized.startsWith("::ffff:10.")
        || normalized.startsWith("::ffff:192.168.")
        || normalized.startsWith("::ffff:169.254.");
}

function isPrivateAddress(address: string): boolean {
    const family = isIP(address);
    return family === 4 ? isPrivateIPv4(address) : family === 6 && isPrivateIPv6(address);
}

export async function validatePublicUrl(value: string): Promise<URL> {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        throw new Error("Invalid URL");
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Only HTTP and HTTPS URLs are allowed");
    }
    if (url.username || url.password || !url.hostname) {
        throw new Error("URL contains disallowed credentials or hostname");
    }

    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
        throw new Error("Private and local network addresses are not allowed");
    }

    return url;
}
