import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const LEGACY_SESSION_COOKIE = "admin_session";
export const SESSION_COOKIE = process.env.NODE_ENV === "production"
  ? "__Host-admin_session"
  : LEGACY_SESSION_COOKIE;
const SESSION_VERSION = "v2";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const CLOCK_SKEW_SECONDS = 60;

function sessionSecret(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password || null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`kyo-diary-admin:${payload}`)
    .digest("base64url");
}

function sessionToken(now = Date.now()): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const issuedAt = Math.floor(now / 1000);
  const payload = `${SESSION_VERSION}.${issuedAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

function verifySessionToken(value: string, now = Date.now()): boolean {
  const secret = sessionSecret();
  if (!secret) return false;

  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== SESSION_VERSION) return false;
  const issuedAt = Number(parts[1]);
  if (!Number.isSafeInteger(issuedAt)) return false;

  const currentTime = Math.floor(now / 1000);
  const age = currentTime - issuedAt;
  if (age < -CLOCK_SKEW_SECONDS || age > SESSION_MAX_AGE_SECONDS) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(parts[2]);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function verifyPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = createHmac("sha256", "cmp").update(input).digest();
  const b = createHmac("sha256", "cmp").update(password).digest();
  return timingSafeEqual(a, b);
}

export async function setSession(): Promise<boolean> {
  const token = sessionToken();
  if (!token) return false;
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    priority: "high",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  if (SESSION_COOKIE !== LEGACY_SESSION_COOKIE) {
    store.set(LEGACY_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return true;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  if (SESSION_COOKIE !== LEGACY_SESSION_COOKIE) {
    store.set(LEGACY_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return Boolean(value && verifySessionToken(value));
}
