import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import React from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://admin.test/admin", pretendToBeVisual: true });
for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLDialogElement", "Event", "PopStateEvent", "localStorage", "location", "history"]) {
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true, writable: true });
}
globalThis.self = dom.window;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};
window.confirm = globalThis.confirm = () => true;
window.alert = () => {};
HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };

const { render, fireEvent, screen, waitFor, cleanup, act, within } = await import("@testing-library/react");
const pageModule = await import("../app/admin/page.tsx");
const AdminPage = pageModule.default.default ?? pageModule.default;
const photoModule = await import("../components/admin/PhotoUploader.tsx");
const PhotoUploader = photoModule.default.default ?? photoModule.default;
const { useLocalDraft } = await import("../components/admin/useLocalDraft.ts");
const { adminFetch, hasPendingWrites, SESSION_EXPIRED_EVENT, SAVE_DRAFTS_EVENT } = await import("../lib/admin/client.ts");
const { tabFromUrl } = await import("../components/admin/useAdminNavigation.ts");
const h = React.createElement;
const json = (body, status = 200) => Response.json(body, { status });
const post = { slug: "sample", title: "Original", content: "Server content", mood: "😊", coverEmoji: "📔", excerpt: "", tags: [], date: "2026-10-01", draft: false, readingTime: 1 };
const about = { profile: { name: "Test", nickname: "", location: "", phone: "", email: "", linkedin: "", github: "", website: "", cv: "", summary: "" }, experience: [{ year: "2024", role: "Engineer", company: "Test Co", items: [] }], research: [], education: [{ year: "2020", degree: "Science", school: "Test School" }], skills: [], certifications: [], languages: [] };
const currently = { updatedAt: "2026-10-01", items: [{ id: "book", label: "Reading", emoji: "📚", title: "Original book", detail: "" }] };
function mockApi(handler) {
  globalThis.fetch = async (url, init = {}) => {
    const overridden = await handler?.(url, init);
    if (overridden) return overridden;
    if (url === "/api/admin/login") return json({ loggedIn: true, ok: true });
    if (url === "/api/admin/posts/sample") return json(post);
    if (url === "/api/admin/posts") return json({ posts: [post] });
    if (url === "/api/admin/photo") return json({ photos: [] });
    if (url === "/api/admin/music") return json({ tracks: [] });
    if (url === "/api/admin/status") return json({ error: "Not available in tests" }, 503);
    if (url === "/api/admin/about") return json(about);
    if (url === "/api/admin/currently") return json(currently);
    throw new Error(`Unexpected request ${url}`);
  };
}
function at(tab) { window.history.replaceState({}, "", `/admin?tab=${tab}`); }
function mainNav(name) { return within(screen.getByRole("navigation", { name: "เมนูจัดการเว็บไซต์" })).getByRole("button", { name }); }
async function ready() { await waitFor(() => assert.ok(screen.queryByRole("navigation", { name: "เมนูจัดการเว็บไซต์" }))); }
afterEach(async () => {
  cleanup(); localStorage.clear();
  window.confirm = globalThis.confirm = () => true;
  await act(async () => {});
});

test("requests release busy state after offline, timeout, and malformed responses; 401 flushes drafts", async () => {
  globalThis.fetch = async () => { throw new TypeError("offline"); };
  assert.equal((await adminFetch("/write", { method: "POST" })).status, 503);
  assert.equal(hasPendingWrites(), false);
  globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
  const waiting = adminFetch("/write", { method: "PUT" }, 5);
  assert.equal(hasPendingWrites(), true);
  assert.equal((await waiting).status, 408); assert.equal(hasPendingWrites(), false);
  globalThis.fetch = async () => new Response("<html>upstream error</html>", { status: 502 });
  assert.equal((await adminFetch("/read")).status, 502);
  const events = [];
  const flush = () => events.push("flush"); const expired = () => events.push("expired");
  window.addEventListener(SAVE_DRAFTS_EVENT, flush); window.addEventListener(SESSION_EXPIRED_EVENT, expired);
  globalThis.fetch = async () => json({ error: "expired" }, 401);
  assert.equal((await adminFetch("/api/admin/posts", { method: "PUT" })).status, 401);
  assert.deepEqual(events, ["flush", "expired"]);
  window.removeEventListener(SAVE_DRAFTS_EVENT, flush); window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
});

