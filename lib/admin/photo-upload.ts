import { createHash } from "node:crypto";
import { commitFiles, getHeadSha, readFileAtRef, RepositoryChangedError, type CommitFile } from "./github";

export type GalleryMeta = Record<string, {
  caption?: string; location?: string; date?: string; featured?: boolean; uploadHash?: string;
}>;
export class PhotoUploadConflict extends Error {}
export type PhotoUpload = { id: string; extension: string; bytes: Buffer; caption: string; location: string; date: string };
type Repository = {
  head: () => Promise<string>;
  read: (path: string, head: string) => Promise<string | null>;
  commit: (files: CommitFile[], message: string, head: string) => Promise<string>;
};
const repository: Repository = { head: getHeadSha, read: (path, head) => readFileAtRef(path, head, true), commit: commitFiles };

/** The queue's stable ID makes an ambiguous response safe to retry, including after another deploy. */
export async function uploadPhoto(input: PhotoUpload, repo: Repository = repository) {
  const filename = `photo-${input.id}.${input.extension}`;
  const uploadHash = createHash("sha256").update(input.bytes).update(JSON.stringify([input.caption, input.location, input.date])).digest("hex");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const head = await repo.head();
    const raw = await repo.read("content/gallery.json", head);
    const meta: GalleryMeta = raw ? JSON.parse(raw) : {};
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) throw new Error("ข้อมูลคลังรูปไม่ถูกต้อง จึงยังไม่บันทึก");
    if (meta[filename]) {
      if (meta[filename].uploadHash !== uploadHash) throw new PhotoUploadConflict("รูปนี้เคยส่งด้วยข้อมูลอื่นแล้ว กรุณาตรวจคลังรูปก่อนลองใหม่");
      return { filename, alreadyUploaded: true };
    }
    meta[filename] = { caption: input.caption, location: input.location, date: input.date, uploadHash };
    try {
      await repo.commit([
        { path: `public/gallery/${filename}`, content: input.bytes.toString("base64"), encoding: "base64" },
        { path: "content/gallery.json", content: JSON.stringify(meta, null, 2) + "\n", encoding: "utf-8" },
      ], `New gallery photo: ${input.caption || filename}`, head);
      return { filename, alreadyUploaded: false };
    } catch (error) {
      if (!(error instanceof RepositoryChangedError) || attempt === 2) throw error;
      // Re-read the newer snapshot before retrying a rejected (not committed) update.
    }
  }
  throw new RepositoryChangedError();
}
