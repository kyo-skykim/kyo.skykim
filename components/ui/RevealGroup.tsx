"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** One observer per list; server-rendered content stays visible without JavaScript. */
export default function RevealGroup({
  children,
  className,
  refreshKey,
}: {
  children: ReactNode;
  className?: string;
  refreshKey?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!container || preference.matches || !("IntersectionObserver" in window)) return;

    const candidates = Array.from(container.querySelectorAll<HTMLElement>("[data-reveal]"))
      .filter((element) => element.dataset.reveal === "");
    // Read positions before writing styles. Never hide content already on screen.
    const positions = candidates.map((element) => ({ element, top: element.getBoundingClientRect().top }));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.reveal = "visible";
        observer.unobserve(entry.target);
      }
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });

    for (const { element, top } of positions) {
      if (top < window.innerHeight) {
        element.dataset.reveal = "done";
      } else {
        element.dataset.reveal = "pending";
        observer.observe(element);
      }
    }

    const showAll = () => {
      observer.disconnect();
      for (const element of candidates) element.dataset.reveal = "done";
    };
    const onPreferenceChange = () => {
      if (preference.matches) showAll();
    };
    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-reveal]");
      if (element && container.contains(element)) {
        element.dataset.reveal = "done";
        observer.unobserve(element);
      }
    };

    preference.addEventListener("change", onPreferenceChange);
    container.addEventListener("focusin", onFocus);
    return () => {
      showAll();
      preference.removeEventListener("change", onPreferenceChange);
      container.removeEventListener("focusin", onFocus);
    };
  }, [refreshKey]);

  return <div ref={root} className={className}>{children}</div>;
}
