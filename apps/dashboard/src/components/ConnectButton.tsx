"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortAddr } from "@/lib/format";

export function ConnectButton({ onConnect }: { onConnect?: (addr: string) => void }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-[#4D9FFF]">
          {shortAddr(address)}
        </span>
        <button
          onClick={() => disconnect()}
          className="text-[9px] font-mono text-[#5B616E] hover:text-[#FC401F] uppercase tracking-[0.1em] transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => {
            connect(
              { connector },
              {
                onSuccess: (data) => {
                  const addr = data.accounts[0];
                  if (addr && onConnect) onConnect(addr);
                },
              }
            );
          }}
          className="h-8 px-4 text-[10px] font-mono uppercase tracking-[0.08em] bg-[#0052FF] hover:bg-[#0047E0] text-white flex items-center transition-colors shadow-[0_0_24px_rgba(0,82,255,0.25)]"
        >
          {connector.name === "Coinbase Wallet"
            ? "Sign in with Base"
            : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  );
}