test("edited diary survives navigation and reauthentication, and successful save removes its draft", async () => {
  let saveMode = "offline";
  mockApi((url, init) => {
    if (url === "/api/admin/posts" && init.method === "PUT") {
      if (saveMode === "offline") throw new TypeError("offline");
      return saveMode === "expired" ? json({ error: "expired" }, 401) : json({ ok: true });
    }
  });
  at("posts"); render(h(AdminPage)); await ready();
  fireEvent.click(await screen.findByRole("button", { name: "แก้ไข" }));
  const title = await screen.findByLabelText("หัวข้อ");
  await waitFor(() => assert.equal(title.closest("fieldset").disabled, false));
  fireEvent.change(title, { target: { value: "My revised title" } });
  window.confirm = () => false;
  fireEvent.click(screen.getByRole("button", { name: /กลับไปรายการโพสต์/ }));
  assert.equal(screen.getByLabelText("หัวข้อ").value, "My revised title");
  window.confirm = () => true;
  fireEvent.click(screen.getByRole("button", { name: /กลับไปรายการโพสต์/ }));
  fireEvent.click(await screen.findByRole("button", { name: "แก้ไข" }));
  await waitFor(() => assert.equal(screen.getByLabelText("หัวข้อ").value, "My revised title"));
  fireEvent.click(screen.getByRole("button", { name: "อัปเดตโพสต์" }));
  await screen.findByRole("alert");
  assert.equal(screen.getByRole("button", { name: "อัปเดตโพสต์" }).disabled, false);
  assert.equal(screen.getByLabelText("หัวข้อ").value, "My revised title");
  saveMode = "expired";
  fireEvent.click(screen.getByRole("button", { name: "อัปเดตโพสต์" }));
  const dialog = await screen.findByRole("dialog", { name: "เข้าสู่ระบบอีกครั้ง" });
  assert.equal(screen.getByLabelText("หัวข้อ").value, "My revised title");
  fireEvent.change(within(dialog).getByLabelText("รหัสผ่าน"), { target: { value: "fixture-only" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "เข้าสู่ระบบ" }));
  await waitFor(() => assert.ok(!screen.queryByRole("dialog")));
  saveMode = "success";
  fireEvent.click(screen.getByRole("button", { name: "อัปเดตโพสต์" }));
  await screen.findByRole("button", { name: "แก้ไข" });
  assert.equal(localStorage.getItem("kyo-admin-diary-sample"), null);
});

test("URLs restore tabs; cancelling Back preserves the editor and accepting Back/Forward restores drafts", async () => {
  mockApi(); at("dashboard"); render(h(AdminPage)); await ready();
  fireEvent.click(mainNav("เขียน"));
  const title = await screen.findByLabelText("หัวข้อ");
  await waitFor(() => assert.equal(title.closest("fieldset").disabled, false));
  fireEvent.change(title, { target: { value: "New local draft" } });
  window.confirm = () => false;
  await act(async () => { window.history.back(); await new Promise((resolve) => setTimeout(resolve, 40)); });
  assert.match(window.location.search, /new-post/);
  assert.equal(screen.getByLabelText("หัวข้อ").value, "New local draft");
  window.confirm = () => true;
  await act(async () => { window.history.back(); await new Promise((resolve) => setTimeout(resolve, 40)); });
  assert.match(window.location.search, /dashboard/);
  await act(async () => { window.history.forward(); await new Promise((resolve) => setTimeout(resolve, 40)); });
  await waitFor(() => assert.equal(screen.getByLabelText("หัวข้อ").value, "New local draft"));
  assert.equal(tabFromUrl("/admin?tab=bad-value"), "dashboard");
});

test("Currently refuses to overwrite data after a failed read and restores its draft after navigation", async () => {
  mockApi((url) => url === "/api/admin/currently" ? json({ error: "offline" }, 503) : undefined);
  at("currently"); render(h(AdminPage));
  await screen.findByRole("alert");
  assert.ok(!screen.queryByRole("button", { name: "บันทึก Currently" }));
  cleanup(); mockApi(); render(h(AdminPage));
  const title = await screen.findByLabelText("หัวข้อ");
  await waitFor(() => assert.equal(title.closest("fieldset").disabled, false));
  fireEvent.change(title, { target: { value: "New book" } });
  fireEvent.click(mainNav("โพสต์")); await screen.findByRole("button", { name: "แก้ไข" });
  fireEvent.click(mainNav("Currently"));
  await waitFor(() => assert.equal(screen.getByLabelText("หัวข้อ").value, "New book"));
});

