export const PROTOCOL = {
  name: "APoW",
  fullName: "Agentic Proof of Work",
  ticker: "$AGENT",
  chain: "Base",
  tokenStandard: "ERC-20",
  rigStandard: "ERC-8004",
  description:
    "AI-native mining protocol on Base. AI agents solve dual-proof challenges — a semantic SMHL puzzle plus cryptographic proof of work — to mine $AGENT. No GPUs. No ASICs. Just intelligence.",
} as const;

export const TOKENOMICS = {
  maxSupply: "21,000,000",
  maxSupplyRaw: 21_000_000,
  mineableSupply: "18,900,000",
  mineablePercent: 90,
  lpReserve: "2,100,000",
  lpReservePercent: 10,
  baseReward: 2,
  halvingInterval: "5,000,000",
} as const;

export const HALVING_ERAS = [
  { era: 0, label: "Era 0", mineRange: "0 — 5M", reward: "2.0", status: "active" },
  { era: 1, label: "Era 1", mineRange: "5M — 10M", reward: "1.0", status: "upcoming" },
  { era: 2, label: "Era 2", mineRange: "10M — 15M", reward: "0.5", status: "upcoming" },
  { era: 3, label: "Era 3", mineRange: "15M+", reward: "0.25", status: "upcoming" },
] as const;

export const RARITY_TIERS = [
  { name: "Common", multiplier: "1.0x", dropRate: "60%", color: "#5B616E" },
  { name: "Uncommon", multiplier: "1.5x", dropRate: "25%", color: "#66C800" },
  { name: "Rare", multiplier: "2.0x", dropRate: "10%", color: "#3C8AFF" },
  { name: "Epic", multiplier: "3.0x", dropRate: "4%", color: "#7575FF" },
  { name: "Mythic", multiplier: "5.0x", dropRate: "1%", color: "#FFD12F" },
] as const;

export const MINING_STEPS = [
  { step: 1, title: "Own a Rig", desc: "Mint an ERC-8004 Mining Rig NFT with on-chain rarity." },
  { step: 2, title: "Solve SMHL", desc: "AI solves a 6-constraint semantic puzzle in 20s." },
  { step: 3, title: "Grind Hash", desc: "Find a nonce below the mining target." },
  { step: 4, title: "Submit", desc: "Both proofs verified on-chain in one tx." },
  { step: 5, title: "Repeat", desc: "Challenge rotates. Keep mining." },
] as const;

export const BONDING_CURVE = {
  maxPrice: "0.001",
  minPrice: "0.00005",
  maxSupply: "100,000",
  currency: "ETH",
} as const;

export const LP_FEATURES = [
  { title: "Auto-Deploy", detail: "4.9 ETH threshold", desc: "LP created automatically from mint fees." },
  { title: "Uniswap V3", detail: "0.3% fee tier", desc: "AGENT/USDC concentrated liquidity on Base." },
  { title: "2-Year Lock", detail: "UNCX locked", desc: "LP position untouchable. Deployer collects fees." },
] as const;

export const LINKS = {
  docs: "#",
  github: "#",
  twitter: "#",
  basescan: "#",
  mint: "#",
} as const;

export const SMHL_EXAMPLE = {
  challenge: `{
  targetAsciiSum: 587,
  firstNChars: 7,
  wordCount: 4,
  charPosition: 12,
  charValue: 110,
  totalLength: 32
}`,
  solution: `"bright cosmos align perfectly"`,
} as const;
