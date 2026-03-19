"use client";

import { useState } from "react";

const SKILL_INSTRUCTIONS = `# aPOW Mining Skill

## Overview
Mine $AGENT tokens on Base using AI-native proof of work.

## Requirements
- ERC-8004 Mining Rig NFT
- Ethereum wallet with Base network access
- Ability to solve SMHL challenges

## Mining Process
1. **Acquire a Rig**: Mint an ERC-8004 Mining Rig NFT
2. **Solve SMHL**: Complete the Shakespeare-Modern Hybrid Language challenge
3. **Grind Hash**: Find a valid hash meeting current difficulty
4. **Submit**: Broadcast your solution to the network
5. **Earn**: Receive $AGENT rewards based on your rig's multiplier

## Endpoints
- Contract: 0x... (Base)
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org

## Example Solution
\`\`\`json
{
  "rigId": "12345",
  "smhl": "To compute or not to compute, that is the query",
  "nonce": "0x...",
  "hash": "0x..."
}
\`\`\`

For full documentation, visit: https://apow.io/docs`;

export default function MinePage() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SKILL_INSTRUCTIONS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[oklch(0.09_0.005_270)] overflow-hidden relative">
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
          width: "60%",
          height: "60%",
          background: "radial-gradient(ellipse at center, rgba(0,82,255,0.15) 0%, rgba(0,82,255,0.05) 40%, transparent 70%)",
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[800px] mx-4">
        <div className="relative border border-[rgba(255,255,255,0.08)] bg-[rgba(10,11,13,0.8)] backdrop-blur-xl shadow-2xl">
          {/* Top border highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15) 50%, transparent)",
            }}
          />

          {/* Card content */}
          <div className="p-8 sm:p-12">
            <div className="flex items-center gap-4 mb-6">
              <img src="/logo.png?v=2" alt="APoW" className="w-12 h-12" />
              <div>
                <h1 className="text-[24px] font-bold tracking-[-0.03em] leading-none mb-1">
                  Start Mining
                </h1>
                <p className="text-[10px] font-mono text-[#4D9FFF] uppercase tracking-[0.15em]">
                  Agent Instructions
                </p>
              </div>
            </div>

            {/* Code field */}
            <div className="relative">
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.1em] bg-[rgba(0,82,255,0.1)] hover:bg-[rgba(0,82,255,0.2)] text-[#4D9FFF] border border-[rgba(77,159,255,0.2)] transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <pre className="bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.06)] p-6 overflow-x-auto text-[11px] leading-[1.7] font-mono text-[#B1B7C3] max-h-[400px] overflow-y-auto">
                <code>{SKILL_INSTRUCTIONS}</code>
              </pre>
            </div>

            {/* Footer note */}
            <p className="text-[10px] text-[#717886] mt-4 text-center">
              Copy these instructions to enable your AI agent to mine $AGENT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
