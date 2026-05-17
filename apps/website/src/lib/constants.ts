export const PROTOCOL = {
  name: "APoW",
  fullName: "Agentic Proof of Work",
  ticker: "$AGENT",
  chain: "Base",
  tokenStandard: "ERC-20",
  rigStandard: "ERC-721",
  description:
    "Bitcoin, but for AI agents. AI-native mining protocol on Base combining ERC-721 Mining Rig NFTs with the ERC-918 Mineable Token Standard. Minting uses an LLM-solved SMHL challenge as the strongest proof-of-agent gate; every mine still submits lightweight SMHL plus hash proof. 3 AGENT base reward (up to 15 with Mythic rig), 10% decay per era.",
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
  { name: "Common", multiplier: "1.0x", dropRate: "60%", color: "#5B616E", era0Reward: "3" },
  { name: "Uncommon", multiplier: "1.5x", dropRate: "25%", color: "#66C800", era0Reward: "4.5" },
  { name: "Rare", multiplier: "2.0x", dropRate: "10%", color: "#3C8AFF", era0Reward: "6" },
  { name: "Epic", multiplier: "3.0x", dropRate: "4%", color: "#7575FF", era0Reward: "9" },
  { name: "Mythic", multiplier: "5.0x", dropRate: "1%", color: "#FFD12F", era0Reward: "15" },
] as const;

export const MINING_STEPS = [
  { step: 1, title: "Own a Rig", desc: "Mint an ERC-721 Mining Rig from the bonding curve or buy one on secondary. Minting uses an LLM SMHL gate, and your rig's rarity determines your reward multiplier." },
  { step: 2, title: "Get Challenge", desc: "Call getMiningChallenge() to get challengeNumber, miningTarget, and SMHL format parameters." },
  { step: 3, title: "Solve SMHL", desc: "Generate the required SMHL format solution algorithmically (sub-millisecond). No LLM call needed for mining, but the SMHL proof is still submitted and verified on-chain." },
  { step: 4, title: "Grind Hash", desc: "Multi-threaded search for a nonce that Keccak-256 hashes below the mining target. This is the competitive part." },
  { step: 5, title: "Submit", desc: "Call mine(nonce, smhlSolution, tokenId). Both proofs are verified on-chain. One mine per block, EOA only." },
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
  docs: "/docs",
  github: "https://github.com/Agentoshi/apow-cli",
  twitter: "https://x.com/agenticpow",
  basescan: "https://basescan.org/token/0x12577CF0D8a07363224D6909c54C056A183e13b3",
} as const;

export const SMHL_EXAMPLE = {
  challenge: `{
  totalLength: 32,       // ±5 tolerance
  wordCount: 4,          // ±2 tolerance
  charValue: 110,        // exact match (lowercase a-z)
  // derived but not verified on-chain:
  targetAsciiSum: 587,
  firstNChars: 7,
  charPosition: 12
}`,
  // Minting: LLM solves this as the agent gate
  // Mining: solved algorithmically in microseconds
  solution: `"bright cosmos align perfectly"`,
} as const;

export const AGENT_COIN_ADDRESS = "0x12577CF0D8a07363224D6909c54C056A183e13b3";
export const MINING_AGENT_ADDRESS = "0xB7caD3ca5F2BD8aEC2Eb67d6E8D448099B3bC03D";
export const SELECTORS = {
  totalMines: "0x13ef395c",
  getMintPrice: "0xa7f93ebd",
  nextTokenId: "0x75794a3c",
} as const;
export const ERA_INTERVAL = 500_000;
