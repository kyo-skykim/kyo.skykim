import fs from "fs";
import path from "path";

const galleryDir = path.join(process.cwd(), "public/gallery");
const metaFile = path.join(process.cwd(), "content/gallery.json");
const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

export type PhotoMeta = {
  caption?: string;
  date?: string;     // e.g. "2026-05-14" — ถ้าไม่ใส่จะเรียงตามเวลาที่ upload
  location?: string;
};

export type Photo = PhotoMeta & { src: string; file: string };

function readMeta(): Record<string, PhotoMeta> {
  try {
    return JSON.parse(fs.readFileSync(metaFile, "utf-8"));
  } catch {
    return {};
  }
}

export function getAllPhotos(): Photo[] {
  if (!fs.existsSync(galleryDir)) return [];

  const captions = readMeta();
  const files = fs.readdirSync(galleryDir).filter((f) => IMAGE_RE.test(f));

  const photos = files.map((file) => {
    const stat = fs.statSync(path.join(galleryDir, file));
    const meta = captions[file] ?? {};
    return {
      src: `gallery/${file}`,
      file,
      mtime: stat.mtimeMs,
      ...meta,
    };
  });

  return photos
    .sort((a, b) => {
      const aKey = a.date ? Date.parse(a.date) : a.mtime;
      const bKey = b.date ? Date.parse(b.date) : b.mtime;
      return bKey - aKey;
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ mtime, ...rest }) => rest);
}
