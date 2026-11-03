"use client";

import { useState, useEffect, useCallback } from "react";
import { isValidAddress } from "@/lib/format";

const STORAGE_KEY = "apow-watchlist";

export function useWatchlist() {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        setAddresses(parsed.filter(isValidAddress));
      }
    } catch {
      // ignore invalid localStorage
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((addrs: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addrs));
  }, []);

  const add = useCallback((addr: string) => {
    const normalized = addr.trim();
    if (!isValidAddress(normalized)) return false;
    setAddresses((prev) => {
      const lower = normalized.toLowerCase();
      if (prev.some((a) => a.toLowerCase() === lower)) return prev;
      const next = [...prev, normalized];
      persist(next);
      return next;
    });
    return true;
  }, [persist]);

  const remove = useCallback((addr: string) => {
    setAddresses((prev) => {
      const lower = addr.toLowerCase();
      const next = prev.filter((a) => a.toLowerCase() !== lower);
      persist(next);
      return next;
    });
  }, [persist]);

  return { addresses, add, remove, loaded };
}
