"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { CrtOverlay } from "@/components/CrtOverlay";
import { ConnectButton } from "@/components/ConnectButton";
import { AddressInput } from "@/components/AddressInput";
import { NetworkStats } from "@/components/NetworkStats";
import { AggregateStats } from "@/components/AggregateStats";
import { WalletCard } from "@/components/WalletCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { VaultProgress } from "@/components/VaultProgress";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useNetworkStats } from "@/hooks/useNetworkStats";
import { useWalletData } from "@/hooks/useWalletData";
import { LINKS } from "@/lib/constants";

export default function Dashboard() {
  const { address: connectedAddress } = useAccount();
  const { addresses, add, remove, loaded } = useWatchlist();
  const { stats } = useNetworkStats();
  const { wallets, loading: walletsLoading } = useWalletData(addresses);

  // Auto-add connected wallet
  useEffect(() => {
    if (connectedAddress && loaded) {
      add(connectedAddress);
    }
  }, [connectedAddress, loaded, add]);

  return (
    <div className="crt-glow min-h-screen relative">
      <CrtOverlay />

      <div className="relative z-10">
        {/* NAV */}
        <div className="border-b border-[rgba(255,255,255,0.04)]">
          <nav className="max-w-[1400px] mx-auto px-4 h-11 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold tracking-[-0.02em]">
                APoW
              </span>
              <span className="text-[10px] font-mono text-[#4D9FFF]">
                DASHBOARD
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://apow.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-[#4D9FFF] hover:text-[#0052FF] uppercase tracking-[0.1em] transition-colors hidden sm:block"
              >
                Home
              </a>
              <a
                href={LINKS.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-[#4D9FFF] hover:text-[#0052FF] uppercase tracking-[0.1em] transition-colors hidden sm:block"
              >
                Docs
              </a>
              <a
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-[#4D9FFF] hover:text-[#0052FF] uppercase tracking-[0.1em] transition-colors hidden sm:block"
              >
                GitHub
              </a>
              <ConnectButton onConnect={(addr) => add(addr)} />
            </div>
          </nav>
        </div>

        {/* MAIN */}
        <div className="max-w-[1400px] mx-auto">
          {/* Network Stats */}
          <NetworkStats stats={stats} />

          {/* Vault Progress */}
          {stats && (
            <div className="border-b border-[rgba(255,255,255,0.04)]">
              <VaultProgress balance={stats.vaultBalance} />
            </div>
          )}

          {/* Address Input */}
          <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.04)]">
            <AddressInput onAdd={add} />
          </div>

          {/* Aggregate Stats */}
          {wallets.length > 0 && <AggregateStats wallets={wallets} />}

          {/* Wallet Cards */}
          {walletsLoading && addresses.length > 0 && wallets.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-[10px] font-mono text-[#32353D]">
                Loading wallet data...
              </div>
            </div>
          ) : wallets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-[rgba(255,255,255,0.04)] p-px">
              {wallets
                .slice()
                .sort((a, b) => Number(b.agentBalance) - Number(a.agentBalance))
                .map((w) => (
                  <WalletCard key={w.address} wallet={w} onRemove={remove} />
                ))}
            </div>
          ) : loaded ? (
            <div className="p-8 sm:p-12 text-center">
              <h2 className="text-[14px] font-semibold mb-3">
                No wallets added
              </h2>
              <p className="text-[11px] text-[#5B616E] max-w-[360px] mx-auto leading-relaxed">
                Connect your wallet or paste any address above to start monitoring mining activity.
                All data is read from the public Base blockchain.
              </p>
            </div>
          ) : null}

          {/* Activity Feed */}
          {addresses.length > 0 && (
            <div className="p-px mt-px">
              <ActivityFeed watchedAddresses={addresses} />
            </div>
          )}

          {/* Footer */}
          <div className="px-4 h-10 flex items-center justify-between border-t border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold tracking-[-0.01em] text-[#4D9FFF]">
                APoW
              </span>
              <span className="text-[9px] font-mono text-[#32353D]">
                Agentic Proof of Work
              </span>
            </div>
            <span className="text-[8px] font-mono text-[#4D9FFF] border border-[#4D9FFF]/20 px-2 py-0.5 uppercase tracking-[0.1em]">
              Built on Base
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
