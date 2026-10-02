"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PostMeta } from "@/lib/diary";
import RevealGroup from "@/components/ui/RevealGroup";

type BrowserPost = PostMeta & { dateLabel: string };

export default function DiaryBrowser({ posts }: { posts: BrowserPost[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("th");
    return posts.filter((post) => {
      if (!normalized) return true;
      return [post.title, post.excerpt]
        .join(" ")
        .toLocaleLowerCase("th")
        .includes(normalized);
    });
  }, [posts, query]);

  return (
    <>
      <div className="mb-8 space-y-3">
        <label className="relative block">
          <span className="sr-only">ค้นหาบันทึก</span>
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base" aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาจากชื่อหรือเนื้อหา..."
            className="w-full rounded-2xl py-3 pl-10 pr-4 outline-none text-sm"
            style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)", color: "var(--ink)" }}
          />
        </label>
        <p className="text-xs" style={{ color: "var(--ink-light)" }}>
          แสดง {filtered.length} จาก {posts.length} บันทึก
        </p>
      </div>

      <RevealGroup className="space-y-6" refreshKey={query}>
        {filtered.map((post) => (
          <Link key={post.slug} href={`/posts/${post.slug}`} className="motion-card block rounded-2xl" data-reveal="">
            <article
              className="rounded-2xl p-7 cursor-pointer"
              style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(44,36,22,0.05)" }}
            >
              <div className="flex items-start gap-5">
                <div className="text-4xl w-14 h-14 flex items-center justify-center rounded-xl shrink-0 mt-0.5" style={{ backgroundColor: "var(--accent-light)" }}>
                  {post.coverEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{post.mood}</span>
                    <time className="text-xs" style={{ color: "var(--accent)", letterSpacing: "0.03em" }}>
                      {post.dateLabel}
                    </time>
                    <span className="text-xs" style={{ color: "var(--ink-light)" }}>·</span>
                    <span className="text-xs" style={{ color: "var(--ink-light)" }}>อ่าน {post.readingTime} นาที</span>
                  </div>
                  <h2 className="text-xl mb-2 leading-snug" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>
                    {post.title}
                  </h2>
                  <p className="text-sm leading-relaxed mb-3 line-clamp-2" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink-light)", fontStyle: "italic" }}>
                    {post.excerpt}
                  </p>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </RevealGroup>

      {filtered.length === 0 && (
        <p className="text-center py-20" style={{ color: "var(--ink-light)", fontStyle: "italic" }}>
          ไม่พบบันทึกที่ตรงกัน ลองเปลี่ยนคำค้นหาดูนะ
        </p>
      )}
    </>
  );
}
