import OpenAI from "openai";
import type { Abi, Address, Hex } from "viem";
import { encodePacked, formatEther, hexToBytes, keccak256, parseEther } from "viem";

import agentCoinAbi from "./abi/AgentCoin.json";
import miningAgentAbi from "./abi/MiningAgent.json";
import { config, publicClient } from "./config";
import type { MinerSlot } from "./fleet";
import { Fleet } from "./fleet";

const coinAbi = agentCoinAbi as Abi;
const nftAbi = miningAgentAbi as Abi;

const MIN_GAS_BALANCE = parseEther("0.002"); // reject jobs if fleet wallet below this
const MAX_MINE_RETRIES = 3; // retries per mine on "one mine per block" reverts

// ── SMHL Solver ──

interface SmhlChallenge {
  targetAsciiSum: number;
  firstNChars: number;
  wordCount: number;
  charPosition: number;
  charValue: number;
  totalLength: number;
}

function normalizeSmhlChallenge(raw: unknown): SmhlChallenge {
  if (Array.isArray(raw)) {
    const [targetAsciiSum, firstNChars, wordCount, charPosition, charValue, totalLength] = raw;
    return {
      targetAsciiSum: Number(targetAsciiSum),
      firstNChars: Number(firstNChars),
      wordCount: Number(wordCount),
      charPosition: Number(charPosition),
      charValue: Number(charValue),
      totalLength: Number(totalLength),
    };
  }
  if (raw && typeof raw === "object") {
    const c = raw as Record<string, unknown>;
    return {
      targetAsciiSum: Number(c.targetAsciiSum),
      firstNChars: Number(c.firstNChars),
      wordCount: Number(c.wordCount),
      charPosition: Number(c.charPosition),
      charValue: Number(c.charValue),
      totalLength: Number(c.totalLength),
    };
  }
  throw new Error("Unable to normalize SMHL challenge");
}

function buildSmhlPrompt(challenge: SmhlChallenge, feedback?: string): string {
  const requiredChar = String.fromCharCode(challenge.charValue);
  const spaces = Math.max(0, challenge.wordCount - 1);
  const avgWordLen = Math.round((challenge.totalLength - spaces) / challenge.wordCount);
  const minWordLen = Math.max(2, avgWordLen - 2);
  const maxWordLen = avgWordLen + 2;

  const lines = [
    `Write exactly ${challenge.wordCount} lowercase English words separated by single spaces.`,
    `Each word should be ${minWordLen} to ${maxWordLen} letters long.`,
    `At least one word must contain the letter '${requiredChar}'.`,
    `No punctuation, no quotes, no explanation — just the words.`,
  ];

  if (feedback) {
    lines.push("", `Previous attempt was rejected: ${feedback}. Try completely different words.`);
  }

  return lines.join("\n");
}

function validateSmhlSolution(solution: string, challenge: SmhlChallenge): string[] {
  const issues: string[] = [];
  if (!solution) {
    issues.push("empty response");
    return issues;
  }

  const len = Buffer.byteLength(solution, "utf8");
  if (Math.abs(len - challenge.totalLength) > 4) {
    issues.push(`length ${len} not within ±4 of ${challenge.totalLength}`);
  }

  if (!/^[\x20-\x7E]+$/.test(solution)) {
    issues.push("solution must use printable ASCII only");
  }

  const requiredChar = String.fromCharCode(challenge.charValue);
  if (!solution.includes(requiredChar)) {
    issues.push(`missing required char '${requiredChar}'`);
  }

  const words = solution.split(" ").filter(Boolean);
  if (Math.abs(words.length - challenge.wordCount) > 2) {
    issues.push(`word count ${words.length} not within ±2 of ${challenge.wordCount}`);
  }

  return issues;
}

