import Nav from "@/components/layout/Nav";
import { getAllProjects } from "@/lib/projects";

export default function ArchitecturePage() {
  const projects = getAllProjects();
  const preview = projects.find((p) => p.pdf);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <Nav />

      <main className="max-w-2xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1
            className="text-3xl mb-2"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
          >
            Architecture
          </h1>
          <p
            className="text-base"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}
          >
            System design and data pipeline documents
          </p>
        </header>

        {/* Project cards */}
        <div className="space-y-4 mb-10">
          {projects.map((project) => (
            <a
              key={project.slug}
              href={project.pdf ? `/${encodeURIComponent(project.pdf)}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: "var(--warm-white)",
                border: "1px solid var(--border)",
                boxShadow: "0 1px 4px rgba(44,36,22,0.05)",
                textDecoration: "none",
                opacity: project.pdf ? 1 : 0.6,
                cursor: project.pdf ? "pointer" : "default",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl shrink-0"
                  style={{ backgroundColor: "var(--accent-light)" }}
                >
                  {project.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="mb-0.5"
                    style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500, fontSize: "1.05rem" }}
                  >
                    {project.title}
                  </p>
                  <p
                    className="text-sm leading-relaxed mb-2"
                    style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)" }}
                  >
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--accent-light)",
                          color: "var(--accent)",
                          fontFamily: "var(--font-inter, Inter, sans-serif)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {project.pdf && (
                  <span
                    className="text-xs shrink-0"
                    style={{ color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
                  >
                    Open PDF →
                  </span>
                )}
              </div>
            </a>
          ))}

          {projects.length === 0 && (
            <p className="text-center py-16" style={{ color: "var(--ink-light)", fontStyle: "italic", fontFamily: "var(--font-lora, Georgia, serif)" }}>
              ยังไม่มีโปรเจกต์...
            </p>
          )}
        </div>

        {/* PDF Preview */}
        {preview && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(44,36,22,0.05)" }}
          >
            <div
              className="px-6 py-3 flex items-center justify-between"
              style={{ backgroundColor: "var(--warm-white)", borderBottom: "1px solid var(--border)" }}
            >
              <p
                className="text-sm"
                style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}
              >
                Preview — {preview.title}
              </p>
            </div>
            <iframe
              src={`/${encodeURIComponent(preview.pdf)}`}
              className="w-full"
              style={{ height: "70vh", border: "none" }}
              title={preview.title}
            />
          </div>
        )}
      </main>

      <footer
        className="text-center py-8 text-xs mt-4"
        style={{ borderTop: "1px solid var(--border)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)", letterSpacing: "0.05em" }}
      >
        written with love ✦
      </footer>
    </div>
  );
}
