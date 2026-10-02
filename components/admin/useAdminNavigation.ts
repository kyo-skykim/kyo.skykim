"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { confirmAdminNavigation } from "./useUnsavedChanges";

export const adminTabs = [
  ["dashboard", "⌂", "ภาพรวม"], ["new-post", "＋", "เขียน"],
  ["posts", "✎", "โพสต์"], ["gallery", "▧", "รูปภาพ"],
  ["music", "♫", "เพลง"], ["currently", "◌", "Currently"],
  ["about", "◯", "เกี่ยวกับ"], ["cv", "▤", "CV"],
] as const;
export type AdminTab = typeof adminTabs[number][0];
export function tabFromUrl(url: string): AdminTab {
  const value = new URL(url, "https://admin.invalid").searchParams.get("tab");
  return adminTabs.find(([tab]) => tab === value)?.[0] ?? "dashboard";
}

export function useAdminNavigation() {
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const current = useRef({ url: "", index: 0 });
  const restoring = useRef(false);

  useEffect(() => {
    const index = Number.isInteger(window.history.state?.adminIndex) ? window.history.state.adminIndex : 0;
    current.current = { url: window.location.href, index };
    window.history.replaceState({ ...window.history.state, adminIndex: index }, "", window.location.href);
    const timer = window.setTimeout(() => setTab(tabFromUrl(window.location.href)), 0);
    const onBack = (event: PopStateEvent) => {
      if (restoring.current) { restoring.current = false; return; }
      const next = { url: window.location.href, index: event.state?.adminIndex as number | undefined };
      if (!confirmAdminNavigation()) {
        event.stopImmediatePropagation();
        if (typeof next.index === "number" && next.index !== current.current.index) {
          restoring.current = true;
          window.history.go(current.current.index - next.index);
        } else {
          window.history.pushState({ ...window.history.state, adminIndex: current.current.index }, "", current.current.url);
        }
        return;
      }
      current.current = { url: next.url, index: next.index ?? 0 };
      if (window.location.pathname === "/admin") setTab(tabFromUrl(next.url));
    };
    window.addEventListener("popstate", onBack, true);
    return () => { window.clearTimeout(timer); window.removeEventListener("popstate", onBack, true); };
  }, []);

  const navigate = useCallback((next: AdminTab) => {
    if (next === tab || !confirmAdminNavigation()) return false;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    const index = current.current.index + 1;
    window.history.pushState({ ...window.history.state, adminIndex: index }, "", url);
    current.current = { url: url.href, index };
    setTab(next);
    window.scrollTo({ top: 0, behavior: "instant" });
    return true;
  }, [tab]);
  return { tab, navigate };
}
