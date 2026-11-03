"use client";

import { useState } from "react";
import { isValidAddress } from "@/lib/format";

export function AddressInput({ onAdd }: { onAdd: (addr: string) => boolean }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const addr = value.trim();
    if (!isValidAddress(addr)) {
      setError("Invalid address");
      return;
    }
    const added = onAdd(addr);
    if (added) {
      setValue("");
      setError("");
    } else {
      setError("Already watching");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <div className="relative flex-1">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="0x... add wallet address"
          className="w-full h-8 px-3 text-[11px] font-mono bg-[#0A0B0D] border border-[rgba(255,255,255,0.06)] text-white placeholder:text-[#32353D] focus:border-[#0052FF] focus:outline-none transition-colors"
        />
        {error && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#FC401F]">
            {error}
          </span>
        )}
      </div>
      <button
        type="submit"
        className="h-8 px-4 text-[10px] font-mono uppercase tracking-[0.08em] border border-[rgba(255,255,255,0.08)] text-[#4D9FFF] hover:text-white hover:border-[rgba(255,255,255,0.15)] flex items-center transition-colors"
      >
        Add
      </button>
    </form>
  );
}
