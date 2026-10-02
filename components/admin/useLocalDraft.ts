"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SAVE_DRAFTS_EVENT } from "@/lib/admin/client";
import { useUnsavedChanges } from "./useUnsavedChanges";

type StoredDraft<T> = { version: 1; base: string; value: T; savedAt: string };

function compatible(value: unknown, example: unknown): boolean {
  if (Array.isArray(example)) return Array.isArray(value) && (example.length === 0 || value.every((item) => compatible(item, example[0])));
  if (example && typeof example === "object") {
    return Boolean(value && typeof value === "object" && !Array.isArray(value))
      && Object.entries(example).every(([key, item]) => item === undefined || compatible((value as Record<string, unknown>)[key], item));
  }
  return example === null ? value === null : typeof value === typeof example;
}

/** Text/JSON only. File selections remain in memory and are never claimed to be saved. */
export function useLocalDraft<T>(key: string, value: T, initial: T, restore: (value: T) => void, enabled = true, shape: T = initial) {
  const snapshot = JSON.stringify(value);
  const base = JSON.stringify(initial);
  const dirty = snapshot !== base;
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("ร่างข้อความเก็บเฉพาะบนเครื่องและเบราว์เซอร์นี้");
  const [recovery, setRecovery] = useState<StoredDraft<T> | null>(null);
  const latest = useRef({ value, initial, snapshot, base, dirty, restore, enabled, shape });
  const initialized = useRef(false);
  const blocked = useRef(false);
  const suppressed = useRef<string | null>(null);

  useLayoutEffect(() => {
    latest.current = { value, initial, snapshot, base, dirty, restore, enabled, shape };
  });

  const flush = useCallback(() => {
    const state = latest.current;
    if (!initialized.current || !state.enabled || blocked.current) return;
    if (suppressed.current === state.snapshot && state.dirty) return;
    suppressed.current = null;
    try {
      if (state.dirty) {
        const saved: StoredDraft<T> = { version: 1, base: state.base, value: state.value, savedAt: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(saved));
        setMessage("บันทึกร่างข้อความบนเครื่องนี้แล้ว ยังไม่ได้ส่งขึ้นเว็บไซต์");
      } else {
        localStorage.removeItem(key);
        setMessage("ไม่มีข้อมูลค้าง · ร่างข้อความเก็บเฉพาะบนเครื่องนี้");
      }
    } catch {
      setMessage("เก็บร่างบนเครื่องไม่สำเร็จ กรุณาบันทึกขึ้นเว็บไซต์ก่อนออกจากหน้านี้");
    }
  }, [key]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const saved: StoredDraft<T> = parsed?.version === 1 ? parsed : {
            version: 1, base: latest.current.base, value: parsed, savedAt: "",
          };
          if (!compatible(saved.value, latest.current.shape)) {
            setMessage("ร่างเดิมอ่านไม่ได้ กรุณาตรวจข้อมูลก่อนเริ่มแก้ไขใหม่");
          } else if (saved.base !== latest.current.base) {
            blocked.current = true;
            setRecovery(saved);
            setMessage("พบร่างบนเครื่อง แต่ข้อมูลบนเว็บไซต์เปลี่ยนแล้ว เลือกว่าจะใช้ข้อมูลใด");
          } else {
            latest.current.restore(saved.value);
            setMessage("กู้คืนร่างข้อความบนเครื่องนี้แล้ว");
          }
        }
      } catch {
        setMessage("อ่านร่างบนเครื่องไม่ได้ กรุณาบันทึกขึ้นเว็บไซต์ก่อนออกจากหน้านี้");
      }
      initialized.current = true;
      setReady(true);
    }, 0);
    const onHidden = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", flush);
    window.addEventListener(SAVE_DRAFTS_EVENT, flush);
    return () => {
      window.clearTimeout(timer);
      flush();
      initialized.current = false;
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener(SAVE_DRAFTS_EVENT, flush);
    };
  }, [enabled, key, flush]);

  useEffect(() => {
    if (!ready || !enabled) return;
    const timer = window.setTimeout(flush, 400);
    return () => window.clearTimeout(timer);
  }, [snapshot, base, enabled, ready, flush]);

  useUnsavedChanges(enabled && ready && dirty);

  const clear = useCallback(() => {
    suppressed.current = latest.current.snapshot;
    blocked.current = false;
    setRecovery(null);
    try { localStorage.removeItem(key); } catch { /* Saving to the server still succeeded. */ }
    setMessage("บันทึกแล้ว");
  }, [key]);

  return {
    dirty, ready, message, recovery: Boolean(recovery), clear,
    restore: () => {
      if (recovery) latest.current.restore(recovery.value);
      blocked.current = false;
      setRecovery(null);
      setMessage("กู้คืนร่างแล้ว กรุณาตรวจข้อมูลก่อนบันทึก");
    },
    discard: () => { clear(); latest.current.restore(latest.current.initial); },
  };
}
