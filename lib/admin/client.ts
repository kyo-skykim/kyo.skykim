// Shared client requests: never retry writes automatically after an uncertain response.
export const SESSION_EXPIRED_EVENT = "admin:session-expired";
export const SAVE_DRAFTS_EVENT = "admin:save-drafts";
let pendingWrites = 0;

export function hasPendingWrites() { return pendingWrites > 0; }

export async function adminFetch(input: string, init: RequestInit = {}, timeoutMs = 90_000): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const write = !["GET", "HEAD"].includes((init.method ?? "GET").toUpperCase());
  if (write) pendingWrites += 1;
  if (init.signal?.aborted) abort();
  init.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal, cache: "no-store" });
    // Read the body inside the timeout too, including broken/truncated connections.
    const body = await response.text();
    if (response.status === 401 && input.split("?")[0] !== "/api/admin/login" && typeof window !== "undefined") {
      window.dispatchEvent(new Event(SAVE_DRAFTS_EVENT));
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    let parsed: unknown;
    try { parsed = body ? JSON.parse(body) : {}; } catch {
      return Response.json({ error: "เซิร์ฟเวอร์ตอบกลับไม่สมบูรณ์ กรุณาตรวจสถานะก่อนลองอีกครั้ง" }, { status: 502 });
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return Response.json({ error: "ข้อมูลตอบกลับไม่ถูกต้อง กรุณาลองใหม่" }, { status: 502 });
    }
    return Response.json(parsed, { status: response.status === 204 ? 200 : response.status });
  } catch {
    const error = controller.signal.aborted
      ? "รอนานเกินไป กรุณาตรวจว่าบันทึกสำเร็จแล้วหรือยังก่อนลองอีกครั้ง"
      : "เชื่อมต่อไม่สำเร็จ ข้อมูลที่กรอกยังอยู่ ตรวจอินเทอร์เน็ตแล้วลองใหม่";
    return Response.json({ error }, { status: controller.signal.aborted ? 408 : 503 });
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", abort);
    if (write) pendingWrites -= 1;
  }
}
