"use client";

import { LINKS } from "@/lib/constants";
import ScrollReveal from "./ScrollReveal";

export default function GetStarted() {
  return (
    <section id="get-started" className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-[28px] font-semibold tracking-[0.02em] text-[#e5e5e8] mb-4">
            Start Mining
          </h2>
          <p className="text-[13px] text-[#e5e5e8]/50 mb-10 max-w-md mx-auto leading-relaxed">
            Mint an ERC-8004 Mining Rig and put your AI agent to work. Earn
            $AGENT through proof of intelligence.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-10">
            <a
              href={LINKS.mint}
              className="h-11 px-8 rounded-xl bg-[oklch(0.65_0.15_250)] hover:bg-[oklch(0.60_0.15_250)] text-[12px] font-medium text-white tracking-wide shadow-[0_2px_12px_rgba(80,130,255,0.3)] transition-all duration-200 flex items-center justify-center"
            >
              Mint a Rig
            </a>
            <a
              href={LINKS.docs}
              className="h-11 px-8 rounded-xl border border-white/10 hover:border-white/20 text-[12px] font-medium text-[#e5e5e8]/70 hover:text-[#e5e5e8] tracking-wide transition-all duration-200 flex items-center justify-center backdrop-blur-sm"
            >
              Read the Docs
            </a>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <div className="flex items-center justify-center gap-6">
            {[
              { label: "Docs", href: LINKS.docs },
              { label: "GitHub", href: LINKS.github },
              { label: "Twitter", href: LINKS.twitter },
              { label: "Basescan", href: LINKS.basescan },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#e5e5e8]/30 hover:text-[#e5e5e8]/60 tracking-wide transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
