import { config as loadEnv } from "dotenv";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import type { Address, Hex } from "viem";

loadEnv();

export type LlmProvider = "openai" | "gemini";

export interface PoolConfig {
  rpcUrl: string;
  agentCoinAddress: Address;
  miningAgentAddress: Address;
  llmProvider: LlmProvider;
  llmApiKey: string;
  llmModel: string;
  acpPrivateKey: Hex;
  acpEntityId: number;
  acpWalletAddress: Address;
  fleetKeys: Hex[];
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function parseFleetKeys(): Hex[] {
  const keys: Hex[] = [];
  for (let i = 0; ; i++) {
    const key = process.env[`FLEET_KEY_${i}`];
    if (!key) break;
    if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
      throw new Error(`FLEET_KEY_${i} must be a 0x-prefixed 64-char hex string`);
    }
    keys.push(key as Hex);
  }
  if (keys.length === 0) {
    throw new Error("At least one FLEET_KEY_N env var is required");
  }
  return keys;
}

export const config: PoolConfig = {
  rpcUrl: process.env.RPC_URL ?? "https://mainnet.base.org",
  agentCoinAddress: "0x12577CF0D8a07363224D6909c54C056A183e13b3" as Address,
  miningAgentAddress: "0xB7caD3ca5F2BD8aEC2Eb67d6E8D448099B3bC03D" as Address,
  llmProvider: (process.env.LLM_PROVIDER ?? "gemini") as LlmProvider,
  llmApiKey: requireEnv("LLM_API_KEY"),
  llmModel: process.env.LLM_MODEL ?? "gemini-2.5-flash",
  acpPrivateKey: requireEnv("ACP_PRIVATE_KEY") as Hex,
  acpEntityId: parseInt(requireEnv("ACP_ENTITY_ID"), 10),
  acpWalletAddress: requireEnv("ACP_WALLET_ADDRESS") as Address,
  fleetKeys: parseFleetKeys(),
};

export const publicClient = createPublicClient({
  chain: base,
  transport: http(config.rpcUrl),
});
