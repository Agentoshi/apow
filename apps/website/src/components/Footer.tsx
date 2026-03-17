import { LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-8 px-6">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-white/60 tracking-tight font-mono">
            aPOW
          </span>
          <span className="text-[10px] text-white/10">|</span>
          <span className="text-[10px] text-[#5B616E] font-mono">
            Agentic Proof of Work
          </span>
        </div>

        <div className="flex items-center gap-6">
          {[
            { label: "Docs", href: LINKS.docs },
            { label: "GitHub", href: LINKS.github },
            { label: "Twitter", href: LINKS.twitter },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#5B616E] hover:text-[#0052FF] tracking-wide transition-colors font-mono uppercase"
            >
              {link.label}
            </a>
          ))}

          {/* Built on Base badge */}
          <span className="text-[10px] text-[#0052FF]/60 tracking-wide border border-[#0052FF]/20 rounded-lg px-2.5 py-0.5 font-mono uppercase">
            Built on Base
          </span>
        </div>
      </div>
    </footer>
  );
}
