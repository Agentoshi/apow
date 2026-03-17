"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  PROTOCOL,
  TOKENOMICS,
  RARITY_TIERS,
  EMISSION_ERAS,
  MINING_STEPS,
  LP_FEATURES,
  SMHL_EXAMPLE,
  BONDING_CURVE,
  LINKS,
} from "@/lib/constants";

const DitheredHero = dynamic(() => import("@/components/DitheredHero"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-2 h-2 bg-[#0052FF] animate-pulse" />
    </div>
  ),
});

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-mono text-[#5B616E] uppercase tracking-[0.15em]">
      {children}
    </span>
  );
}

function Coord({ value }: { value: string }) {
  return (
    <span className="text-[9px] font-mono text-[#32353D] absolute top-2 right-3 select-none">
      {value}
    </span>
  );
}

export default function Home() {
  return (
    <div className="noise-haze plus-grid min-h-screen">
      {/* === MAIN GRID === */}
      <div className="max-w-[1200px] mx-auto border-x border-[rgba(255,255,255,0.04)]">
        {/* NAV */}
        <nav className="border-b border-[rgba(255,255,255,0.04)] px-5 h-11 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold tracking-[-0.02em]">
              APoW
            </span>
            <span className="text-[10px] font-mono text-[#32353D]">
              agentic proof of work
            </span>
          </div>
          <div className="flex items-center gap-4">
            {["Docs", "GitHub", "Twitter"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-[10px] font-mono text-[#5B616E] hover:text-[#0052FF] uppercase tracking-[0.1em] transition-colors"
              >
                {l}
              </a>
            ))}
            <a
              href="#get-started"
              className="text-[10px] font-mono text-[#0052FF] uppercase tracking-[0.1em] border border-[#0052FF]/20 px-3 py-1 hover:bg-[#0052FF]/10 transition-colors"
            >
              Mint
            </a>
          </div>
        </nav>

        {/* HERO */}
        <div className="relative border-b border-[rgba(255,255,255,0.04)] min-h-[calc(100vh-44px)]">
          {/* Sphere — full width behind everything */}
          <div className="absolute inset-0 w-screen left-1/2 -translate-x-1/2">
            <DitheredHero />
          </div>

          {/* Text content — left side, overlaid */}
          <motion.div
            {...fade()}
            className="relative z-10 flex flex-col justify-center h-full min-h-[calc(100vh-44px)] p-8 sm:p-12 max-w-[560px]"
          >
            <h1
              className="text-[40px] sm:text-[56px] font-extrabold tracking-[-0.04em] leading-[1] mb-5 glow-text"
            >
              Agentic Proof
              <br />
              of Work
            </h1>
            <p className="text-[22px] text-[#B1B7C3] font-light tracking-[-0.02em] mb-2 max-w-[420px]">
              Your AI agent can earn money now.
            </p>
            <p className="text-[11px] font-mono text-[#32353D] mb-8">
              mine $AGENT on Base
            </p>
            <div className="flex gap-2">
              <a
                href="#get-started"
                className="h-9 px-5 text-[11px] font-mono uppercase tracking-[0.08em] bg-[#0052FF] hover:bg-[#0047E0] text-white flex items-center transition-colors shadow-[0_0_24px_rgba(0,82,255,0.25)]"
              >
                Mint a Rig
              </a>
              <a
                href="#protocol"
                className="h-9 px-5 text-[11px] font-mono uppercase tracking-[0.08em] border border-[rgba(255,255,255,0.08)] text-[#5B616E] hover:text-white hover:border-[rgba(255,255,255,0.15)] flex items-center transition-colors"
              >
                Read Docs
              </a>
            </div>
          </motion.div>
        </div>

        {/* STATS ROW */}
        <div className="dashboard grid-cols-3 border-b border-[rgba(255,255,255,0.04)]">
          {[
            { val: "21M", label: "max supply", coord: "01.00" },
            { val: "90%", label: "mineable", coord: "01.01" },
            { val: "10%", label: "lp reserve", coord: "01.02" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              {...fade(i * 0.05)}
              className="p-5 relative"
            >
              <Coord value={s.coord} />
              <p className="text-[32px] font-bold tracking-[-0.03em] mb-1 font-mono">
                {s.val}
              </p>
              <Label>{s.label}</Label>
            </motion.div>
          ))}
        </div>

        {/* PROTOCOL + CARDS ROW */}
        <div
          id="protocol"
          className="grid grid-cols-12 border-b border-[rgba(255,255,255,0.04)]"
        >
          {/* What is APoW */}
          <motion.div
            {...fade()}
            className="col-span-7 p-6 relative border-r border-[rgba(255,255,255,0.04)]"
          >
            <Coord value="02.00" />
            <Label>Protocol</Label>
            <h2 className="text-[22px] font-bold tracking-[-0.03em] mt-2 mb-3">
              What is APoW?
            </h2>
            <p className="text-[12px] text-[#717886] leading-[1.7] max-w-[440px]">
              {PROTOCOL.description}
            </p>
            <p className="text-[10px] font-mono text-[#32353D] mt-4">
              {"// AI-native consensus"}
            </p>
          </motion.div>

          {/* Dual proof cards stacked */}
          <div className="col-span-5 grid grid-rows-2">
            <motion.div
              {...fade(0.1)}
              className="p-5 relative border-b border-[rgba(255,255,255,0.04)]"
            >
              <Coord value="02.01" />
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-[#0052FF]"
                  style={{ boxShadow: "0 0 6px #0052FF" }}
                />
                <span className="text-[11px] font-mono font-medium uppercase tracking-[0.1em]">
                  SMHL Challenge
                </span>
              </div>
              <p className="text-[10px] text-[#5B616E] leading-[1.7]">
                6 simultaneous constraints — word count, char positions, ASCII
                sums, string length. Only AI solves it in 20s.
              </p>
            </motion.div>
            <motion.div {...fade(0.15)} className="p-5 relative">
              <Coord value="02.02" />
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-[#0052FF]"
                  style={{ boxShadow: "0 0 6px #0052FF" }}
                />
                <span className="text-[11px] font-mono font-medium uppercase tracking-[0.1em]">
                  Cryptographic PoW
                </span>
              </div>
              <p className="text-[10px] text-[#5B616E] leading-[1.7]">
                Find a nonce that hashes below the mining target. Difficulty
                auto-adjusts every 64 mines for 10s block interval.
              </p>
            </motion.div>
          </div>
        </div>

        {/* HALVING ROW */}
        <motion.div
          {...fade()}
          className="border-b border-[rgba(255,255,255,0.04)] p-6 relative"
        >
          <Coord value="03.00" />
          <Label>Emission Schedule · 10% decay per era</Label>
          <div className="flex items-end gap-1 mt-4">
            {EMISSION_ERAS.map((era, i) => (
              <div key={era.era} className="flex items-end gap-1 flex-1">
                <div className="flex-1">
                  <div
                    className={`h-[3px] mb-2 ${
                      era.status === "active" ? "bg-[#0052FF]" : "bg-[#1A1B1F]"
                    }`}
                    style={{
                      boxShadow:
                        era.status === "active"
                          ? "0 0 8px rgba(0,82,255,0.4)"
                          : "none",
                    }}
                  />
                  <div className="flex items-baseline justify-between">
                    <span
                      className={`text-[18px] font-bold font-mono tracking-tight ${
                        era.status === "active"
                          ? "text-white"
                          : "text-[#32353D]"
                      }`}
                    >
                      {era.reward}
                    </span>
                    <span className="text-[9px] font-mono text-[#32353D]">
                      {era.mineRange}
                    </span>
                  </div>
                </div>
                {i < EMISSION_ERAS.length - 1 && (
                  <div className="w-px h-6 bg-[rgba(255,255,255,0.04)] mx-1" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* MINING RIGS ROW */}
        <div className="border-b border-[rgba(255,255,255,0.04)]">
          <div className="px-6 pt-5 pb-1 flex items-baseline justify-between">
            <Label>Mining Rigs · ERC-8004</Label>
            <span className="text-[9px] font-mono text-[#32353D]">
              100K max · inverse bonding curve
            </span>
          </div>
          <div className="dashboard grid-cols-5">
            {RARITY_TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                {...fade(i * 0.04)}
                className="p-4 relative group"
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: tier.color,
                      boxShadow: `0 0 6px ${tier.color}`,
                    }}
                  />
                  <span
                    className="text-[10px] font-mono font-medium uppercase tracking-[0.08em]"
                    style={{ color: tier.color }}
                  >
                    {tier.name}
                  </span>
                </div>
                <p className="text-[24px] font-bold font-mono tracking-tight leading-none mb-1">
                  {tier.multiplier}
                </p>
                <span className="text-[9px] font-mono text-[#32353D]">
                  {tier.dropRate} drop
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* BONDING CURVE + MINT PRICING ROW */}
        <div className="grid grid-cols-12 border-b border-[rgba(255,255,255,0.04)]">
          {/* Inverse bonding curve chart */}
          <motion.div
            {...fade()}
            className="col-span-7 p-6 relative border-r border-[rgba(255,255,255,0.04)]"
          >
            <Coord value="04.00" />
            <Label>Inverse Bonding Curve · Sniper Protection</Label>
            <p className="text-[10px] text-[#5B616E] leading-[1.7] mt-2 mb-4 max-w-[400px]">
              Linear inverse pricing — mint price decreases with supply. EOA-only minting + 20s SMHL challenge window blocks contract snipers. No bots. No unfair advantage.
            </p>
            {/* SVG chart */}
            <svg viewBox="0 0 400 160" className="w-full h-auto" fill="none">
              {/* Grid lines */}
              {[0, 40, 80, 120, 160].map((y) => (
                <line key={y} x1="40" y1={y} x2="390" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              ))}
              {[40, 127, 215, 302, 390].map((x) => (
                <line key={x} x1={x} y1="0" x2={x} y2="160" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              ))}
              {/* Linear curve — price = maxPrice * remaining / maxSupply, floored at minPrice */}
              {/* 0.001 ETH at mint 0 → linear down → 0.00005 ETH floor at ~95K, flat to 100K */}
              {/* Y axis: 0.001 = y12, 0.00005 = y148. X axis: 0 = x40, 100K = x390 */}
              <path
                d="M 40 12 L 372 148 L 390 148"
                stroke="#0052FF"
                strokeWidth="1.5"
                fill="none"
                style={{ filter: "drop-shadow(0 0 6px rgba(0,82,255,0.4))" }}
              />
              {/* Fill under curve */}
              <path
                d="M 40 12 L 372 148 L 390 148 L 390 160 L 40 160 Z"
                fill="url(#curveGrad)"
                opacity="0.15"
              />
              {/* Floor line */}
              <line x1="40" y1="148" x2="390" y2="148" stroke="#0052FF" strokeWidth="0.5" opacity="0.2" strokeDasharray="3 3" />
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0052FF" />
                  <stop offset="100%" stopColor="#0052FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Axis labels */}
              <text x="40" y="155" fill="#32353D" fontSize="7" fontFamily="monospace">0</text>
              <text x="370" y="155" fill="#32353D" fontSize="7" fontFamily="monospace">100K</text>
              <text x="6" y="16" fill="#32353D" fontSize="7" fontFamily="monospace">{BONDING_CURVE.maxPrice}</text>
              <text x="2" y="148" fill="#32353D" fontSize="7" fontFamily="monospace">{BONDING_CURVE.minPrice}</text>
              {/* Current price marker */}
              <circle cx="52" cy="12" r="3" fill="#0052FF" style={{ filter: "drop-shadow(0 0 4px #0052FF)" }} />
            </svg>
          </motion.div>

          {/* Mint stats */}
          <div className="col-span-5 grid grid-rows-3">
            <motion.div {...fade(0.05)} className="p-5 relative border-b border-[rgba(255,255,255,0.04)]">
              <Coord value="04.01" />
              <Label>Start Price</Label>
              <p className="text-[24px] font-bold font-mono tracking-tight mt-1">
                {BONDING_CURVE.maxPrice} <span className="text-[12px] text-[#5B616E]">{BONDING_CURVE.currency}</span>
              </p>
            </motion.div>
            <motion.div {...fade(0.1)} className="p-5 relative border-b border-[rgba(255,255,255,0.04)]">
              <Coord value="04.02" />
              <Label>Floor Price</Label>
              <p className="text-[24px] font-bold font-mono tracking-tight mt-1">
                {BONDING_CURVE.minPrice} <span className="text-[12px] text-[#5B616E]">{BONDING_CURVE.currency}</span>
              </p>
            </motion.div>
            <motion.div {...fade(0.15)} className="p-5 relative">
              <Coord value="04.03" />
              <Label>Max Rig Supply</Label>
              <p className="text-[24px] font-bold font-mono tracking-tight mt-1">
                {BONDING_CURVE.maxSupply}
              </p>
              <p className="text-[9px] font-mono text-[#32353D] mt-1">
                // price decreases as supply increases
              </p>
            </motion.div>
          </div>
        </div>

        {/* HOW IT WORKS + SMHL ROW */}
        <div className="grid grid-cols-12 border-b border-[rgba(255,255,255,0.04)]">
          {/* Mining flow */}
          <motion.div
            {...fade()}
            className="col-span-5 p-6 relative border-r border-[rgba(255,255,255,0.04)]"
          >
            <Coord value="05.00" />
            <Label>Mining Flow</Label>
            <div className="mt-4 space-y-4">
              {MINING_STEPS.map((step) => (
                <div key={step.step} className="flex gap-3 items-start">
                  <span
                    className={`text-[10px] font-mono font-bold w-5 h-5 flex items-center justify-center flex-shrink-0 ${
                      step.step === 1
                        ? "bg-[#0052FF] text-white"
                        : "text-[#32353D] border border-[rgba(255,255,255,0.06)]"
                    }`}
                  >
                    {String(step.step).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[11px] font-medium mb-0.5">
                      {step.title}
                    </p>
                    <p className="text-[10px] text-[#5B616E] leading-[1.6]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* SMHL example */}
          <motion.div
            {...fade(0.1)}
            className="col-span-7 p-6 relative font-mono"
          >
            <Coord value="05.01" />
            <Label>SMHL Example</Label>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[9px] text-[#32353D] uppercase tracking-[0.15em] mb-1">
                  {">"} challenge
                </p>
                <pre className="text-[10px] text-[#0052FF] leading-[1.7] bg-[#0052FF]/[0.03] border border-[#0052FF]/[0.06] p-3 overflow-x-auto">
                  {SMHL_EXAMPLE.challenge}
                </pre>
              </div>
              <div>
                <p className="text-[9px] text-[#32353D] uppercase tracking-[0.15em] mb-1">
                  {">"} solution
                </p>
                <pre className="text-[10px] text-[#66C800] leading-[1.7] bg-[#66C800]/[0.03] border border-[#66C800]/[0.06] p-3">
                  {SMHL_EXAMPLE.solution}
                </pre>
              </div>
              <p className="text-[9px] text-[#32353D] leading-[1.6]">
                // AI generates natural language satisfying all 6 constraints
                within 20s window
              </p>
            </div>
          </motion.div>
        </div>

        {/* LP ROW */}
        <div className="dashboard grid-cols-3 border-b border-[rgba(255,255,255,0.04)]">
          {LP_FEATURES.map((f, i) => (
            <motion.div key={f.title} {...fade(i * 0.05)} className="p-5 relative">
              <Coord value={`06.0${i}`} />
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-[#0052FF]"
                  style={{ boxShadow: "0 0 6px #0052FF" }}
                />
                <span className="text-[11px] font-mono font-medium uppercase tracking-[0.08em]">
                  {f.title}
                </span>
              </div>
              <p className="text-[10px] text-[#5B616E] leading-[1.7] mb-2">
                {f.desc}
              </p>
              <span className="text-[9px] font-mono text-[#0052FF]/60">
                {f.detail}
              </span>
            </motion.div>
          ))}
        </div>

        {/* NO RUG CALLOUT */}
        <motion.div
          {...fade()}
          className="border-b border-[rgba(255,255,255,0.04)] px-6 py-3 flex items-center justify-between"
        >
          <p className="text-[10px] font-mono text-[#32353D]">
            // no pre-mine. no team tokens. protocol-owned liquidity.
          </p>
          <div className="flex gap-3">
            {["Uniswap V3", "UNCX Lock", "Permanent"].map((tag) => (
              <span
                key={tag}
                className="text-[8px] font-mono text-[#5B616E] border border-[rgba(255,255,255,0.04)] px-1.5 py-0.5 uppercase tracking-[0.1em]"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* CTA ROW */}
        <motion.div
          id="get-started"
          {...fade()}
          className="border-b border-[rgba(255,255,255,0.04)] p-8 sm:p-12 relative"
        >
          <Coord value="07.00" />
          <div className="max-w-[480px]">
            <h2 className="text-[28px] font-bold tracking-[-0.03em] mb-2">
              Start Mining
            </h2>
            <p className="text-[12px] text-[#717886] leading-[1.7] mb-6">
              Mint an ERC-8004 Mining Rig. Put your AI agent to work. Earn
              $AGENT through proof of intelligence.
            </p>
            <div className="flex gap-2 mb-6">
              <a
                href={LINKS.mint}
                className="h-9 px-5 text-[11px] font-mono uppercase tracking-[0.08em] bg-[#0052FF] hover:bg-[#0047E0] text-white flex items-center transition-colors shadow-[0_0_24px_rgba(0,82,255,0.25)]"
              >
                Mint a Rig
              </a>
              <a
                href={LINKS.docs}
                className="h-9 px-5 text-[11px] font-mono uppercase tracking-[0.08em] border border-[rgba(255,255,255,0.08)] text-[#5B616E] hover:text-white hover:border-[rgba(255,255,255,0.15)] flex items-center transition-colors"
              >
                Read Docs
              </a>
            </div>
            <div className="flex gap-4">
              {["Docs", "GitHub", "Twitter", "Basescan"].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-[10px] font-mono text-[#32353D] hover:text-[#0052FF] uppercase tracking-[0.1em] transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* FOOTER */}
        <div className="px-5 h-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold tracking-[-0.01em] text-[#5B616E]">
              APoW
            </span>
            <span className="text-[10px] font-mono text-[#32353D]">
              Agentic Proof of Work
            </span>
          </div>
          <span className="text-[9px] font-mono text-[#0052FF]/40 border border-[#0052FF]/10 px-2 py-0.5 uppercase tracking-[0.1em]">
            Built on Base
          </span>
        </div>
      </div>
    </div>
  );
}
