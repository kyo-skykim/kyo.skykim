import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getAllPosts, getRelatedPosts, formatDate } from "@/lib/diary";
import ReadingMode from "@/components/diary/ReadingMode";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const title = `${post.title} — My Diary`;
  return {
    title,
    description: post.excerpt,
    openGraph: {
      title,
      description: post.excerpt,
      type: "article",
      url: `/posts/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.excerpt,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(slug, post.tags);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      {/* Nav */}
      <nav
        className="border-b py-4 px-6"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--warm-white)" }}
      >
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-sm inline-flex items-center gap-1.5 transition-colors hover:opacity-70"
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              color: "var(--accent)",
            }}
          >
            ← กลับหน้าหลัก
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="text-5xl mb-5">{post.coverEmoji}</div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xl">{post.mood}</span>
            <time
              className="text-sm"
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                color: "var(--accent)",
              }}
            >
              {formatDate(post.date)}
            </time>
            <span className="text-sm" style={{ color: "var(--ink-light)" }}>·</span>
            <span
              className="text-sm"
              style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}
            >
              อ่าน {post.readingTime} นาที
            </span>
          </div>

          <h1
            className="text-3xl leading-snug mb-4"
            style={{
              fontFamily: "var(--font-lora, Georgia, serif)",
              color: "var(--ink)",
              fontWeight: 500,
            }}
          >
            {post.title}
          </h1>

          <p
            className="text-base leading-relaxed"
            style={{
              fontFamily: "var(--font-lora, Georgia, serif)",
              color: "var(--ink-light)",
              fontStyle: "italic",
            }}
          >
            {post.excerpt}
          </p>

          <div className="flex flex-wrap gap-1.5 justify-center mt-4">
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
          <ReadingMode contentHtml={post.content} />
        </header>

        {/* Divider */}
        <div
          className="border-t mb-10"
          style={{ borderColor: "var(--border)" }}
        />

        {/* Content */}
        <article
          className="rounded-2xl px-8 py-10"
          style={{
            backgroundColor: "var(--warm-white)",
            border: "1px solid var(--border)",
            boxShadow: "0 1px 4px rgba(44,36,22,0.05)",
          }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{
              fontFamily: "var(--font-lora, Georgia, serif)",
              fontSize: "1.05rem",
              lineHeight: "1.9",
              color: "var(--ink-light)",
            }}
            className="diary-prose"
          />
        </article>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2
              className="text-lg mb-4"
              style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
            >
              บันทึกอื่น ๆ
            </h2>
            <div className="space-y-3">
              {related.map((r) => (
                <Link key={r.slug} href={`/posts/${r.slug}`}>
                  <article
                    className="rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                    style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}
                  >
                    <div
                      className="text-2xl w-11 h-11 flex items-center justify-center rounded-xl shrink-0"
                      style={{ backgroundColor: "var(--accent-light)" }}
                    >
                      {r.coverEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="leading-snug truncate"
                        style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
                      >
                        {r.title}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}
                      >
                        {formatDate(r.date)} · อ่าน {r.readingTime} นาที
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm px-6 py-2.5 rounded-full transition-all hover:opacity-80"
            style={{
              fontFamily: "var(--font-inter, Inter, sans-serif)",
              backgroundColor: "var(--accent-light)",
              color: "var(--accent)",
              border: "1px solid var(--border)",
            }}
          >
            ← ดูบันทึกทั้งหมด
          </Link>
        </div>
      </main>

      <footer
        className="text-center py-8 text-xs mt-4"
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
