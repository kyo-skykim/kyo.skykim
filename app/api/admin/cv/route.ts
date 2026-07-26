import { extractText, getDocumentProxy, renderPageAsImage } from "unpdf";
import { mkdir } from "node:fs/promises";
import { isLoggedIn } from "@/lib/admin/auth";
import { isConfigured, commitFiles, readFile } from "@/lib/admin/github";
import { rejectCrossOrigin } from "@/lib/admin/security";
import { hasFileSignature } from "@/lib/admin/file-validation";
import { parseCvText } from "@/lib/admin/cv-parser";
import type { CvAboutData, CvPreview } from "@/lib/admin/cv-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const CV_PATH = "public/CV_Conlathit_Phuncam.pdf";
const ABOUT_PATH = "content/about.json";
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MAX_PAGES = 12;
const MAX_OCR_PAGES = 4;
const EXTRACTION_TIMEOUT_MS = 12_000;

function validAboutData(value: unknown): value is CvAboutData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Partial<CvAboutData>;
  return Boolean(
    data.profile &&
      typeof data.profile === "object" &&
      Array.isArray(data.experience) &&
      Array.isArray(data.research) &&
      Array.isArray(data.education) &&
      Array.isArray(data.skills) &&
      Array.isArray(data.certifications) &&
      Array.isArray(data.languages)
  );
}

function validateFile(file: FormDataEntryValue | null): file is File {
  return (
    file instanceof File &&
    file.size > 0 &&
    file.size <= MAX_FILE_SIZE &&
    (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf")
  );
}

async function extractCvText(buffer: Uint8Array): Promise<{
  totalPages: number;
  text: string;
  usedOcr: boolean;
}> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer), { maxImageSize: 16_777_216 });
  if (pdf.numPages > MAX_PAGES) {
    throw new Error(`CV มี ${pdf.numPages} หน้า ซึ่งเกินจำนวนสูงสุด ${MAX_PAGES} หน้า`);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("อ่านข้อความจาก CV นานเกินไป กรุณาลองไฟล์ที่เล็กลง")),
      EXTRACTION_TIMEOUT_MS
    );
  });
  const result = await Promise.race([
    extractText(pdf, { mergePages: true }),
    timeout,
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
  const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
  if (text.replace(/\s/g, "").length >= 80) {
    return { totalPages: result.totalPages, text, usedOcr: false };
  }

  if (pdf.numPages > MAX_OCR_PAGES) {
    throw new Error(
      `PDF เป็นภาพสแกนและมี ${pdf.numPages} หน้า ระบบ OCR รองรับสูงสุด ${MAX_OCR_PAGES} หน้า`
    );
  }

  const { createWorker } = await import("tesseract.js");
  await mkdir("/tmp/kyo-tesseract-cache", { recursive: true });
  const worker = await createWorker(["eng", "tha"], undefined, {
    cachePath: "/tmp/kyo-tesseract-cache",
  });
  const pages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const image = await renderPageAsImage(
        new Uint8Array(buffer),
        pageNumber,
        {
          canvasImport: () => import("@napi-rs/canvas"),
          scale: 2,
        }
      );
      const recognized = await worker.recognize(Buffer.from(image));
      pages.push(recognized.data.text);
    }
  } finally {
    await worker.terminate();
  }

  const ocrText = pages.join("\n");
  if (ocrText.replace(/\s/g, "").length < 80) {
    throw new Error("OCR อ่านข้อความจาก PDF ไม่เพียงพอ กรุณาใช้ไฟล์ที่คมชัดขึ้น");
  }
  return { totalPages: pdf.numPages, text: ocrText, usedOcr: true };
}

export async function POST(request: Request) {
  const originError = rejectCrossOrigin(request);
  if (originError) return originError;
  if (!(await isLoggedIn())) {
    return Response.json({ error: "กรุณา login ก่อน" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า GITHUB_TOKEN ใน Vercel (Settings → Environment Variables)" },
      { status: 500 }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file") ?? null;
  if (!form || !validateFile(file)) {
    const tooLarge = file instanceof File && file.size > MAX_FILE_SIZE;
    return Response.json(
      { error: tooLarge ? "ไฟล์ใหญ่เกิน 4MB" : "กรุณาเลือกไฟล์ PDF ที่ถูกต้อง" },
      { status: tooLarge ? 413 : 400 }
    );
  }
  if (!(await hasFileSignature(file, "pdf"))) {
    return Response.json({ error: "ไฟล์นี้ไม่ใช่ PDF ที่ถูกต้อง" }, { status: 400 });
  }

  const mode = String(form.get("mode") ?? "preview");
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (mode === "preview") {
    try {
      const raw = await readFile(ABOUT_PATH);
      if (!raw) {
        return Response.json({ error: "ไม่พบไฟล์ about.json" }, { status: 404 });
      }
      const current = JSON.parse(raw) as unknown;
      if (!validAboutData(current)) {
        return Response.json({ error: "โครงสร้าง about.json ไม่ถูกต้อง" }, { status: 502 });
      }

      const extracted = await extractCvText(new Uint8Array(bytes));
      const parsed = parseCvText(extracted.text, current);
      parsed.about.profile.cv = CV_PATH.replace("public/", "");
      if (extracted.usedOcr) {
        parsed.warnings.unshift(
          "ไฟล์นี้อ่านด้วย OCR กรุณาตรวจชื่อ ตัวเลข และหัวข้อทุกส่วนก่อนบันทึก"
        );
      }
      const preview: CvPreview = {
        ...parsed,
        before: current,
        totalPages: extracted.totalPages,
        usedOcr: extracted.usedOcr,
      };
      return Response.json(preview);
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "อ่านข้อความจาก CV ไม่สำเร็จ" },
        { status: 422 }
      );
    }
  }

  if (mode !== "publish") {
    return Response.json({ error: "โหมดการทำงานไม่ถูกต้อง" }, { status: 400 });
  }

  const aboutRaw = String(form.get("about") ?? "");
  let about: unknown;
  try {
    about = JSON.parse(aboutRaw);
  } catch {
    return Response.json({ error: "ข้อมูล About ที่แก้ไขไม่ใช่ JSON ที่ถูกต้อง" }, { status: 400 });
  }
  if (!validAboutData(about)) {
    return Response.json({ error: "โครงสร้างข้อมูล About ไม่ครบถ้วน" }, { status: 400 });
  }
  about.profile.cv = CV_PATH.replace("public/", "");

  const base64 = Buffer.from(bytes).toString("base64");
  const aboutContent = JSON.stringify(about, null, 2) + "\n";

  try {
    const commitSha = await commitFiles(
      [
        { path: CV_PATH, content: base64, encoding: "base64" },
        { path: ABOUT_PATH, content: aboutContent, encoding: "utf-8" },
      ],
      "Update CV and About page"
    );
    return Response.json({ ok: true, commitSha });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "commit ไม่สำเร็จ" },
      { status: 502 }
    );
  }
}
