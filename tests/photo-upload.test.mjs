import assert from "node:assert/strict";
import { test } from "node:test";
import { uploadPhoto, PhotoUploadConflict } from "../lib/admin/photo-upload.ts";
import { RepositoryChangedError, readFileAtRef } from "../lib/admin/github.ts";
const input = { id: "c3d3bba7-98ef-4ffc-bc08-0e6c11ba5573", extension: "jpg", bytes: Buffer.from("fixture"), caption: "Photo", location: "", date: "2026-10-02" };
function memoryRepo() {
  let version = 0; let meta = { "existing.jpg": { caption: "Keep me" } }; let commits = 0;
  return {
    head: async () => String(version), read: async () => JSON.stringify(meta),
    commit: async (files, _message, expected) => {
      assert.equal(expected, String(version));
      meta = JSON.parse(files.find((file) => file.path === "content/gallery.json").content);
      version += 1; commits += 1; return String(version);
    },
    get meta() { return meta; }, get commits() { return commits; },
    externalChange() { meta["other-device.jpg"] = { caption: "Concurrent photo" }; version += 1; },
  };
}
test("a lost upload response can be retried without another commit or duplicate", async () => {
  const repo = memoryRepo();
  const first = await uploadPhoto(input, repo);
  const retry = await uploadPhoto(input, repo);
  assert.equal(first.filename, retry.filename); assert.equal(retry.alreadyUploaded, true);
  assert.equal(repo.commits, 1); assert.equal(Object.keys(repo.meta).length, 2);
  await assert.rejects(uploadPhoto({ ...input, caption: "Changed payload" }, repo), PhotoUploadConflict);
  assert.equal(repo.commits, 1);
});
test("a concurrent commit forces a fresh read and preserves other photos", async () => {
  const repo = memoryRepo(); const realCommit = repo.commit;
  let interrupted = false;
  repo.commit = async (...args) => {
    if (!interrupted) { interrupted = true; repo.externalChange(); throw new RepositoryChangedError(); }
    return realCommit(...args);
  };
  await uploadPhoto(input, repo);
  assert.equal(repo.meta["other-device.jpg"].caption, "Concurrent photo");
  assert.equal(repo.meta["existing.jpg"].caption, "Keep me"); assert.equal(repo.commits, 1);
});
test("invalid or unavailable metadata never becomes an empty-gallery write", async () => {
  const repo = memoryRepo(); repo.read = async () => "not-json";
  await assert.rejects(uploadPhoto(input, repo)); assert.equal(repo.commits, 0);
  globalThis.fetch = async () => new Response("upstream unavailable", { status: 503 });
  await assert.rejects(readFileAtRef("content/gallery.json", "head", true), /503/);
  globalThis.fetch = async () => new Response("missing", { status: 404 });
  assert.equal(await readFileAtRef("content/gallery.json", "head", true), null);
});
