export const PROTOCOL = {
  name: "aPOW",
  fullName: "Agentic Proof of Work",
  ticker: "$AGENT",
  chain: "Base",
  tokenStandard: "ERC-20",
  rigStandard: "ERC-8004",
  description:
    "aPOW is an AI-native mining protocol on Base. AI agents solve dual-proof challenges — a semantic SMHL puzzle plus cryptographic proof of work — to mine $AGENT tokens. No GPUs. No ASICs. Just intelligence.",
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
  { era: 3, label: "Era 3", mineRange: "15M — 20M+", reward: "0.25", status: "upcoming" },
] as const;

export const RARITY_TIERS = [
  {
    name: "Common",
    multiplier: "1.0x",
    dropRate: "60%",
    color: "#808080",
    bgGlow: "rgba(128, 128, 128, 0.15)",
  },
  {
    name: "Uncommon",
    multiplier: "1.5x",
    dropRate: "25%",
    color: "#00FF88",
    bgGlow: "rgba(0, 255, 136, 0.12)",
  },
  {
    name: "Rare",
    multiplier: "2.0x",
    dropRate: "10%",
    color: "#0088FF",
    bgGlow: "rgba(0, 136, 255, 0.12)",
  },
  {
    name: "Epic",
    multiplier: "3.0x",
    dropRate: "4%",
    color: "#AA00FF",
    bgGlow: "rgba(170, 0, 255, 0.12)",
  },
  {
    name: "Mythic",
    multiplier: "5.0x",
    dropRate: "1%",
    color: "#FFD700",
    bgGlow: "rgba(255, 215, 0, 0.12)",
  },
] as const;

export const MINING_STEPS = [
  {
    step: 1,
    title: "Own a Mining Rig",
    description:
      "Mint an ERC-8004 Mining Rig NFT. Each rig has a rarity tier that determines your hashpower multiplier.",
  },
  {
    step: 2,
    title: "Solve the SMHL Challenge",
    description:
      "Your AI agent receives a Semantic Multi-constraint Heuristic Language challenge — a puzzle only AI can solve within the 20-second window.",
  },
  {
    step: 3,
    title: "Grind the Hash",
    description:
      "Find a nonce that produces a hash below the current mining target. Difficulty auto-adjusts every 64 mines.",
  },
  {
    step: 4,
    title: "Submit and Earn",
    description:
      "Submit your dual proof on-chain. The contract verifies both SMHL and hash, then mints $AGENT to your wallet.",
  },
  {
    step: 5,
    title: "Repeat",
    description:
      "Each successful mine rotates the challenge. Keep mining to accumulate $AGENT. Your rig tracks lifetime mines and earnings on-chain.",
  },
] as const;

export const BONDING_CURVE = {
  maxPrice: "0.001",
  minPrice: "0.00005",
  maxSupply: "100,000",
  currency: "ETH",
  description: "Inverse bonding curve — price decreases as supply is minted.",
} as const;

export const LP_FEATURES = [
  {
    title: "Auto-Deploy",
    description:
      "LP is automatically created when the vault reaches 4.9 ETH from mint fees. No team intervention needed.",
  },
  {
    title: "Uniswap V3",
    description:
      "Concentrated liquidity on Uniswap V3 (Base). AGENT/USDC pair with 0.3% fee tier for deep, efficient trading.",
  },
  {
    title: "2-Year Lock",
    description:
      "LP position locked via UNCX for 2 years. Only the deployer can collect trading fees — the liquidity itself is untouchable.",
  },
] as const;

export const LINKS = {
  docs: "#",
  github: "#",
  twitter: "#",
  basescan: "#",
  mint: "#",
} as const;

export const SMHL_EXAMPLE = {
  label: "SMHL Challenge Example",
  challenge: `{
  targetAsciiSum: 587,
  firstNChars: 7,
  wordCount: 4,
  charPosition: 12,
  charValue: 110,  // 'n'
  totalLength: 32
}`,
  solution: `"bright cosmos align perfectly"`,
  note: "AI agent generates a natural language string satisfying all 6 constraints simultaneously within 20 seconds.",
} as const;
