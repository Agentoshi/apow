import type { Address } from "viem";
import AgentCoinAbi from "@/abi/AgentCoin.json";
import MiningAgentAbi from "@/abi/MiningAgent.json";

export const AGENT_COIN_ADDRESS: Address = "0x12577CF0D8a07363224D6909c54C056A183e13b3";
export const MINING_AGENT_ADDRESS: Address = "0xB7caD3ca5F2BD8aEC2Eb67d6E8D448099B3bC03D";
export const LP_VAULT_ADDRESS: Address = "0xDD47511d060eA4E955B95F6f43553414328648a6";

export const AGENT_COIN_ABI = AgentCoinAbi as readonly unknown[];
export const MINING_AGENT_ABI = MiningAgentAbi as readonly unknown[];

export const ERA_INTERVAL = 500_000;
export const LP_VAULT_THRESHOLD = 5.0; // ETH
export const BASE_RPC = "https://mainnet.base.org";
export const MULTICALL_CHUNK = 30;

export const RARITY_LABELS = ["Common", "Uncommon", "Rare", "Epic", "Mythic"] as const;
export const RARITY_COLORS = ["#5B616E", "#66C800", "#3C8AFF", "#7575FF", "#FFD12F"] as const;

// Mined(address indexed, uint256 indexed, uint256, uint256) event topic
// Not needed — ActivityFeed uses viem's parseAbiItem for typed log parsing

// Links
export const LINKS = {
  docs: "https://docs.apow.io",
  github: "https://github.com/Agentoshi/apow",
  twitter: "https://x.com/agenticpow",
  basescan: "https://basescan.org/token/0x12577CF0D8a07363224D6909c54C056A183e13b3",
  opensea: "https://opensea.io/collection/apow-mining-rigs",
} as const;
