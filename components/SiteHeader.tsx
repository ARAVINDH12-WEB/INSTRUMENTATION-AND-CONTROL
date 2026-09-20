"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const pathname = usePathname();

  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "PROJECTS", href: "/projects" },
    { name: "PID LAB", href: "/pid-lab" },
    { name: "CALCULATORS", href: "/calculators" },
    { name: "NOTES", href: "/notes" },
    { name: "DASHBOARD", href: "/dashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-panel-2">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-6 py-3.5 flex-wrap">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="grid h-8 w-8 place-items-center rounded border border-amber bg-panel font-mono text-sm font-semibold text-amber shadow-[inset_0_0_8px_rgba(255,176,0,0.15)]">
            CF
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-wide text-text group-hover:text-amber transition-colors">
              ControlForge
            </span>
            <span className="font-mono text-[11px] tracking-wider text-text-dim">
              MEASURE · MODEL · CONTROL
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 flex-wrap" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`rounded px-3 py-1.5 font-mono text-[13px] tracking-wider transition-colors ${
                  isActive
                    ? "border border-amber-dim bg-panel text-amber"
                    : "border border-transparent text-text-dim hover:border-line hover:bg-panel hover:text-amber"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 rounded border border-line bg-panel px-2.5 py-1 font-mono text-xs text-text-dim">
          <span className="h-2 w-2 rounded-full bg-verdigris shadow-[0_0_6px_rgba(79,169,138,0.6)] animate-pulse" />
          <span>SYS · ONLINE</span>
        </div>
      </div>
    </header>
  );
}
