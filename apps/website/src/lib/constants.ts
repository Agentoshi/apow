export const PROTOCOL = {
  name: "APoW",
  fullName: "Agentic Proof of Work",
  ticker: "$AGENT",
  chain: "Base",
  tokenStandard: "ERC-20",
  rigStandard: "ERC-8004",
  description:
    "Bitcoin, but for AI agents. AI-native mining protocol on Base combining ERC-8004 Trustless Agent Identities with the ERC-918 Mineable Token Standard. AI agents solve dual-proof challenges: a semantic SMHL puzzle plus cryptographic proof of work to mine $AGENT. 3 AGENT base reward, 10% decay per era. No GPUs. No ASICs. Just intelligence.",
} as const;

export const TOKENOMICS = {
  maxSupply: "21,000,000",
  maxSupplyRaw: 21_000_000,
  mineableSupply: "18,900,000",
  mineablePercent: 90,
  lpReserve: "2,100,000",
  lpReservePercent: 10,
  baseReward: 3,
  eraInterval: "500,000",
  rewardDecay: "10%",
} as const;

export const EMISSION_ERAS = [
  { era: 0, label: "Era 0", mineRange: "0 -500K", reward: "3.0", status: "active" },
  { era: 1, label: "Era 1", mineRange: "500K -1M", reward: "2.7", status: "upcoming" },
  { era: 2, label: "Era 2", mineRange: "1M -1.5M", reward: "2.43", status: "upcoming" },
  { era: 3, label: "Era 3", mineRange: "1.5M -2M", reward: "2.187", status: "upcoming" },
  { era: 4, label: "Era 4", mineRange: "2M -2.5M", reward: "1.968", status: "upcoming" },
  { era: 5, label: "Era 5", mineRange: "2.5M+", reward: "1.771", status: "upcoming" },
] as const;

export const RARITY_TIERS = [
  { name: "Common", multiplier: "1.0x", dropRate: "60%", color: "#5B616E" },
  { name: "Uncommon", multiplier: "1.5x", dropRate: "25%", color: "#66C800" },
  { name: "Rare", multiplier: "2.0x", dropRate: "10%", color: "#3C8AFF" },
  { name: "Epic", multiplier: "3.0x", dropRate: "4%", color: "#7575FF" },
  { name: "Mythic", multiplier: "5.0x", dropRate: "1%", color: "#FFD12F" },
] as const;

export const MINING_STEPS = [
  { step: 1, title: "Own a Rig", desc: "Mint an ERC-8004 Trustless Agent Identity with on-chain rarity." },
  { step: 2, title: "Solve SMHL", desc: "AI solves a 3-constraint semantic puzzle in 20s." },
  { step: 3, title: "Grind Hash", desc: "Find a nonce below the mining target." },
  { step: 4, title: "Submit", desc: "Both proofs verified on-chain in one tx." },
  { step: 5, title: "Repeat", desc: "Challenge rotates. Keep mining." },
] as const;

export const BONDING_CURVE = {
  maxPrice: "0.002",
  minPrice: "0.0002",
  maxSupply: "10,000",
  currency: "ETH",
} as const;

export const LP_FEATURES = [
  { title: "Auto-Deploy", detail: "5 ETH threshold", desc: "LP created automatically from mint fees." },
  { title: "Uniswap V3", detail: "0.3% fee tier", desc: "AGENT/USDC concentrated liquidity on Base." },
  { title: "Permanent Lock", detail: "UNCX locked", desc: "LP position locked forever." },
] as const;

export const LINKS = {
  docs: "https://docs.apow.io",
  github: "https://github.com/Agentoshi/APoW",
  twitter: "https://x.com/agenticpow",
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
