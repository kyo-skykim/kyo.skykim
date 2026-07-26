"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PostMeta } from "@/lib/diary";

type BrowserPost = PostMeta & { dateLabel: string };

export default function DiaryBrowser({ posts }: { posts: BrowserPost[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("ทั้งหมด");
  const tags = useMemo(
    () => Array.from(new Set(posts.flatMap((post) => post.tags))).sort((a, b) => a.localeCompare(b, "th")),
    [posts]
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("th");
    return posts.filter((post) => {
      const matchesTag = tag === "ทั้งหมด" || post.tags.includes(tag);
      if (!matchesTag) return false;
      if (!normalized) return true;
      return [post.title, post.excerpt, ...post.tags]
        .join(" ")
        .toLocaleLowerCase("th")
        .includes(normalized);
    });
  }, [posts, query, tag]);

  return (
    <>
      <div className="mb-8 space-y-3">
        <label className="relative block">
          <span className="sr-only">ค้นหาบันทึก</span>
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base" aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาจากชื่อ เนื้อหา หรือ tag..."
            className="w-full rounded-2xl py-3 pl-10 pr-4 outline-none text-sm"
            style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)", color: "var(--ink)" }}
          />
        </label>
        {tags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="กรองตาม tag">
            {["ทั้งหมด", ...tags].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTag(item)}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs transition-opacity hover:opacity-75"
                style={{
                  backgroundColor: tag === item ? "var(--accent)" : "var(--accent-light)",
                  color: tag === item ? "#fff" : "var(--accent)",
                  border: "1px solid var(--border)",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs" style={{ color: "var(--ink-light)" }}>
          แสดง {filtered.length} จาก {posts.length} บันทึก
        </p>
      </div>

      <div className="space-y-6">
        {filtered.map((post) => (
          <Link key={post.slug} href={`/posts/${post.slug}`}>
            <article
              className="rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
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
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((postTag) => (
                      <span key={postTag} className="text-xs px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>
                        {postTag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-20" style={{ color: "var(--ink-light)", fontStyle: "italic" }}>
          ไม่พบบันทึกที่ตรงกัน ลองเปลี่ยนคำค้นหาหรือ tag ดูนะ
        </p>
      )}
    </>
  );
}
