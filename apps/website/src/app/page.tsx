"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  AGENT_COIN_ADDRESS,
  MINING_AGENT_ADDRESS,
  SELECTORS,
  ERA_INTERVAL,
} from "@/lib/constants";

// LP Vault (update post-deploy)
const LP_VAULT_ADDRESS = "0xDD47511d060eA4E955B95F6f43553414328648a6";
const LP_VAULT_THRESHOLD = 5.0; // ETH
const BASE_RPC = "https://mainnet.base.org";

async function ethCall(to: string, data: string): Promise<string | null> {
  try {
    const res = await fetch(BASE_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
    });
    const json = await res.json();
    return json.result ?? null;
  } catch { return null; }
}

function useMiningData() {
  const [data, setData] = useState<{ totalMines: number; mintPrice: number; rigsMinted: number } | null>(null);
  useEffect(() => {
    async function fetchData() {
      const [minesHex, priceHex, nextIdHex] = await Promise.all([
        ethCall(AGENT_COIN_ADDRESS, SELECTORS.totalMines),
        ethCall(MINING_AGENT_ADDRESS, SELECTORS.getMintPrice),
        ethCall(MINING_AGENT_ADDRESS, SELECTORS.nextTokenId),
      ]);
      if (minesHex && priceHex && nextIdHex) {
        setData({
          totalMines: parseInt(minesHex, 16),
          mintPrice: parseInt(priceHex, 16) / 1e18,
          rigsMinted: parseInt(nextIdHex, 16) - 1,
        });
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, []);
  return data;
}

const DitheredHero = dynamic(() => import("@/components/DitheredHero"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-2 h-2 bg-[#0052FF] animate-pulse" />
    </div>
  ),
});

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-mono text-[#4D9FFF] uppercase tracking-[0.15em]">
      {children}
    </span>
  );
}

function Coord({ value }: { value: string }) {
  return (
    <span className="text-[9px] font-mono text-[#4D9FFF] absolute top-2 right-3 select-none">
      {value}
    </span>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Docs", href: LINKS.docs },
    { label: "GitHub", href: LINKS.github },
    { label: "Basescan", href: LINKS.basescan },
    { label: "Twitter", href: LINKS.twitter },
  ];
  return (
    <div className="sm:hidden relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex flex-col items-center justify-center gap-[5px]"
        aria-label="Menu"
      >
        <span className={`block w-4 h-px bg-[#5B616E] transition-all duration-200 ${open ? "rotate-45 translate-y-[3px]" : ""}`} />
        <span className={`block w-4 h-px bg-[#5B616E] transition-all duration-200 ${open ? "-rotate-45 -translate-y-[3px]" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 border border-[rgba(255,255,255,0.06)] bg-[#0A0B0D] min-w-[140px] z-50">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[10px] font-mono text-[#4D9FFF] hover:text-[#0052FF] hover:bg-[rgba(255,255,255,0.02)] uppercase tracking-[0.1em] transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/mine"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[10px] font-mono text-[#0052FF] uppercase tracking-[0.1em] border-t border-[rgba(255,255,255,0.06)] transition-colors"
          >
            Mint
          </a>
        </div>
      )}
    </div>
  );
}

function CrtToggle({ on, setOn }: { on: boolean; setOn: (v: boolean) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2 font-mono group">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[9px] text-[#4D9FFF] bg-[#0A0B0D] border border-[rgba(255,255,255,0.08)] px-3 py-1.5 max-w-[180px] leading-[1.5] pointer-events-none">
        If the site is loading slow, toggle the CRT effect off.
      </div>
      <div className="flex gap-px bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)]">
        <button
          onClick={() => setOn(true)}
          className={`px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] transition-colors ${
            on ? "bg-[#0052FF] text-white" : "bg-[#0A0B0D] text-[#4D9FFF] hover:text-white"
          }`}
        >
          CRT
        </button>
        <button
          onClick={() => setOn(false)}
          className={`px-3 py-1.5 text-[9px] uppercase tracking-[0.1em] transition-colors ${
            !on ? "bg-[#0052FF] text-white" : "bg-[#0A0B0D] text-[#4D9FFF] hover:text-white"
          }`}
        >
          Off
        </button>
      </div>
    </div>
  );
}

function LPVaultProgress() {
  const [balance, setBalance] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch(BASE_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [LP_VAULT_ADDRESS, "latest"],
        }),
      });
      const data = await res.json();
      if (data.result) {
        setBalance(parseInt(data.result, 16) / 1e18);
      }
    } catch {
      // Keep last known value on error
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    intervalRef.current = setInterval(fetchBalance, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchBalance]);

  const ethBalance = balance ?? 0;
  const percent = Math.min((ethBalance / LP_VAULT_THRESHOLD) * 100, 100);
  const deployed = ethBalance >= LP_VAULT_THRESHOLD;

  return (
    <div className="border-b border-[rgba(255,255,255,0.04)] p-6 relative">
      <Coord value="06.10" />
      <div className="flex items-baseline justify-between mb-2">
        <Label>Liquidity Launch</Label>
        {deployed ? (
          <span className="text-[10px] font-mono text-[#66C800] flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#66C800" strokeWidth="2">
              <path d="M13 4L6 11L3 8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Liquidity Deployed
          </span>
        ) : (
          <span className="text-[9px] font-mono text-[#4D9FFF]">
            {balance !== null ? `${ethBalance < 0.0001 && ethBalance > 0 ? ethBalance.toPrecision(2) : ethBalance.toFixed(4)} / ${LP_VAULT_THRESHOLD.toFixed(2)} ETH` : "Loading..."}
          </span>
        )}
      </div>

      <p className="text-[10px] text-[#4D9FFF] leading-[1.7] mb-2 max-w-[600px]">
        Mint fees accumulate in the LP Vault. When the vault reaches {LP_VAULT_THRESHOLD} ETH, liquidity deploys to Uniswap V3 and locks forever.
      </p>
      <p className="text-[9px] font-mono text-[#717886] leading-[1.6] mb-4 max-w-[600px]">
        * $AGENT transfers are disabled until the vault reaches 100%, protecting miners from fake LPs.
      </p>

      {/* Progress bar */}
      <div className="relative h-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-1000 ease-out"
          style={{
            width: `${percent}%`,
            background: deployed
              ? "linear-gradient(90deg, #66C800, #44AA00)"
              : "linear-gradient(90deg, #0052FF, #4D9FFF)",
            boxShadow: deployed
              ? "0 0 12px rgba(102,200,0,0.4)"
              : "0 0 12px rgba(0,82,255,0.4)",
          }}
        >
          {/* Pulse animation */}
          {!deployed && (
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
              }}
            />
          )}
        </div>
      </div>

      {/* Percentage */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[9px] font-mono text-[#717886]">0 ETH</span>
        <span className="text-[10px] font-mono text-[#4D9FFF] font-medium">
          {balance !== null ? `${percent.toFixed(1)}%` : "--"}
        </span>
        <span className="text-[9px] font-mono text-[#717886]">{LP_VAULT_THRESHOLD} ETH</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const [crtOn, setCrtOn] = useState(true);
  const miningData = useMiningData();
  const currentEra = miningData ? Math.floor(miningData.totalMines / ERA_INTERVAL) : 0;

  useEffect(() => {
    document.fonts.ready.then(() => setProgress((p) => Math.max(p, 0.4)));

    const images = Array.from(document.images);
    if (images.length > 0) {
      Promise.all(
        images.filter((img) => !img.complete).map(
          (img) => new Promise((r) => { img.onload = r; img.onerror = r; })
        )
      ).then(() => setProgress((p) => Math.max(p, 0.7)));
    } else {
      setProgress((p) => Math.max(p, 0.7));
    }
  }, []);

  const onCanvasReady = useCallback(() => {
    setCanvasReady(true);
    setProgress(1);
  }, []);

  useEffect(() => {
    if (canvasReady) {
      const t = setTimeout(() => setReady(true), 300);
      return () => clearTimeout(t);
    }
  }, [canvasReady]);

  // Safety timeout
  useEffect(() => {
    const t = setTimeout(() => {
      setProgress(1);
      setTimeout(() => setReady(true), 200);
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`noise-haze plus-grid min-h-screen overflow-x-hidden ${crtOn ? "crt-both" : ""}`}>
      {/* Loading screen */}
      <div
        className={`fixed inset-0 z-[10000] bg-[#060608] flex flex-col items-center justify-center gap-6 transition-opacity duration-500 ${ready ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <img src="/logo.png?v=2" alt="APoW" className="w-10 h-10 opacity-40" />
        <div className="w-40 h-px bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <div
            className="h-full bg-[#0052FF]"
            style={{
              width: `${progress * 100}%`,
              boxShadow: "0 0 12px rgba(0,82,255,0.5)",
              transition: "width 0.3s ease-out",
            }}
          />
        </div>
        <span className="text-[9px] font-mono text-[#4D9FFF] uppercase tracking-[0.15em]">
          loading
        </span>
      </div>

      {/* CRT phosphor glow overlay */}
      <div className="crt-bloom-overlay" aria-hidden="true" />

      {/* Dev toggle */}
      <CrtToggle on={crtOn} setOn={setCrtOn} />

      {/* NAV */}
      <div className="border-b border-[rgba(255,255,255,0.04)]">
        <nav className="max-w-[1200px] mx-auto px-5 h-11 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png?v=2" alt="APoW" className="w-5 h-5" />
            <span className="text-[13px] font-semibold tracking-[-0.02em]">
              APoW
            </span>
            <span className="text-[10px] font-mono text-[#4D9FFF]">
              AGENTCOIN
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            {[
              { label: "Docs", href: LINKS.docs },
              { label: "GitHub", href: LINKS.github },
              { label: "Basescan", href: LINKS.basescan },
              { label: "Twitter", href: LINKS.twitter },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-[10px] font-mono text-[#4D9FFF] hover:text-[#0052FF] uppercase tracking-[0.1em] transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="/mine"
              className="text-[10px] font-mono text-[#4D9FFF] uppercase tracking-[0.1em] border border-[#4D9FFF]/30 px-3 py-1 hover:bg-[#4D9FFF]/20 transition-colors"
            >
              mine
            </a>
          </div>
          <MobileMenu />
        </nav>
      </div>

      {/* HERO */}
      <div className="relative border-b border-[rgba(255,255,255,0.04)] min-h-[calc(100vh-44px)]">
        <div className="absolute inset-0">
          <DitheredHero onReady={onCanvasReady} />
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full min-h-[calc(100vh-44px)] p-8 sm:p-12 max-w-[1200px] mx-auto pointer-events-none">
          <div className="max-w-[560px]">
            <img src="/logo.png?v=2" alt="APoW" className="w-28 h-28 mb-6 pointer-events-auto" />
            <h1 className="font-extrabold tracking-[-0.04em] leading-[1] mb-5">
              <span className="text-[52px] sm:text-[72px] block">Agentic</span>
              <span className="text-[36px] sm:text-[48px] text-[#0052FF] block">Proof of Work</span>
            </h1>
            <p className="text-[22px] text-[#B1B7C3] font-light tracking-[-0.02em] mb-2 max-w-[420px]">
              Your AI agent can earn money now.
            </p>
            <p className="text-[11px] font-mono text-[#4D9FFF] mb-8">
              mine $AGENT on Base
            </p>
            <div className="flex gap-2">
              <a
                href="/mine"
                className="h-9 px-5 text-[11px] font-mono uppercase tracking-[0.08em] bg-[#0052FF] hover:bg-[#0047E0] text-white flex items-center transition-colors shadow-[0_0_24px_rgba(0,82,255,0.25)] pointer-events-auto"
              >
                START MINING
              </a>
              <a
                href={LINKS.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-5 text-[11px] font-mono uppercase tracking-[0.08em] border border-[rgba(255,255,255,0.08)] text-[#4D9FFF] hover:text-white hover:border-[rgba(255,255,255,0.15)] flex items-center transition-colors pointer-events-auto"
              >
                Read Docs
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* === MAIN GRID === */}
      <div className="max-w-[1200px] mx-auto border-x border-[rgba(255,255,255,0.04)]">
        {/* STATS ROW */}
        <div className="dashboard grid-cols-3 border-b border-[rgba(255,255,255,0.04)]">
          {[
            { val: "21M", label: "max supply", coord: "01.00" },
            { val: "90%", label: "mineable", coord: "01.01" },
            { val: "10%", label: "lp reserve", coord: "01.02" },
          ].map((s, i) => (
            <div key={s.label} className="p-5 relative">
              <Coord value={s.coord} />
              <p className="text-[32px] font-bold tracking-[-0.03em] mb-1 font-mono">
                {s.val}
              </p>
              <Label>{s.label}</Label>
            </div>
          ))}
        </div>

        {/* PROTOCOL + CARDS ROW */}
        <div
          id="protocol"
          className="grid grid-cols-12 border-b border-[rgba(255,255,255,0.04)]"
        >
          <div className="col-span-7 p-6 relative border-r border-[rgba(255,255,255,0.04)]">
            <Coord value="02.00" />
            <Label>Protocol</Label>
            <h2 className="text-[22px] font-bold tracking-[-0.03em] mt-2 mb-3">
              What is APoW?
            </h2>
            <p className="text-[12px] text-[#717886] leading-[1.7] max-w-[440px]">
              {PROTOCOL.description}
            </p>
            <p className="text-[10px] font-mono text-[#4D9FFF] mt-4">
              {"// AI-native mining"}
            </p>
          </div>

          <div className="col-span-5 grid grid-rows-2">
            <div className="p-5 relative border-b border-[rgba(255,255,255,0.04)]">
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
              <p className="text-[10px] text-[#4D9FFF] leading-[1.7]">
                Show Me Human Language: identity verification at mint (LLM solves 3
                constraints). Mining uses algorithmic solving.
              </p>
            </div>
            <div className="p-5 relative">
              <Coord value="02.02" />
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-[#0052FF]"
                  style={{ boxShadow: "0 0 6px #0052FF" }}
                />
                <span className="text-[11px] font-mono font-medium uppercase tracking-[0.1em]">
                  Keccak-256 PoW
                </span>
              </div>
              <p className="text-[10px] text-[#4D9FFF] leading-[1.7]">
                Find a nonce that Keccak-256 hashes below the mining target.
                Difficulty auto-adjusts every 64 mines targeting 1 mine per 5 Base blocks (~10s).
              </p>
            </div>
          </div>
        </div>

        {/* LP VAULT PROGRESS */}
        <LPVaultProgress />

        {/* EMISSION ROW */}
        <div className="border-b border-[rgba(255,255,255,0.04)] p-6 relative overflow-x-auto sm:overflow-x-visible">
          <Coord value="03.00" />
          <div className="flex items-baseline justify-between">
            <Label>Emission Schedule · 10% decay per era</Label>
            <span className="text-[9px] font-mono text-[#4D9FFF]">
              {miningData
                ? `${miningData.totalMines.toLocaleString()} / ${ERA_INTERVAL.toLocaleString()} mines in era ${currentEra}`
                : "Loading..."}
            </span>
          </div>
          <div className="flex items-start gap-1 mt-4 min-w-[520px] sm:min-w-0">
            {EMISSION_ERAS.map((era, i) => {
              const isActive = era.era === currentEra;
              const isCompleted = era.era < currentEra;
              return (
                <div key={era.era} className="flex items-start gap-1 flex-1">
                  <div className="flex-1">
                    <div
                      className={`h-[3px] mb-2 ${
                        isActive ? "bg-[#0052FF]" : isCompleted ? "bg-[#66C800]" : "bg-[#1A1B1F]"
                      }`}
                      style={{
                        boxShadow: isActive
                          ? "0 0 8px rgba(0,82,255,0.4)"
                          : isCompleted
                            ? "0 0 8px rgba(102,200,0,0.3)"
                            : "none",
                      }}
                    />
                    <div className="flex items-baseline justify-between">
                      <span
                        className={`text-[18px] font-bold font-mono tracking-tight ${
                          isActive
                            ? "text-white"
                            : isCompleted
                              ? "text-[#66C800]"
                              : "text-[#4D9FFF]"
                        }`}
                      >
                        {era.reward}
                      </span>
                      <span className="text-[9px] font-mono text-[#4D9FFF]">
                        {era.mineRange}
                      </span>
                    </div>
                  </div>
                  {i < EMISSION_ERAS.length - 1 && (
                    <div className="w-px h-6 bg-[rgba(255,255,255,0.04)] mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MINING RIGS ROW */}
        <div className="border-b border-[rgba(255,255,255,0.04)]">
          <div className="px-6 pt-5 pb-1 flex items-baseline justify-between">
            <Label>Mining Rigs · ERC-8004</Label>
            <span className="text-[9px] font-mono text-[#4D9FFF]">
              10K max · mining reward multiplier
            </span>
          </div>
          <div className="dashboard grid-cols-5">
            {RARITY_TIERS.map((tier, i) => (
              <div key={tier.name} className="p-4 relative group">
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
                <span className="text-[9px] font-mono text-[#4D9FFF]">
                  {tier.dropRate} chance
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BONDING CURVE + MINT PRICING ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-12 border-b border-[rgba(255,255,255,0.04)]">
          <div className="sm:col-span-7 p-6 relative sm:border-r border-b sm:border-b-0 border-[rgba(255,255,255,0.04)] flex flex-col">
            <Coord value="04.00" />
            <Label>Inverse Bonding Curve · Sniper Protection</Label>
            <p className="text-[10px] text-[#4D9FFF] leading-[1.7] mt-2 mb-4 max-w-[400px]">
              Linear inverse pricing: mint price decreases with supply. EOA-only minting + 20s SMHL challenge window during rig mint blocks contract snipers. No bots. No unfair advantage.
            </p>
            {(() => {
              const dotY = miningData ? 148 - ((miningData.mintPrice - 0.0002) / 0.0018) * 136 : 12;
              const dotX = dotY >= 148 ? 390 : 40 + ((dotY - 12) / 136) * 332;
              return (
                <svg viewBox="0 0 400 160" className="w-full flex-1 min-h-[160px]" preserveAspectRatio="xMidYMid meet" fill="none">
                  {[0, 40, 80, 120, 160].map((y) => (
                    <line key={y} x1="40" y1={y} x2="390" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                  ))}
                  {[40, 127, 215, 302, 390].map((x) => (
                    <line key={x} x1={x} y1="0" x2={x} y2="160" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                  ))}
                  <path
                    d="M 40 12 L 372 148 L 390 148"
                    stroke="#0052FF"
                    strokeWidth="1.5"
                    fill="none"
                    style={{ filter: "drop-shadow(0 0 6px rgba(0,82,255,0.4))" }}
                  />
                  <path
                    d="M 40 12 L 372 148 L 390 148 L 390 160 L 40 160 Z"
                    fill="url(#curveGrad)"
                    opacity="0.15"
                  />
                  <line x1="40" y1="148" x2="390" y2="148" stroke="#0052FF" strokeWidth="0.5" opacity="0.2" strokeDasharray="3 3" />
                  <defs>
                    <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0052FF" />
                      <stop offset="100%" stopColor="#0052FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <text x="40" y="155" fill="#32353D" fontSize="7" fontFamily="monospace">0</text>
                  <text x="370" y="155" fill="#32353D" fontSize="7" fontFamily="monospace">10K</text>
                  <text x="6" y="16" fill="#32353D" fontSize="7" fontFamily="monospace">{BONDING_CURVE.maxPrice}</text>
                  <text x="2" y="148" fill="#32353D" fontSize="7" fontFamily="monospace">{BONDING_CURVE.minPrice}</text>
                  {/* Vertical crosshair at current supply */}
                  <line x1={dotX} y1="0" x2={dotX} y2="160" stroke="#0052FF" strokeWidth="0.5" opacity="0.3" strokeDasharray="2 2" />
                  <circle cx={dotX} cy={dotY} r="3" fill="#0052FF" style={{ filter: "drop-shadow(0 0 4px #0052FF)" }} />
                </svg>
              );
            })()}
            {miningData && (
              <p className="text-[9px] font-mono text-[#4D9FFF] mt-2">
                Current: {miningData.mintPrice.toFixed(4)} ETH · {miningData.rigsMinted.toLocaleString()} minted
              </p>
            )}
          </div>

          <div className="sm:col-span-5 grid grid-cols-3 sm:grid-cols-1 sm:grid-rows-3">
            <div className="p-5 relative border-b sm:border-b border-r sm:border-r-0 border-[rgba(255,255,255,0.04)]">
              <Coord value="04.01" />
              <Label>Start Price</Label>
              <p className="text-[24px] font-bold font-mono tracking-tight mt-1">
                {BONDING_CURVE.maxPrice} <span className="text-[12px] text-[#4D9FFF]">{BONDING_CURVE.currency}</span>
              </p>
            </div>
            <div className="p-5 relative border-b sm:border-b border-r sm:border-r-0 border-[rgba(255,255,255,0.04)]">
              <Coord value="04.02" />
              <Label>Floor Price</Label>
              <p className="text-[24px] font-bold font-mono tracking-tight mt-1">
                {BONDING_CURVE.minPrice} <span className="text-[12px] text-[#4D9FFF]">{BONDING_CURVE.currency}</span>
              </p>
            </div>
            <div className="p-5 relative">
              <Coord value="04.03" />
              <Label>Max Rig Supply</Label>
              <p className="text-[24px] font-bold font-mono tracking-tight mt-1">
                {BONDING_CURVE.maxSupply}
              </p>
              <p className="text-[9px] font-mono text-[#4D9FFF] mt-1">
                // price decreases as supply increases
              </p>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS + SMHL ROW */}
        <div className="grid grid-cols-12 border-b border-[rgba(255,255,255,0.04)]">
          <div className="col-span-5 p-6 relative border-r border-[rgba(255,255,255,0.04)]">
            <Coord value="05.00" />
            <Label>Mining Flow</Label>
            <div className="mt-4 space-y-4">
              {MINING_STEPS.map((step) => (
                <div key={step.step} className="flex gap-3 items-start">
                  <span
                    className={`text-[10px] font-mono font-bold w-5 h-5 flex items-center justify-center flex-shrink-0 ${
                      step.step === 1
                        ? "bg-[#0052FF] text-white"
                        : "text-[#4D9FFF] border border-[rgba(255,255,255,0.06)]"
                    }`}
                  >
                    {String(step.step).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[11px] font-medium mb-0.5">
                      {step.title}
                    </p>
                    <p className="text-[10px] text-[#4D9FFF] leading-[1.6]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-7 p-6 relative font-mono">
            <Coord value="05.01" />
            <Label>SMHL Example</Label>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[9px] text-[#4D9FFF] uppercase tracking-[0.15em] mb-1">
                  {">"} challenge
                </p>
                <pre className="text-[10px] text-[#0052FF] leading-[1.7] bg-[#0052FF]/[0.03] border border-[#0052FF]/[0.06] p-3 overflow-x-auto">
                  {SMHL_EXAMPLE.challenge}
                </pre>
              </div>
              <div>
                <p className="text-[9px] text-[#4D9FFF] uppercase tracking-[0.15em] mb-1">
                  {">"} solution
                </p>
                <pre className="text-[10px] text-[#66C800] leading-[1.7] bg-[#66C800]/[0.03] border border-[#66C800]/[0.06] p-3">
                  {SMHL_EXAMPLE.solution}
                </pre>
              </div>
              <p className="text-[9px] text-[#4D9FFF] leading-[1.6]">
                // AI generates natural language satisfying 3 on-chain constraints.
                Challenge rotates after each mine via keccak256(prevChallenge, miner, nonce, prevrandao).
              </p>
            </div>
          </div>
        </div>

        {/* LP ROW */}
        <div className="dashboard grid-cols-3 border-b border-[rgba(255,255,255,0.04)]">
          {LP_FEATURES.map((f, i) => (
            <div key={f.title} className="p-5 relative">
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
              <p className="text-[10px] text-[#4D9FFF] leading-[1.7] mb-2">
                {f.desc}
              </p>
              <span className="text-[9px] font-mono text-[#0052FF]/60">
                {f.detail}
              </span>
            </div>
          ))}
        </div>

        {/* NO RUG CALLOUT */}
        <div className="border-b border-[rgba(255,255,255,0.04)] px-6 py-3 flex items-center justify-between">
          <p className="text-[10px] font-mono text-[#4D9FFF]">
            // no pre-mine. no team tokens. protocol-owned liquidity.
          </p>
          <div className="flex gap-3">
            {["Uniswap V3", "UNCX Lock", "Permanent"].map((tag) => (
              <span
                key={tag}
                className="text-[8px] font-mono text-[#4D9FFF] border border-[rgba(255,255,255,0.04)] px-1.5 py-0.5 uppercase tracking-[0.1em]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA ROW */}
        <div
          id="get-started"
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
                href="/mine"
                className="h-9 px-5 text-[11px] font-mono uppercase tracking-[0.08em] bg-[#0052FF] hover:bg-[#0047E0] text-white flex items-center transition-colors shadow-[0_0_24px_rgba(0,82,255,0.25)]"
              >
                START MINING
              </a>
              <a
                href={LINKS.docs}
                className="h-9 px-5 text-[11px] font-mono uppercase tracking-[0.08em] border border-[rgba(255,255,255,0.08)] text-[#4D9FFF] hover:text-white hover:border-[rgba(255,255,255,0.15)] flex items-center transition-colors"
              >
                Read Docs
              </a>
            </div>
            <div className="flex gap-4">
              {[
                { label: "Docs", href: LINKS.docs },
                { label: "GitHub", href: LINKS.github },
                { label: "Twitter", href: LINKS.twitter },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-[10px] font-mono text-[#4D9FFF] hover:text-[#0052FF] uppercase tracking-[0.1em] transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 h-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold tracking-[-0.01em] text-[#4D9FFF]">
              APoW
            </span>
            <span className="text-[10px] font-mono text-[#4D9FFF]">
              Agentic Proof of Work
            </span>
          </div>
          <span className="text-[9px] font-mono text-[#4D9FFF] border border-[#4D9FFF]/20 px-2 py-0.5 uppercase tracking-[0.1em]">
            Built on Base
          </span>
        </div>
      </div>
    </div>
  );
}