function adjustSolution(raw: string, challenge: SmhlChallenge): string {
  const requiredChar = String.fromCharCode(challenge.charValue);
  const minLen = challenge.totalLength - 4;
  const maxLen = challenge.totalLength + 4;
  const maxWords = challenge.wordCount + 2;

  let words = raw
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return raw;

  while (words.length > maxWords) {
    let removeIdx = -1;
    for (let i = words.length - 1; i >= 0; i--) {
      if (!words[i].includes(requiredChar)) {
        removeIdx = i;
        break;
      }
    }
    words.splice(removeIdx >= 0 ? removeIdx : words.length - 1, 1);
  }

  let result = words.join(" ");
  let len = Buffer.byteLength(result, "utf8");

  if (len > maxLen) {
    result = result.slice(0, maxLen);
    const lastSpace = result.lastIndexOf(" ");
    if (lastSpace >= minLen) result = result.slice(0, lastSpace);
    words = result.split(" ").filter(Boolean);
    len = Buffer.byteLength(result, "utf8");
  }

  const fillers = ["and", "the", "not", "can", "run", "now", "old", "new"];
  let fi = 0;
  while (len < minLen && words.length < maxWords) {
    words.push(fillers[fi % fillers.length]);
    result = words.join(" ");
    len = Buffer.byteLength(result, "utf8");
    fi++;
  }

  while (len < minLen && words.length > 0) {
    words[words.length - 1] += "s";
    result = words.join(" ");
    len = Buffer.byteLength(result, "utf8");
  }

  if (!result.includes(requiredChar)) {
    const last = words[words.length - 1];
    words[words.length - 1] = last.slice(0, -1) + requiredChar;
    result = words.join(" ");
  }

  return result;
}

function sanitizeResponse(text: string): string {
  let cleaned = text.replace(/\r/g, "").trim();
  const fenceMatch = cleaned.match(/^```(?:text)?\n([\s\S]*?)\n```$/);
  if (fenceMatch) cleaned = fenceMatch[1];
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned;
}

async function requestLlmSolution(prompt: string): Promise<string> {
  if (config.llmProvider === "gemini") {
    const model = config.llmModel || "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.llmApiKey}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(15_000),
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "You generate short lowercase word sequences that match exact constraints. Return only the words separated by spaces. Nothing else.",
              },
            ],
          },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  // OpenAI provider
  const client = new OpenAI({ apiKey: config.llmApiKey });
  const response = await client.chat.completions.create(
    {
      model: config.llmModel,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You generate short lowercase word sequences that match exact constraints. Return only the words separated by spaces. Nothing else.",
        },
        { role: "user", content: prompt },
      ],
    },
    { timeout: 15_000 },
  );

  return response.choices[0]?.message.content ?? "";
}

