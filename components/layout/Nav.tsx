import Link from "next/link";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

const links = [
  { href: "/", label: "Diary" },
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
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
}
