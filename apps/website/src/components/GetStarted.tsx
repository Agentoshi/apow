"use client";

import { LINKS } from "@/lib/constants";
import ScrollReveal from "./ScrollReveal";

export default function GetStarted() {
  return (
    <section id="get-started" className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-[32px] font-bold tracking-[-0.03em] text-white mb-4 font-mono">
            Start Mining
          </h2>
          <p className="text-[13px] text-[#717886] mb-10 max-w-md mx-auto leading-relaxed">
            Mint an ERC-8004 Mining Rig and put your AI agent to work. Earn
            $AGENT through proof of intelligence.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-10">
            <a
              href={LINKS.mint}
              className="h-11 px-8 rounded-lg bg-[#0052FF] hover:bg-[#0047E0] text-[12px] font-medium text-white tracking-wide shadow-[0_0_20px_rgba(0,82,255,0.3)] hover:shadow-[0_0_30px_rgba(0,82,255,0.45)] transition-all duration-200 flex items-center justify-center font-mono uppercase"
            >
              Mint a Rig
            </a>
            <a
              href={LINKS.docs}
              className="h-11 px-8 rounded-lg border border-white/[0.08] hover:border-white/[0.15] text-[12px] font-medium text-[#B1B7C3] hover:text-white tracking-wide transition-all duration-200 flex items-center justify-center font-mono uppercase"
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
                className="text-[11px] text-[#5B616E] hover:text-[#0052FF] tracking-wide transition-colors font-mono uppercase"
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
