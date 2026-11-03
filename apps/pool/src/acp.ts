import AcpClient, {
  AcpContractClientV2,
  type AcpJob,
  AcpJobPhases,
  type AcpMemo,
} from "@virtuals-protocol/acp-node";
import { formatEther, isAddress } from "viem";

import { config } from "./config";
import { Fleet } from "./fleet";
import { checkSlotReady, executeMines, executeMint, isTransferUnlocked } from "./worker";

const MINE_AGENT_FEE_PER_MINE = 0.10; // USDC per mine

export async function startAcpSeller(fleet: Fleet): Promise<void> {
  const contractClient = await AcpContractClientV2.build(
    config.acpPrivateKey,
    config.acpEntityId,
    config.acpWalletAddress,
  );

  const acpClient = new AcpClient({
    acpContractClient: contractClient,

    onNewTask: async (job: AcpJob, memoToSign?: AcpMemo) => {
      try {
        await handleJob(job, memoToSign, fleet);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[ACP] Job ${job.id} error: ${msg}`);
        try {
          await job.reject(`Internal error: ${msg}`);
        } catch {
          // Best-effort rejection
        }
      }
    },
  });

  await acpClient.init();
  console.log("ACP seller agent running — listening for jobs...");
}

async function handleJob(
  job: AcpJob,
  memoToSign: AcpMemo | undefined,
  fleet: Fleet,
): Promise<void> {
  // Phase 1: New job request — accept or reject
  if (
    job.phase === AcpJobPhases.REQUEST &&
    memoToSign?.nextPhase === AcpJobPhases.NEGOTIATION
  ) {
    const offering = job.name;
    console.log(`[ACP] New job request #${job.id}: ${offering}`);

    if (offering === "mine_agent") {
      await handleMineRequest(job, fleet);
    } else if (offering === "mint_rig") {
      await handleMintRequest(job, fleet);
    } else {
      await job.reject(`Unknown offering: ${offering}`);
    }
    return;
  }

  // Phase 3: Buyer has paid — execute the job
  if (
    job.phase === AcpJobPhases.TRANSACTION &&
    memoToSign?.nextPhase === AcpJobPhases.EVALUATION
  ) {
    const offering = job.name;
    console.log(`[ACP] Payment received for job #${job.id}: ${offering}`);

    if (offering === "mine_agent") {
      await handleMineExecution(job, fleet);
    } else if (offering === "mint_rig") {
      await handleMintExecution(job, fleet);
    } else {
      await job.reject(`Unknown offering for execution: ${offering}`);
    }
    return;
  }
}

// ── mine_agent handlers ──

async function handleMineRequest(job: AcpJob, fleet: Fleet): Promise<void> {
  const requirement = job.requirement as Record<string, unknown> | undefined;
  const mineCount = Number(requirement?.mineCount ?? 0);

  if (!Number.isInteger(mineCount) || mineCount < 1 || mineCount > 100) {
    await job.reject("mineCount must be an integer between 1 and 100");
    return;
  }

  // Gate: AGENT transfers must be unlocked (LP deployed)
  const unlocked = await isTransferUnlocked();
  if (!unlocked) {
    await job.reject(
      "AGENT transfers are currently locked (pre-LP). Mining-as-a-service will be available once LP is deployed and transfers are unlocked. Try mint_rig instead — NFT minting is available now.",
    );
    return;
  }

  const idleMiner = fleet.getIdleMiner();
  if (!idleMiner) {
    await job.reject("No idle mining rigs available — try again later");
    return;
  }

  // Check gas balance
  const readyError = await checkSlotReady(idleMiner);
  if (readyError) {
    await job.reject("Pool fleet temporarily unavailable (low gas) — try again later");
    return;
  }

  const totalFee = (mineCount * MINE_AGENT_FEE_PER_MINE).toFixed(2);
  await job.accept(`Mining ${mineCount} times for ${totalFee} USDC`);
  await job.createRequirement(
    `Mining job accepted. ${mineCount} mines at ${MINE_AGENT_FEE_PER_MINE} USDC each = ${totalFee} USDC. AGENT tokens will be transferred to your wallet immediately after mining. Please pay to proceed.`,
  );
}

async function handleMineExecution(job: AcpJob, fleet: Fleet): Promise<void> {
  const requirement = job.requirement as Record<string, unknown> | undefined;
  const mineCount = Number(requirement?.mineCount ?? 1);
  const buyerAddress = job.clientAddress;

  // Double-check transfers are still unlocked
  const unlocked = await isTransferUnlocked();
  if (!unlocked) {
    await job.reject("AGENT transfers became locked — cannot deliver. Payment will be refunded by ACP.");
    return;
  }

  const slot = fleet.getIdleMiner();
  if (!slot) {
    await job.reject("No idle mining rigs available for execution");
    return;
  }

  slot.status = "mining";
  fleet.assignJob(slot, String(job.id));

  try {
    const result = await executeMines(fleet, slot, mineCount, buyerAddress);

    const proof = {
      type: "json" as const,
      value: {
        service: "mine_agent",
        mineCount: result.mineCount,
        agentEarned: formatEther(result.agentEarned),
        agentTransferTx: result.transferTxHash,
        mineTxHashes: result.txHashes,
        recipient: buyerAddress,
        basescanLinks: {
          transfer: `https://basescan.org/tx/${result.transferTxHash}`,
          mines: result.txHashes.map((h) => `https://basescan.org/tx/${h}`),
        },
      },
    };

    await job.deliver(proof);
    console.log(
      `[ACP] Job #${job.id} delivered: ${result.mineCount} mines, ${formatEther(result.agentEarned)} AGENT transferred to ${buyerAddress}`,
    );
  } finally {
    fleet.releaseSlot(slot);
  }
}

// ── mint_rig handlers ──

async function handleMintRequest(job: AcpJob, fleet: Fleet): Promise<void> {
  const requirement = job.requirement as Record<string, unknown> | undefined;
  const recipientAddress = requirement?.recipientAddress as string | undefined;

  if (!recipientAddress || !isAddress(recipientAddress)) {
    await job.reject("recipientAddress must be a valid Base wallet address");
    return;
  }

  const idleMinter = fleet.getIdleMinter();
  if (!idleMinter) {
    await job.reject("No minting slots available — all fleet wallets have rigs");
    return;
  }

  // Check gas balance
  const readyError = await checkSlotReady(idleMinter);
  if (readyError) {
    await job.reject("Pool fleet temporarily unavailable (low gas) — try again later");
    return;
  }

  await job.accept("Minting slot available");
  await job.createRequirement(
    "Mint job accepted. The NFT will be minted and transferred to your specified address. Please pay to proceed.",
  );
}

async function handleMintExecution(job: AcpJob, fleet: Fleet): Promise<void> {
  const requirement = job.requirement as Record<string, unknown> | undefined;
  const recipientAddress = requirement?.recipientAddress as string;

  if (!isAddress(recipientAddress)) {
    await job.reject("Invalid recipient address");
    return;
  }

  const slot = fleet.getIdleMinter();
  if (!slot) {
    await job.reject("No minting slots available for execution");
    return;
  }

  slot.status = "minting";
  fleet.assignJob(slot, String(job.id));

  try {
    const result = await executeMint(fleet, slot, recipientAddress);

    const rarityLabels = ["Common", "Uncommon", "Rare", "Epic", "Mythic"];
    const proof = {
      type: "json" as const,
      value: {
        service: "mint_rig",
        tokenId: result.tokenId.toString(),
        rarity: rarityLabels[result.rarity] ?? `Tier ${result.rarity}`,
        hashpower: `${(result.hashpower / 100).toFixed(2)}x`,
        recipient: recipientAddress,
        txHash: result.txHash,
        basescanLink: `https://basescan.org/tx/${result.txHash}`,
        nftLink: `https://basescan.org/nft/${config.miningAgentAddress}/${result.tokenId}`,
      },
    };

    await job.deliver(proof);
    console.log(
      `[ACP] Job #${job.id} delivered: rig #${result.tokenId} minted and transferred to ${recipientAddress}`,
    );
  } finally {
    fleet.releaseSlot(slot);
  }
}
