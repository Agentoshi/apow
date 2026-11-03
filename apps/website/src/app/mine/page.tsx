"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const DitheredHero = dynamic(() => import("@/components/DitheredHero"), {
  ssr: false,
});

const ASSISTANTS = [
  { name: "Choose your assistant", anchor: "" },
  { name: "Grok Bot", anchor: "grok-bot" },
  { name: "Muse", anchor: "muse" },
  { name: "Instinct", anchor: "instinct" },
  { name: "Wajo / Fo", anchor: "wajo-fo" },
  { name: "OpenClaw", anchor: "openclaw" },
  { name: "Hermes", anchor: "hermes" },
  { name: "Claude Code", anchor: "claude-code" },
  { name: "Codex", anchor: "codex" },
  { name: "Manus", anchor: "manus" },
  { name: "Claude Cowork", anchor: "claude-cowork" },
  { name: "Perplexity Computer", anchor: "perplexity-computer-personal-computer" },
];

export default function MinePage() {
  const [copied, setCopied] = useState(false);
  const [assistantIndex, setAssistantIndex] = useState(0);
  const assistant = ASSISTANTS[assistantIndex];
  const guide = `https://apow.io/docs/technical/assistants${assistant.anchor ? `#${assistant.anchor}` : ""}`;
  const miningInstructions = `Read https://apow.io/skill.md and ${guide}${assistant.anchor ? ` for ${assistant.name}` : ""}. Use Easy Mode to mine AGENT with remote GPU grinding. Check secure wallet recovery and your runner's persistence before funding. Give me one Base ETH deposit quote; convert the service budget to USDC automatically and keep the same wallet across retries. Use my approved budget, never rent a VPS or enable local CPU fallback by default, and report the first confirmed mining transaction. If this runtime cannot persist or unlock securely, explain that limit before asking for funds.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(miningInstructions);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-screen min-h-screen py-8 flex items-center justify-center bg-[oklch(0.09_0.005_270)] overflow-x-hidden relative">
      {/* Three.js background */}
      <div className="absolute inset-0">
        <DitheredHero />
      </div>

      {/* CRT scanlines */}
      <div
        className="pointer-events-none absolute inset-0 z-50"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15),
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          )`,
          backgroundSize: "100% 2px",
        }}
      />

      {/* Glow effect */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "80%",
          height: "80%",
          background: "radial-gradient(ellipse at center, rgba(0,82,255,0.35) 0%, rgba(0,82,255,0.15) 40%, rgba(0,82,255,0.05) 60%, transparent 80%)",
          filter: "blur(80px)",
          zIndex: 0,
        }}
      />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[800px] mx-4">
        <div className="relative border border-[rgba(255,255,255,0.08)] bg-[rgba(10,11,13,0.10)] backdrop-blur-xl shadow-2xl">
          {/* Top border highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 50%, transparent)",
            }}
          />

          {/* Card content */}
          <div className="p-5 sm:p-12">
            <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
              <img src="/logo.png?v=2" alt="APoW" className="w-10 h-10 sm:w-12 sm:h-12" />
              <div>
                <h1 className="text-[20px] sm:text-[24px] font-bold tracking-[-0.03em] leading-none mb-1">
                  Start Mining
                </h1>
                <p className="text-[9px] sm:text-[10px] font-mono text-[#4D9FFF] uppercase tracking-[0.15em]">
                  Agent Instructions
                </p>
              </div>
            </div>

            {/* Compatibility note */}
            <p className="text-[9px] sm:text-[10px] text-[#717886] mb-3 sm:mb-4 text-center leading-[1.6]">
              Select your assistant for its setup instructions. A supported runner and secure wallet unlock are required.{" "}
              <a
                href="https://clawhub.ai/Agentoshi/apow-mining"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4D9FFF] hover:text-[#0052FF] transition-colors underline"
              >
                View source on ClawHub
              </a>
              .
            </p>

            <label htmlFor="mining-assistant" className="block text-[10px] font-mono text-[#B1B7C3] mb-2">Your assistant</label>
            <select
              id="mining-assistant"
              value={assistantIndex}
              onChange={(event) => { setAssistantIndex(Number(event.target.value)); setCopied(false); }}
              className="w-full border border-[rgba(255,255,255,0.12)] bg-[#0a0b0d] p-3 mb-4 text-[12px] text-[#B1B7C3]"
            >
              {ASSISTANTS.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}
            </select>

            {/* Code field */}
            <div className="relative">
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 sm:p-2 bg-[rgba(0,82,255,0.1)] hover:bg-[rgba(0,82,255,0.2)] text-[#4D9FFF] border border-[rgba(77,159,255,0.2)] transition-colors"
                  title={copied ? "Copied!" : "Copy to clipboard"}
                >
                  {copied ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 4L6 11L3 8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="5" y="5" width="9" height="9" rx="1" />
                      <path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>

              <pre className="bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.06)] p-4 sm:p-6 pr-12 text-[11px] sm:text-[12px] leading-[1.7] font-mono text-[#B1B7C3] whitespace-pre-wrap break-all">
                <code>{miningInstructions}</code>
              </pre>
            </div>

            {/* Security warning */}
            <p className="text-[9px] font-mono text-[#B1B7C3] mt-3 leading-[1.7]">
              The ETH-only CLI update awaits npm publication. Your agent must stop if the guide’s pinned version is unavailable.
            </p>
            <p className="text-[8px] sm:text-[9px] font-mono text-[#717886] mt-2 sm:mt-3 leading-[1.7] max-w-[680px] mx-auto">
              Deposit Base ETH once. Keep an encrypted wallet backup and its password separately. Never send wallet secrets in chat. Fully managed mining is in development.
            </p>
            <a href={guide} className="inline-block mt-3 text-[10px] text-[#4D9FFF] underline">Read assistant guide</a>

          </div>
        </div>
      </div>
    </div>
  );
}