test("About drafts remain isolated across sections and recover edited array rows", async () => {
  mockApi(); at("about"); render(h(AdminPage));
  await screen.findByLabelText("ชื่อ");
  fireEvent.click(screen.getByRole("button", { name: /ประสบการณ์/ }));
  fireEvent.click(await screen.findByRole("button", { name: "แก้ไข" }));
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)); });
  fireEvent.change(screen.getByLabelText("role"), { target: { value: "Lead engineer" } });
  fireEvent.click(screen.getByRole("button", { name: /การศึกษา/ }));
  fireEvent.click(screen.getByRole("button", { name: "แก้ไข" }));
  assert.equal(screen.getByLabelText("degree").value, "Science");
  fireEvent.click(screen.getByRole("button", { name: /ประสบการณ์/ }));
  await screen.findByText(/Lead engineer/);
  fireEvent.click(screen.getByRole("button", { name: "แก้ไข" }));
  assert.equal(screen.getByLabelText("role").value, "Lead engineer");
});

test("stale drafts require a recovery decision; storage failure does not crash editing", async () => {
  function Editor() {
    const [value, setValue] = React.useState({ title: "Fresh server title" });
    const draft = useLocalDraft("fixture", value, { title: "Fresh server title" }, setValue);
    return h("div", null, h("input", { "aria-label": "draft", value: value.title, onChange: (e) => setValue({ title: e.target.value }) }), h("p", null, draft.message), draft.recovery && h("button", { onClick: draft.restore }, "Restore"));
  }
  localStorage.setItem("fixture", JSON.stringify({ version: 1, base: JSON.stringify({ title: "Old server title" }), value: { title: "My old draft" }, savedAt: "" }));
  render(h(Editor)); await screen.findByRole("button", { name: "Restore" });
  assert.equal(screen.getByLabelText("draft").value, "Fresh server title");
  fireEvent.click(screen.getByRole("button", { name: "Restore" }));
  assert.equal(screen.getByLabelText("draft").value, "My old draft");
  const original = dom.window.Storage.prototype.setItem;
  dom.window.Storage.prototype.setItem = () => { throw new Error("quota exceeded"); };
  try {
    fireEvent.change(screen.getByLabelText("draft"), { target: { value: "Still editable" } });
    await act(async () => window.dispatchEvent(new Event(SAVE_DRAFTS_EVENT)));
    assert.match(screen.getByText(/เก็บร่างบนเครื่องไม่สำเร็จ/).textContent, /ไม่สำเร็จ/);
    assert.equal(screen.getByLabelText("draft").value, "Still editable");
  } finally { dom.window.Storage.prototype.setItem = original; }
});

test("photo retry sends only unfinished items with identical IDs and payloads", async () => {
  const calls = [];
  const originalCreate = URL.createObjectURL; const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = () => `blob:fixture-${Math.random()}`; URL.revokeObjectURL = () => {};
  globalThis.createImageBitmap = async () => ({ width: 100, height: 100, close() {} });
  globalThis.fetch = async (_url, { body }) => {
    calls.push({ id: body.get("uploadId"), caption: body.get("caption"), date: body.get("date"), bytes: await body.get("file").text() });
    if (calls.length === 2) throw new TypeError("response lost after commit");
    return json({ ok: true });
  };
  try {
    const view = render(h(PhotoUploader));
    fireEvent.change(view.container.querySelector('input[type="file"]'), { target: { files: [new File(["first-image"], "first.jpg", { type: "image/jpeg" }), new File(["second-image"], "second.jpg", { type: "image/jpeg" })] } });
    fireEvent.click(screen.getByRole("button", { name: "อัปโหลด 2 รูป" }));
    const retry = await screen.findByRole("button", { name: "ลองอีกครั้ง 1 รูปที่ยังไม่สำเร็จ" });
    assert.equal(calls.length, 2);
    assert.ok(screen.getByText("✓ อัปโหลดสำเร็จ"));
    fireEvent.click(retry);
    await screen.findByText("อัปโหลดครบ 1 รูปแล้ว");
    assert.equal(calls.length, 3); assert.deepEqual(calls[1], calls[2]);
    assert.equal(screen.getAllByText("✓ อัปโหลดสำเร็จ").length, 2);
    assert.equal(screen.getByRole("button", { name: "อัปโหลด 0 รูป" }).disabled, true);
  } finally { URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; }
});

