import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      {/* Header */}
      <header
        className="border-b py-12 text-center"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--warm-white)" }}
      >
        <p
          className="text-sm uppercase tracking-widest mb-3"
          style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)", letterSpacing: "0.15em" }}
        >
          — personal diary —
        </p>
        <h1
          className="text-5xl mb-3"
          style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
        >
          My Diary
        </h1>
        <p
          className="text-base"
          style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}
        >
          บันทึกเล็กๆ ของชีวิตประจำวัน
        </p>
      </header>

      {/* Posts */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/posts/${post.slug}`}>
              <article
                className="rounded-2xl p-7 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  backgroundColor: "var(--warm-white)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 1px 4px rgba(44,36,22,0.05)",
                }}
              >
                <div className="flex items-start gap-5">
                  {/* Emoji */}
                  <div
                    className="text-4xl w-14 h-14 flex items-center justify-center rounded-xl shrink-0 mt-0.5"
                    style={{ backgroundColor: "var(--accent-light)" }}
                  >
                    {post.coverEmoji}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{post.mood}</span>
                      <time
                        className="text-xs"
                        style={{
                          fontFamily: "var(--font-inter, Inter, sans-serif)",
                          color: "var(--accent)",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {formatDate(post.date)}
                      </time>
                    </div>

                    <h2
                      className="text-xl mb-2 leading-snug"
                      style={{
                        fontFamily: "var(--font-lora, Georgia, serif)",
                        color: "var(--ink)",
                        fontWeight: 500,
                      }}
                    >
                      {post.title}
                    </h2>

                    <p
                      className="text-sm leading-relaxed mb-3 line-clamp-2"
                      style={{
                        fontFamily: "var(--font-lora, Georgia, serif)",
                        color: "var(--ink-light)",
                        fontStyle: "italic",
                      }}
                    >
                      {post.excerpt}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2.5 py-0.5 rounded-full"
                          style={{
                            fontFamily: "var(--font-inter, Inter, sans-serif)",
                            backgroundColor: "var(--accent-light)",
                            color: "var(--accent)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <p className="text-center py-20" style={{ color: "var(--ink-light)", fontStyle: "italic" }}>
            ยังไม่มีบันทึกใดๆ เลย...
          </p>
        )}
      </main>

      <footer
        className="text-center py-8 text-xs"
        style={{
          borderTop: "1px solid var(--border)",
          color: "var(--accent)",
          fontFamily: "var(--font-inter, Inter, sans-serif)",
          letterSpacing: "0.05em",
        }}
      >
        written with love ✦
      </footer>
    </div>
  );
}
