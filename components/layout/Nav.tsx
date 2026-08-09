import Link from "next/link";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

const links = [
  { href: "/", label: "Diary" },
  { href: "/currently", label: "Currently" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  return (
    <nav
      className="border-b py-4 px-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--warm-white)" }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          style={{ fontFamily: "var(--font-lora, Georgia, serif)", fontWeight: 500, color: "var(--ink)", fontSize: "1.1rem" }}
        >
          My Diary
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex gap-5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm transition-opacity hover:opacity-60"
                style={{ fontFamily: "var(--font-inter, Inter, sans-serif)", color: "var(--ink-light)" }}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://draftstage-48.aomsinzxc.chatgpt.site/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-75 whitespace-nowrap"
              style={{
                fontFamily: "var(--font-inter, Inter, sans-serif)",
                color: "var(--accent)",
                backgroundColor: "var(--accent-light)",
              }}
            >
              48 Draftstage ↗
            </a>
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
}