test("navigation is blocked during a write, and the mobile menu opens all secondary sections", async () => {
  let finish;
  mockApi((url, init) => url === "/api/admin/diary" && init.method === "POST" ? new Promise((resolve) => { finish = () => resolve(json({ ok: true })); }) : undefined);
  at("new-post"); render(h(AdminPage));
  const title = await screen.findByLabelText("หัวข้อ");
  await waitFor(() => assert.equal(title.closest("fieldset").disabled, false));
  fireEvent.change(title, { target: { value: "Pending post" } });
  fireEvent.change(screen.getByLabelText("เนื้อหา"), { target: { value: "Keep this" } });
  fireEvent.click(screen.getByRole("button", { name: "เผยแพร่" }));
  fireEvent.click(mainNav("โพสต์"));
  assert.match(window.location.search, /new-post/);
  assert.equal(screen.getByLabelText("หัวข้อ").value, "Pending post");
  await act(async () => finish());
  assert.equal(screen.getByLabelText("หัวข้อ").value, "");
  fireEvent.click(screen.getByRole("button", { name: "เมนูเพิ่มเติม" }));
  const dialog = screen.getByRole("dialog", { name: "เมนูเพิ่มเติม" });
  for (const name of ["เพลง", "Currently", "เกี่ยวกับ", "CV"]) assert.ok(within(dialog).getByRole("button", { name }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Currently" }));
  await screen.findByLabelText("ป้ายกำกับ");
  assert.match(window.location.search, /currently/);
  assert.ok(!screen.queryByRole("dialog"));
});

test("the public music player stays off admin routes and destroys playback when entering admin", async () => {
  const { PathnameContext } = await import("next/dist/shared/lib/hooks-client-context.shared-runtime.js");
  const musicModule = await import("../components/ui/MusicPlayer.tsx");
  const MusicPlayer = musicModule.default.default ?? musicModule.default;
  let created = 0; let destroyed = 0;
  window.YT = { Player: class { constructor() { created += 1; } destroy() { destroyed += 1; } } };
  const player = (path) => h(PathnameContext.Provider, { value: path }, h(MusicPlayer, { tracks: [{ type: "youtube", title: "Fixture track", src: "video-id" }] }));
  const view = render(player("/admin"));
  assert.equal(created, 0); assert.equal(view.container.childElementCount, 0);
  view.rerender(player("/")); assert.equal(created, 1);
  view.rerender(player("/admin")); assert.equal(destroyed, 1);
  assert.equal(view.container.childElementCount, 0);
  delete window.YT;
});

test("undoing edits back to a saved value clears stale autosave instead of reviving it", async () => {
  function Editor() {
    const [value, setValue] = React.useState({ title: "Initial" });
    const [base, setBase] = React.useState(value);
    const draft = useLocalDraft("undo-fixture", value, base, setValue);
    return h("div", null, h("input", { "aria-label": "undo title", value: value.title, onChange: (event) => setValue({ title: event.target.value }) }), h("button", { disabled: !draft.ready, onClick: () => { draft.clear(); setBase(value); } }, "Save baseline"));
  }
  render(h(Editor));
  await waitFor(() => assert.equal(screen.getByRole("button", { name: "Save baseline" }).disabled, false));
  fireEvent.change(screen.getByLabelText("undo title"), { target: { value: "Saved" } });
  fireEvent.click(screen.getByRole("button", { name: "Save baseline" }));
  fireEvent.change(screen.getByLabelText("undo title"), { target: { value: "Unsaved" } });
  await act(async () => window.dispatchEvent(new Event(SAVE_DRAFTS_EVENT)));
  assert.ok(localStorage.getItem("undo-fixture"));
  fireEvent.change(screen.getByLabelText("undo title"), { target: { value: "Saved" } });
  await act(async () => window.dispatchEvent(new Event(SAVE_DRAFTS_EVENT)));
  assert.equal(localStorage.getItem("undo-fixture"), null);
});
