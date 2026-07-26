export function rejectCrossOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  try {
    if (new URL(origin).origin !== new URL(request.url).origin) {
      return Response.json({ error: "คำขอมาจากแหล่งที่ไม่อนุญาต" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }
  return null;
}

export function clientAddress(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}
