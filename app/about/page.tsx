import Nav from "@/components/Nav";

const experience = [
  {
    year: "2023 – Present",
    role: "Mathematics Tutor",
    company: "Ratchaburi, Thailand",
    items: [
      "Analyzed student data to identify learning gaps and optimize teaching strategies.",
      "Simplified complex concepts for clear and effective communication.",
    ],
  },
  {
    year: "2021 – 2022",
    role: "Staff of Academic Olympiad Camp (POSN2)",
    company: "Silpakorn University",
    items: [
      "Collected and cleaned student data from Excel (survey responses)",
      "Built interactive dashboard using Looker Studio",
      "Analyzed food allergies, medical conditions, and insurance data",
      "Supported planning and risk management using data insights",
    ],
  },
  {
    year: "2020 – 2022",
    role: "Student Council",
    company: "Faculty of Science, Silpakorn University",
    items: [
      "Assisted in planning and managing faculty events with large student participation",
      "Promoted to vice leader in 2022",
    ],
  },
];

const research = [
  {
    year: "2026 (In Progress)",
    title: "Automated Ethereum Data Pipeline & Anomaly Detection",
    type: "Independent Study",
    pdf: "kyo_miniproject_datapipeline for ETH.pdf",
    items: [
      "Developed an end-to-end ETL pipeline using Python to extract Ethereum data with robust error handling.",
      "Processed and transformed data using PySpark and Spark SQL on Databricks.",
      "Applied statistical methods using SQL window functions to detect price spikes and crashes.",
      "Designed dashboard to visualize data-driven insights.",
    ],
  },
  {
    year: "2022",
    title: "Injectivity and quasi-injectivity of products of some polynomials and Dedekind psi function",
    type: "Undergraduate Research Project",
    pdf: null,
    items: [
      "Applied MATLAB to analyze numerical patterns and detect duplicate function outputs",
      "Performed data matching and validation using Excel",
      "Documented findings and presented analytical results in a structured format",
    ],
  },
];

const education = [
  { year: "2026 – Present", degree: "Data Engineering Bootcamp (In Progress)", school: "Databricks for Data Engineers Bootcamp 2 · Thailand" },
  { year: "2017 – 2022", degree: "Bachelor of Science (Mathematics)", school: "Silpakorn University · Nakhon Pathom, Thailand" },
  { year: "2012 – 2017", degree: "Benjamarachutit Ratchaburi School", school: "Ratchaburi, Thailand" },
];

const skills = [
  { category: "Data Engineering", items: ["ETL/ELT Pipelines", "Data Modeling (Star Schema)", "Delta Lake"] },
  { category: "Data Analysis", items: ["EDA", "Statistical Analysis", "Data Cleaning"] },
  { category: "Data Visualization", items: ["Looker Studio", "Databricks", "Excel"] },
  { category: "Programming", items: ["Python", "PySpark", "NumPy", "Pandas", "SQL", "R", "MATLAB"] },
  { category: "Tools", items: ["Databricks", "Excel", "PowerPoint", "LaTeX", "AI"] },
];

const certifications = [
  "Data Science for Everyone — Future Skills (2026)",
  "Power BI Data Transformation (Power Query) — Future Skills (2026)",
  "AI with Data Visualization — Future Skills (2025)",
  "SQL for Data Analysis — Future Skills (2025)",
  "Push It with Data — Chula MOOC (2025)",
];

