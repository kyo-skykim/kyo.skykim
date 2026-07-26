import { verifyPassword, setSession, clearSession, isLoggedIn } from "@/lib/admin/auth";
import { clientAddress, rejectCrossOrigin } from "@/lib/admin/security";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; resetAt: number }>();

export async function GET() {
  return Response.json({ loggedIn: await isLoggedIn() });
}

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  if (!process.env.ADMIN_PASSWORD) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า ADMIN_PASSWORD ใน Vercel (Settings → Environment Variables)" },
      { status: 500 }
    );
  }
  const address = clientAddress(request);
  const now = Date.now();
  const previous = failures.get(address);
  if (previous && previous.resetAt > now && previous.count >= MAX_FAILURES) {
    return Response.json(
      { error: "ลองรหัสผ่านผิดหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((previous.resetAt - now) / 1000)) } }
    );
  }
  const { password } = await request.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !verifyPassword(password)) {
    const next = previous && previous.resetAt > now
      ? { count: previous.count + 1, resetAt: previous.resetAt }
      : { count: 1, resetAt: now + WINDOW_MS };
    failures.set(address, next);
    return Response.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  failures.delete(address);
  await setSession();
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  await clearSession();
  return Response.json({ ok: true });
}
