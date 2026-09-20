import Link from "next/link";

interface SiteFooterProps {
  subtitle?: string;
}

export default function SiteFooter({ subtitle }: SiteFooterProps) {
  return (
    <footer className="mt-auto border-t border-line bg-panel-2 px-6 py-8">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-6 font-mono text-xs text-text-faint">
        <div>CONTROLFORGE · INSTRUMENTATION &amp; CONTROL ARCHIVE</div>
        <div className="flex gap-5">
          <Link href="/" className="text-text-dim hover:text-amber transition-colors">
            HOME
          </Link>
          <Link href="/projects" className="text-text-dim hover:text-amber transition-colors">
            PROJECTS
          </Link>
          <Link href="/pid-lab" className="text-text-dim hover:text-amber transition-colors">
            PID LAB
          </Link>
          <Link href="/calculators" className="text-text-dim hover:text-amber transition-colors">
            CALCULATORS
          </Link>
          <Link href="/notes" className="text-text-dim hover:text-amber transition-colors">
            NOTES
          </Link>
          <Link href="/dashboard" className="text-text-dim hover:text-amber transition-colors">
            DASHBOARD
          </Link>
        </div>
        <div>{subtitle || "STANDARDS // ISA-5.1 · IEC 61131-3 · NAMUR NE43"}</div>
      </div>
    </footer>
  );
}
