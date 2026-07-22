export function shortAddr(addr: string): string {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export function fmt(n: number, decimals = 1): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function fmtFixed(n: number, decimals: number): string {
  return n.toFixed(decimals);
}

export function fmtEth(n: number): string {
  if (n < 0.0001 && n > 0) return n.toPrecision(2);
  return n.toFixed(4);
}

export function parseArtFromTokenUri(raw: string): string {
  if (!raw?.startsWith("data:application/json;base64,")) return "";
  try {
    const json = JSON.parse(atob(raw.slice(29)));
    return json.image ?? "";
  } catch {
    return "";
  }
}

export function isValidAddress(s: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(s);
}
