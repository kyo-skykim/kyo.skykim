export function rejectCrossOrigin(request: Request): Response | null {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "none"].includes(fetchSite)) {
    return Response.json({ error: "คำขอมาจากแหล่งที่ไม่อนุญาต" }, { status: 403 });
  }

  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== requestOrigin) {
        return Response.json({ error: "คำขอมาจากแหล่งที่ไม่อนุญาต" }, { status: 403 });
      }
      return null;
    } catch {
      return Response.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      if (new URL(referer).origin !== requestOrigin) {
        return Response.json({ error: "คำขอมาจากแหล่งที่ไม่อนุญาต" }, { status: 403 });
      }
      return null;
    } catch {
      return Response.json({ error: "Referer ไม่ถูกต้อง" }, { status: 403 });
    }
  }

  if (process.env.NODE_ENV === "production") {
    if (fetchSite !== "same-origin") {
      return Response.json({ error: "คำขอมาจากแหล่งที่ไม่อนุญาต" }, { status: 403 });
    }
  }
  return null;
}

export function rejectOversizedRequest(request: Request, maxBytes: number): Response | null {
  const rawLength = request.headers.get("content-length");
  if (!rawLength) return null;

  const length = Number(rawLength);
  if (!Number.isSafeInteger(length) || length < 0) {
    return Response.json({ error: "ขนาด request ไม่ถูกต้อง" }, { status: 400 });
  }
  if (length > maxBytes) {
    return Response.json({ error: "request มีขนาดใหญ่เกินกำหนด" }, { status: 413 });
  }
  return null;
}

export function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return address.slice(0, 64);
}