const languages = [
  { lang: "Thai", level: "Native" },
  { lang: "English", level: "Intermediate" },
  { lang: "Japanese", level: "Beginning" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-lg mb-4"
        style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      <Nav />

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-10">
        {/* Profile */}
        <section className="flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shrink-0"
            style={{ backgroundColor: "var(--accent-light)", border: "2px solid var(--border)" }}
          >
            🧑‍💻
          </div>
          <div>
            <h1
              className="text-3xl mb-1"
              style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}
            >
              Chonlathit Phuncam
            </h1>
            <p className="text-sm mb-1" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--accent)" }}>
              Data Engineer · Ratchaburi, Thailand
            </p>
            <div className="flex flex-wrap gap-3 text-xs" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>
              <span>090-6324894</span>
              <a href="mailto:phuncam.c@gmail.com" className="hover:opacity-70">phuncam.c@gmail.com</a>
              <a href="https://www.linkedin.com/in/chonlathitp" target="_blank" rel="noopener noreferrer" className="hover:opacity-70">LinkedIn</a>
              <a href="https://linktr.ee/kyo.skykim" target="_blank" rel="noopener noreferrer" className="hover:opacity-70">Linktree</a>
            </div>
          </div>
        </section>

        {/* Profile Summary */}
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}
        >
          <p
            className="leading-relaxed"
            style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontStyle: "italic", color: "var(--ink-light)", fontSize: "0.95rem" }}
          >
            Bachelor of Science in Mathematics with coursework in Mathematical Analysis, Applied Mathematics and Elementary Statistics.
            Currently attending a Data Engineering intensive bootcamp. Adept at logical problem-solving and applying mathematical
            principles to analyze complex datasets and support data-driven decision-making.
          </p>
        </div>

        {/* CV Download */}
        <div
          className="rounded-2xl p-6 flex items-center justify-between"
          style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}
        >
          <div>
            <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>Curriculum Vitae</p>
            <p className="text-sm" style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>CV_Conlathit_Phuncam.pdf</p>
          </div>
          <a
            href="/CV_Conlathit_Phuncam.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-5 py-2 rounded-full transition-opacity hover:opacity-70"
            style={{ backgroundColor: "var(--accent)", color: "#fff", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
          >
            Download
          </a>
        </div>

        {/* Experience */}
        <Section title="Experiences & Activities">
          <div className="space-y-4">
            {experience.map((e, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>{e.role}</p>
                    <p className="text-sm" style={{ color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{e.company}</p>
                  </div>
                  <span className="text-xs shrink-0 mt-1" style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{e.year}</span>
                </div>
                <ul className="space-y-1">
                  {e.items.map((item, j) => (
                    <li key={j} className="text-sm flex gap-2" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink-light)", fontStyle: "italic" }}>
                      <span style={{ color: "var(--accent)" }}>·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* Research */}
        <Section title="Research Projects">
          <div className="space-y-4">
            {research.map((r, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500, fontSize: "0.95rem" }}>{r.title}</p>
                      <p className="text-sm" style={{ color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{r.type}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs" style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{r.year}</span>
                      {r.pdf && (
                        <a
                          href={`/${encodeURIComponent(r.pdf)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1 rounded-full transition-opacity hover:opacity-70"
                          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}
                        >
                          PDF ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {r.items.map((item, j) => (
                      <li key={j} className="text-sm flex gap-2" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink-light)", fontStyle: "italic" }}>
                        <span style={{ color: "var(--accent)" }}>·</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
                {r.pdf && (
                  <iframe
                    src={`/${encodeURIComponent(r.pdf)}`}
                    className="w-full"
                    style={{ height: "60vh", border: "none", borderTop: "1px solid var(--border)" }}
                    title={r.title}
                  />
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Education */}
        <Section title="Education">
          <div className="space-y-3">
            {education.map((e, i) => (
              <div key={i} className="rounded-2xl p-5 flex items-start justify-between gap-4" style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>{e.degree}</p>
                  <p className="text-sm" style={{ color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{e.school}</p>
                </div>
                <span className="text-xs shrink-0 mt-1" style={{ color: "var(--ink-light)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>{e.year}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Skills */}
        <Section title="Skills">
          <div className="space-y-3">
            {skills.map((s, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}>
                <p className="text-sm mb-3" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)", fontWeight: 500 }}>{s.category}</p>
                <div className="flex flex-wrap gap-2">
                  {s.items.map((item) => (
                    <span key={item} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Certifications */}
        <Section title="Certifications">
          <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}>
            <ol className="space-y-2 list-decimal list-inside">
              {certifications.map((c, i) => (
                <li key={i} className="text-sm" style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink-light)" }}>{c}</li>
              ))}
            </ol>
          </div>
        </Section>

        {/* Languages */}
        <Section title="Languages">
          <div className="rounded-2xl p-5 flex gap-6" style={{ backgroundColor: "var(--warm-white)", border: "1px solid var(--border)" }}>
            {languages.map((l) => (
              <div key={l.lang}>
                <p style={{ fontFamily: "var(--font-lora, Georgia, serif)", color: "var(--ink)", fontWeight: 500 }}>{l.lang}</p>
                <p className="text-sm" style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}>{l.level}</p>
              </div>
            ))}
          </div>
        </Section>
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