async function solveSmhlChallenge(challenge: SmhlChallenge): Promise<string> {
  let feedback: string | undefined;
  let lastIssues = "provider did not return a valid response";

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const prompt = buildSmhlPrompt(challenge, feedback);
      const raw = await requestLlmSolution(prompt);
      const sanitized = sanitizeResponse(raw);
      const adjusted = adjustSolution(sanitized, challenge);
      const issues = validateSmhlSolution(adjusted, challenge);

      if (issues.length === 0) return adjusted;

      feedback = issues.join(", ");
      lastIssues = `attempt ${attempt}: ${feedback}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      feedback = msg;
      lastIssues = `attempt ${attempt}: ${msg}`;
    }
  }

  throw new Error(`SMHL solve failed after 5 attempts: ${lastIssues}`);
}

// ── Nonce Grinder ──

function grindNonce(
  challengeNumber: `0x${string}`,
  target: bigint,
  minerAddress: `0x${string}`,
): { nonce: bigint; attempts: bigint; elapsed: number } {
  let nonce = 0n;
  let attempts = 0n;
  const start = process.hrtime();

  while (true) {
    const digest = BigInt(
      keccak256(
        encodePacked(["bytes32", "address", "uint256"], [challengeNumber, minerAddress, nonce]),
      ),
    );

    attempts += 1n;
    if (digest < target) {
      const [seconds, nanoseconds] = process.hrtime(start);
      const elapsed = seconds + nanoseconds / 1_000_000_000;
      return { nonce, attempts, elapsed };
    }

    nonce += 1n;
  }
}

// ── Pre-flight Checks ──

export async function isTransferUnlocked(): Promise<boolean> {
  return (await publicClient.readContract({
    address: config.agentCoinAddress,
    abi: coinAbi,
    functionName: "lpDeployed",
  })) as boolean;
}

export async function getSlotGasBalance(slot: MinerSlot): Promise<bigint> {
  return publicClient.getBalance({ address: slot.address });
}

export async function checkSlotReady(slot: MinerSlot): Promise<string | null> {
  const balance = await getSlotGasBalance(slot);
  if (balance < MIN_GAS_BALANCE) {
    return `Slot ${slot.index} gas too low: ${formatEther(balance)} ETH (need ${formatEther(MIN_GAS_BALANCE)})`;
  }
  return null;
}

async function waitForNextBlock(): Promise<void> {
  const lastMineBlock = (await publicClient.readContract({
    address: config.agentCoinAddress,
    abi: coinAbi,
    functionName: "lastMineBlockNumber",
  })) as bigint;

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const currentBlock = await publicClient.getBlockNumber();
    if (currentBlock > lastMineBlock) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Timed out waiting for next block (60s)");
}

// ── Mining Execution ──

export interface MineResult {
  txHashes: string[];
  transferTxHash: string;
  agentEarned: bigint;
  mineCount: number;
}

export async function executeMines(
  fleet: Fleet,
  slot: MinerSlot,
  count: number,
  buyerAddress: Address,
): Promise<MineResult> {
  const { account, client: walletClient } = fleet.createWalletClient(slot);
  const txHashes: string[] = [];

  if (slot.tokenId === null) {
    throw new Error(`Slot ${slot.index} has no rig`);
  }

  const tokenId = slot.tokenId;

  // Pre-flight: check gas balance
  const readyError = await checkSlotReady(slot);
  if (readyError) throw new Error(readyError);

  // Pre-flight: verify transfers are unlocked
  const unlocked = await isTransferUnlocked();
  if (!unlocked) {
    throw new Error("AGENT transfers are locked (LP not deployed yet)");
  }

  // Get initial earnings
  let earningsBefore = (await publicClient.readContract({
    address: config.agentCoinAddress,
    abi: coinAbi,
    functionName: "tokenEarnings",
    args: [tokenId],
  })) as bigint;

  for (let i = 0; i < count; i++) {
    let mined = false;

    for (let retry = 0; retry < MAX_MINE_RETRIES && !mined; retry++) {
      // Fetch mining challenge (re-fetch each retry — challenge may change)
      const miningChallenge = (await publicClient.readContract({
        address: config.agentCoinAddress,
        abi: coinAbi,
        functionName: "getMiningChallenge",
      })) as readonly [`0x${string}`, bigint, unknown];

      const [challengeNumber, target, rawSmhl] = miningChallenge;
      const smhl = normalizeSmhlChallenge(rawSmhl);

      // Solve SMHL
      console.log(`  [Slot ${slot.index}] Mine ${i + 1}/${count}: solving SMHL...`);
      const smhlSolution = await solveSmhlChallenge(smhl);

      // Grind nonce
      console.log(`  [Slot ${slot.index}] Mine ${i + 1}/${count}: grinding nonce...`);
      const { nonce, elapsed } = grindNonce(challengeNumber, target, account.address);
      console.log(`  [Slot ${slot.index}] Mine ${i + 1}/${count}: nonce found in ${elapsed.toFixed(1)}s`);

      // Submit mine transaction
      try {
        const txHash = await walletClient.writeContract({
          address: config.agentCoinAddress,
          abi: coinAbi,
          account,
          functionName: "mine",
          args: [nonce, smhlSolution, tokenId],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status === "reverted") {
          console.log(`  [Slot ${slot.index}] Mine ${i + 1}/${count}: reverted (block race), retrying...`);
          await waitForNextBlock();
          continue;
        }

        txHashes.push(txHash);
        mined = true;
        console.log(`  [Slot ${slot.index}] Mine ${i + 1}/${count}: confirmed ${txHash}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("One mine per block") || msg.includes("revert")) {
          console.log(`  [Slot ${slot.index}] Mine ${i + 1}/${count}: block race, waiting...`);
          await waitForNextBlock();
          continue;
        }
        throw err;
      }
    }

    if (!mined) {
      throw new Error(`Mine ${i + 1}/${count} failed after ${MAX_MINE_RETRIES} retries`);
    }

    // Wait for next block before next mine
    if (i < count - 1) {
      await waitForNextBlock();
    }
  }

  // Calculate earned AGENT
  let earningsAfter = earningsBefore;
  for (let retry = 0; retry < 5; retry++) {
    earningsAfter = (await publicClient.readContract({
      address: config.agentCoinAddress,
      abi: coinAbi,
      functionName: "tokenEarnings",
      args: [tokenId],
    })) as bigint;
    if (earningsAfter > earningsBefore) break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  const earned = earningsAfter - earningsBefore;
  console.log(
    `  [Slot ${slot.index}] Completed ${count} mines, earned ${formatEther(earned)} AGENT`,
  );

  // Transfer earned AGENT to buyer
  if (earned === 0n) {
    throw new Error("Mining completed but earned 0 AGENT — cannot deliver");
  }

  console.log(`  [Slot ${slot.index}] Transferring ${formatEther(earned)} AGENT to ${buyerAddress}...`);
  const transferTxHash = await walletClient.writeContract({
    address: config.agentCoinAddress,
    abi: coinAbi,
    account,
    functionName: "transfer",
    args: [buyerAddress, earned],
  });
  const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferTxHash });
  if (transferReceipt.status === "reverted") {
    throw new Error(`AGENT transfer to buyer reverted: ${transferTxHash}`);
  }
  console.log(`  [Slot ${slot.index}] AGENT transferred: ${transferTxHash}`);

  return { txHashes, transferTxHash, agentEarned: earned, mineCount: count };
}

