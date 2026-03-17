import { LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 px-6">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-[#e5e5e8]/60 tracking-wide">
            aPOW
          </span>
          <span className="text-[10px] text-[#e5e5e8]/20">|</span>
          <span className="text-[10px] text-[#e5e5e8]/30">
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
              className="text-[10px] text-[#e5e5e8]/30 hover:text-[#e5e5e8]/60 tracking-wide transition-colors"
            >
              {link.label}
            </a>
          ))}

          {/* Built on Base badge */}
          <span className="text-[10px] text-[oklch(0.65_0.15_250)]/60 tracking-wide border border-[oklch(0.65_0.15_250)]/20 rounded-full px-2.5 py-0.5">
            Built on Base
          </span>
        </div>
      </div>
    </footer>
  );
}
