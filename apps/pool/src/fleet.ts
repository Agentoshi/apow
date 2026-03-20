import type { Abi, Address, Hex } from "viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

import miningAgentAbi from "./abi/MiningAgent.json";
import { config, publicClient } from "./config";

const nftAbi = miningAgentAbi as Abi;

export interface MinerSlot {
  index: number;
  address: Address;
  privateKey: Hex;
  tokenId: bigint | null;
  status: "idle" | "mining" | "minting";
  currentJobId?: string;
}

export class Fleet {
  slots: MinerSlot[] = [];

  async initialize(): Promise<void> {
    for (let i = 0; i < config.fleetKeys.length; i++) {
      const account = privateKeyToAccount(config.fleetKeys[i]);

      // Detect owned rig
      let tokenId: bigint | null = null;
      const balance = (await publicClient.readContract({
        address: config.miningAgentAddress,
        abi: nftAbi,
        functionName: "balanceOf",
        args: [account.address],
      })) as bigint;

      if (balance > 0n) {
        tokenId = (await publicClient.readContract({
          address: config.miningAgentAddress,
          abi: nftAbi,
          functionName: "tokenOfOwnerByIndex",
          args: [account.address, 0n],
        })) as bigint;
      }

      this.slots.push({
        index: i,
        address: account.address,
        privateKey: config.fleetKeys[i],
        tokenId,
        status: "idle",
      });
    }

    const withRig = this.slots.filter((s) => s.tokenId !== null).length;
    const withoutRig = this.slots.filter((s) => s.tokenId === null).length;
    console.log(
      `Fleet initialized: ${this.slots.length} wallets (${withRig} with rigs, ${withoutRig} available for minting)`,
    );
  }

  getIdleMiner(): MinerSlot | null {
    return this.slots.find((s) => s.status === "idle" && s.tokenId !== null) ?? null;
  }

  getIdleMinter(): MinerSlot | null {
    return this.slots.find((s) => s.status === "idle" && s.tokenId === null) ?? null;
  }

  assignJob(slot: MinerSlot, jobId: string): void {
    slot.currentJobId = jobId;
  }

  releaseSlot(slot: MinerSlot): void {
    slot.status = "idle";
    slot.currentJobId = undefined;
  }

  createWalletClient(slot: MinerSlot) {
    const account = privateKeyToAccount(slot.privateKey);
    return {
      account,
      client: createWalletClient({
        account,
        chain: base,
        transport: http(config.rpcUrl),
      }),
    };
  }
}
