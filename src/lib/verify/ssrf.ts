/** Pure SSRF guards used by the article fetcher. */

export function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p as [number, number, number, number];
  return (
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && p[2] === 0) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

export function isPrivateIPv6(ip: string): boolean {
  const x = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (x === "::" || x === "::1") return true;
  const mapped = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]!);
  if (/^::ffff:/.test(x) || /^64:ff9b:/.test(x)) return true;
  return /^f[cd]/.test(x) || /^fe[89ab]/.test(x) || /^ff/.test(x);
}

export const isIPv4 = (h: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(h);
export const isIPv6 = (h: string) => h.includes(":");

export function isBlockedHostname(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (!h || h === "localhost" || /\.(localhost|local|internal|lan|home|corp|intranet)$/.test(h)) return true;
  if (!h.includes(".") && !isIPv6(h)) return true;
  if (isIPv4(h)) return isPrivateIPv4(h);
  if (isIPv6(h.replace(/^\[|\]$/g, ""))) return isPrivateIPv6(h);
  return false;
}

export function validateArticleUrl(raw: string): { ok: true; url: URL } | { ok: false; message: string } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, message: "That doesn't look like a complete URL. Include https://" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false, message: "Only http and https links are supported." };
  if (url.username || url.password) return { ok: false, message: "Links containing login credentials are not allowed." };
  if (url.port && url.port !== "80" && url.port !== "443") return { ok: false, message: "Links using non-standard ports are not allowed." };
  if (isBlockedHostname(url.hostname)) return { ok: false, message: "This address points to a private or local network and cannot be fetched." };
  return { ok: true, url };
}
