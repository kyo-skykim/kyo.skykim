"use client";

import { useEffect } from "react";
import { hasPendingWrites, SAVE_DRAFTS_EVENT } from "@/lib/admin/client";

const editors = new Map<symbol, { dirty: boolean; busy: boolean }>();

export function confirmAdminNavigation(): boolean {
  window.dispatchEvent(new Event(SAVE_DRAFTS_EVENT));
  if (hasPendingWrites() || [...editors.values()].some((editor) => editor.busy)) {
    window.alert("กำลังบันทึกหรือประมวลผล กรุณารอให้เสร็จก่อนเปลี่ยนหน้า");
    return false;
  }
  return ![...editors.values()].some((editor) => editor.dirty)
    || window.confirm("มีข้อมูลที่ยังไม่ได้ส่งขึ้นเว็บไซต์ ต้องการเปลี่ยนหน้าหรือไม่? ร่างข้อความที่บันทึกบนเครื่องจะเก็บไว้ แต่ไฟล์ที่ยังไม่ได้อัปโหลดต้องเลือกใหม่");
}

export function useUnsavedChanges(dirty: boolean, busy = false) {
  useEffect(() => {
    if (!dirty && !busy) return;
    const id = Symbol("editor");
    editors.set(id, { dirty, busy });
    const warn = (event: BeforeUnloadEvent) => {
      window.dispatchEvent(new Event(SAVE_DRAFTS_EVENT));
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => { editors.delete(id); window.removeEventListener("beforeunload", warn); };
  }, [dirty, busy]);
}