// ── Minting Execution ──

export interface MintResult {
  tokenId: bigint;
  rarity: number;
  hashpower: number;
  txHash: string;
}

function deriveChallengeFromSeed(seed: Hex): SmhlChallenge {
  const bytes = hexToBytes(seed);
  const firstNChars = 5 + (bytes[0] % 6);
  const wordCount = 3 + (bytes[2] % 5);
  const totalLength = 20 + (bytes[5] % 31);
  const charPosition = bytes[3] % totalLength;
  const charValue = 97 + (bytes[4] % 26);

  let targetAsciiSum = 400 + bytes[1] * 3;
  let maxAsciiSum = firstNChars * 126;
  if (charPosition < firstNChars) {
    maxAsciiSum = maxAsciiSum - 126 + charValue;
  }
  if (targetAsciiSum > maxAsciiSum) {
    targetAsciiSum = 400 + ((targetAsciiSum - 400) % (maxAsciiSum - 399));
  }

  return normalizeSmhlChallenge([
    targetAsciiSum,
    firstNChars,
    wordCount,
    charPosition,
    charValue,
    totalLength,
  ]);
}

const ZERO_SEED = `0x${"0".repeat(64)}` as Hex;
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export async function executeMint(
  fleet: Fleet,
  slot: MinerSlot,
  recipientAddress: Address,
): Promise<MintResult> {
  const { account, client: walletClient } = fleet.createWalletClient(slot);

  // Verify slot has no rig (1-rig-per-wallet constraint)
  const existingBalance = (await publicClient.readContract({
    address: config.miningAgentAddress,
    abi: nftAbi,
    functionName: "balanceOf",
    args: [account.address],
  })) as bigint;

  if (existingBalance > 0n) {
    throw new Error(`Slot ${slot.index} already has a rig — cannot mint`);
  }

  // Get mint price
  const mintPrice = (await publicClient.readContract({
    address: config.miningAgentAddress,
    abi: nftAbi,
    functionName: "getMintPrice",
  })) as bigint;

  console.log(`  [Slot ${slot.index}] Mint price: ${formatEther(mintPrice)} ETH`);

  // Request challenge
  console.log(`  [Slot ${slot.index}] Requesting mint challenge...`);
  const challengeTx = await walletClient.writeContract({
    address: config.miningAgentAddress,
    abi: nftAbi,
    account,
    functionName: "getChallenge",
    args: [account.address],
  });
  const challengeReceipt = await publicClient.waitForTransactionReceipt({ hash: challengeTx });
  if (challengeReceipt.status === "reverted") {
    throw new Error("Challenge request reverted");
  }

  // Read challenge seed with retry
  let challengeSeed: Hex = ZERO_SEED;
  for (let retry = 0; retry < 5; retry++) {
    challengeSeed = (await publicClient.readContract({
      address: config.miningAgentAddress,
      abi: nftAbi,
      functionName: "challengeSeeds",
      args: [account.address],
    })) as Hex;
    if (challengeSeed.toLowerCase() !== ZERO_SEED.toLowerCase()) break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (challengeSeed.toLowerCase() === ZERO_SEED.toLowerCase()) {
    throw new Error("Challenge seed not found after retries");
  }

  // Solve SMHL
  const challenge = deriveChallengeFromSeed(challengeSeed);
  console.log(`  [Slot ${slot.index}] Solving SMHL for mint...`);
  const solution = await solveSmhlChallenge(challenge);

  // Mint
  console.log(`  [Slot ${slot.index}] Submitting mint tx...`);
  const mintTx = await walletClient.writeContract({
    address: config.miningAgentAddress,
    abi: nftAbi,
    account,
    functionName: "mint",
    args: [solution],
    value: mintPrice,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: mintTx });
  if (receipt.status === "reverted") {
    throw new Error("Mint transaction reverted");
  }

  // Parse token ID from Transfer event
  const mintLog = receipt.logs.find(
    (log) =>
      log.address.toLowerCase() === config.miningAgentAddress.toLowerCase() &&
      log.topics[0] === TRANSFER_TOPIC &&
      log.topics[1] === "0x0000000000000000000000000000000000000000000000000000000000000000",
  );
  if (!mintLog || !mintLog.topics[3]) {
    throw new Error("Mint confirmed but Transfer event not found in logs");
  }
  const tokenId = BigInt(mintLog.topics[3]);

  // Get rig stats
  const [rarityRaw, hashpowerRaw] = await Promise.all([
    publicClient.readContract({
      address: config.miningAgentAddress,
      abi: nftAbi,
      functionName: "rarity",
      args: [tokenId],
    }) as Promise<bigint>,
    publicClient.readContract({
      address: config.miningAgentAddress,
      abi: nftAbi,
      functionName: "hashpower",
      args: [tokenId],
    }) as Promise<bigint>,
  ]);
  const rarity = Number(rarityRaw);
  const hashpower = Number(hashpowerRaw);

  const rarityLabels = ["Common", "Uncommon", "Rare", "Epic", "Mythic"];
  console.log(
    `  [Slot ${slot.index}] Minted rig #${tokenId} — ${rarityLabels[rarity] ?? `Tier ${rarity}`} (${(hashpower / 100).toFixed(2)}x)`,
  );

  // Transfer NFT to buyer
  console.log(`  [Slot ${slot.index}] Transferring rig #${tokenId} to ${recipientAddress}...`);
  const transferTx = await walletClient.writeContract({
    address: config.miningAgentAddress,
    abi: nftAbi,
    account,
    functionName: "safeTransferFrom",
    args: [account.address, recipientAddress, tokenId],
  });
  const transferReceipt = await publicClient.waitForTransactionReceipt({ hash: transferTx });
  if (transferReceipt.status === "reverted") {
    throw new Error("NFT transfer reverted");
  }

  console.log(`  [Slot ${slot.index}] Rig #${tokenId} transferred to ${recipientAddress}`);

  // Slot is now rig-free again (available for next mint job)
  slot.tokenId = null;

  return { tokenId, rarity, hashpower, txHash: mintTx };
}
