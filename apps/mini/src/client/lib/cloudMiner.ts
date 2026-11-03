import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeFunctionData,
  formatEther,
  formatUnits,
  hexToBytes,
  parseEther,
  parseUnits,
  type Account,
  type Address,
  type Hex,
} from "viem";
import { base } from "viem/chains";
import { mnemonicToAccount } from "viem/accounts";
import { agentCoinAbi, miningAgentAbi, swapRouterAbi } from "../../shared/contractAbis";
import {
  BUILDER_DATA_SUFFIX,
  CONTRACTS,
  DEFAULT_DERIVATION_PATH,
  erc20Abi,
  MIN_STARTUP_USDC,
  SWAP_SLIPPAGE_BPS,
  UNISWAP_V3_ETH_USDC_FEE_TIER,
} from "../../shared/constants";
import { api } from "./api";

const ZERO_SEED = `0x${"0".repeat(64)}` as Hex;
const MINT_GAS_RESERVE_WEI = 3_000_000_000_000_000n;
const MINE_GAS_RESERVE_WEI = 200_000_000_000_000n;
const STARTUP_USDC_UNITS = parseUnits(MIN_STARTUP_USDC, 6);
const AUTO_SPLIT_BUFFER = 1.03;

export interface OwnedRig {
  tokenId: bigint;
  rarity: number;
  rarityLabel: string;
  hashpower: number;
}

export interface WalletBalances {
  eth: bigint;
  usdc: bigint;
}

export type MinerLogLevel = "info" | "success" | "warning" | "error";

export interface CloudMinerEvent {
  level: MinerLogLevel;
  message: string;
  txHash?: Hex;
}

export interface CloudMinerSnapshot {
  address: Address;
  balances: WalletBalances;
  rigs: OwnedRig[];
  activeRig: OwnedRig | null;
  mintPrice: bigint;
}

export interface CloudMinerSessionInput {
  mnemonic: string;
  expectedAddress: Address;
  onEvent?: (event: CloudMinerEvent) => void;
}

export interface CloudMinerSession {
  account: Account;
  refresh(): Promise<CloudMinerSnapshot>;
  mintRig(): Promise<OwnedRig>;
  mineOnce(): Promise<Hex>;
  run(signal: AbortSignal): Promise<void>;
}

interface SmhlChallenge {
  targetAsciiSum: number;
  firstNChars: number;
  wordCount: number;
  charPosition: number;
  charValue: number;
  totalLength: number;
}

type MiningChallenge = readonly [Hex, bigint, unknown];

const rarityLabels = ["Common", "Uncommon", "Rare", "Epic", "Mythic"] as const;

function rpcTransport() {
  let id = 1;
  return custom({
    async request({ method, params }) {
      const response = await fetch("/api/rpc", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: id++,
          method,
          params: params ?? [],
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        result?: unknown;
        error?: { message?: string } | string;
      };
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : payload.error?.message ?? `RPC ${response.status}`);
      }
      if (payload.error) {
        throw new Error(typeof payload.error === "string" ? payload.error : payload.error.message ?? "RPC error");
      }
      return payload.result;
    },
  });
}

function createClients(account: Account) {
  const transport = rpcTransport();
  return {
    publicClient: createPublicClient({ chain: base, transport }),
    walletClient: createWalletClient({
      account,
      chain: base,
      transport,
      dataSuffix: BUILDER_DATA_SUFFIX,
    }),
  };
}

type MiningPublicClient = ReturnType<typeof createClients>["publicClient"];

export function deriveMiningAccountFromMnemonic(mnemonic: string): Account {
  const normalized = mnemonic.trim().toLowerCase().replace(/\s+/g, " ");
  return mnemonicToAccount(normalized, { path: DEFAULT_DERIVATION_PATH });
}

export function normalizeSmhlChallenge(raw: unknown): SmhlChallenge {
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
    const challenge = raw as Record<string, unknown>;
    return {
      targetAsciiSum: Number(challenge.targetAsciiSum),
      firstNChars: Number(challenge.firstNChars),
      wordCount: Number(challenge.wordCount),
      charPosition: Number(challenge.charPosition),
      charValue: Number(challenge.charValue),
      totalLength: Number(challenge.totalLength),
    };
  }
  throw new Error("Unable to normalize SMHL challenge.");
}

export function solveSmhlAlgorithmic(challenge: SmhlChallenge): string {
  const requiredChar = String.fromCharCode(challenge.charValue);
  const targetWords = challenge.wordCount;
  const targetLen = challenge.totalLength;
  const spaces = targetWords - 1;
  const letterBudget = targetLen - spaces;

  if (letterBudget <= 0 || targetWords <= 0) {
    return requiredChar.repeat(Math.max(1, targetLen));
  }

  const baseWordLen = Math.floor(letterBudget / targetWords);
  const extraChars = letterBudget - baseWordLen * targetWords;
  const words: string[] = [];
  for (let i = 0; i < targetWords; i += 1) {
    const len = Math.max(1, baseWordLen + (i < extraChars ? 1 : 0));
    words.push(i === 0 ? requiredChar + "a".repeat(len - 1) : "a".repeat(len));
  }
  return words.join(" ");
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

  return { targetAsciiSum, firstNChars, wordCount, charPosition, charValue, totalLength };
}

async function createPaidFetch(account: Account, publicClient: MiningPublicClient): Promise<typeof fetch> {
  const [{ x402Client, wrapFetchWithPayment }, { registerExactEvmScheme }, { toClientEvmSigner }] = await Promise.all([
    import("@x402/fetch"),
    import("@x402/evm/exact/client"),
    import("@x402/evm"),
  ]);
  const client = new x402Client();
  if (!account.signTypedData) {
    throw new Error("Mining wallet cannot sign x402 typed-data payments.");
  }
  const signTypedData = account.signTypedData.bind(account);
  const signer = toClientEvmSigner(
    {
      address: account.address,
      signTypedData: (message) => signTypedData(message as Parameters<typeof signTypedData>[0]),
    },
    {
      readContract: (args) => publicClient.readContract(args as Parameters<typeof publicClient.readContract>[0]),
      getTransactionCount: (args) => publicClient.getTransactionCount(args),
      estimateFeesPerGas: () => publicClient.estimateFeesPerGas(),
    },
  );
  registerExactEvmScheme(client, { signer });
  return wrapFetchWithPayment(fetch, client) as typeof fetch;
}

async function detectRigs(publicClient: MiningPublicClient, owner: Address): Promise<OwnedRig[]> {
  const balance = (await publicClient.readContract({
    address: CONTRACTS.miningAgent,
    abi: miningAgentAbi,
    functionName: "balanceOf",
    args: [owner],
  })) as bigint;
  if (balance === 0n) return [];

  const tokenIds = await Promise.all(
    Array.from({ length: Number(balance) }, (_, index) =>
      publicClient.readContract({
        address: CONTRACTS.miningAgent,
        abi: miningAgentAbi,
        functionName: "tokenOfOwnerByIndex",
        args: [owner, BigInt(index)],
      }) as Promise<bigint>,
    ),
  );

  return Promise.all(
    tokenIds.map(async (tokenId) => {
      const [rarityRaw, hashpowerRaw] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.miningAgent,
          abi: miningAgentAbi,
          functionName: "rarity",
          args: [tokenId],
        }) as Promise<number>,
        publicClient.readContract({
          address: CONTRACTS.miningAgent,
          abi: miningAgentAbi,
          functionName: "hashpower",
          args: [tokenId],
        }) as Promise<number>,
      ]);
      const rarity = Number(rarityRaw);
      return {
        tokenId,
        rarity,
        rarityLabel: rarityLabels[rarity] ?? `Tier ${rarity}`,
        hashpower: Number(hashpowerRaw),
      };
    }),
  );
}

function selectBestRig(rigs: OwnedRig[]): OwnedRig | null {
  if (rigs.length === 0) return null;
  return rigs.reduce((best, rig) => (rig.hashpower > best.hashpower ? rig : best));
}

async function readBalances(publicClient: MiningPublicClient, address: Address): Promise<WalletBalances> {
  const [eth, usdc] = await Promise.all([
    publicClient.getBalance({ address }),
    publicClient.readContract({
      address: CONTRACTS.baseUsdc,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }) as Promise<bigint>,
  ]);
  return { eth, usdc };
}

async function readChallenge(publicClient: MiningPublicClient): Promise<MiningChallenge> {
  return publicClient.readContract({
    address: CONTRACTS.agentCoin,
    abi: agentCoinAbi,
    functionName: "getMiningChallenge",
  }) as Promise<MiningChallenge>;
}

function formatHashpower(hashpower: number): string {
  return `${(hashpower / 100).toFixed(2)}x`;
}

function fixed(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(/\.?0+$/, "") || "0";
}

function minWithSlippage(value: number, decimals: number): string {
  return fixed(value * (1 - SWAP_SLIPPAGE_BPS / 10_000), decimals);
}

function event(input: CloudMinerSessionInput, level: MinerLogLevel, message: string, txHash?: Hex) {
  input.onEvent?.({ level, message, txHash });
}

function isExpiredMintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("expired");
}

export function createCloudMinerSession(input: CloudMinerSessionInput): CloudMinerSession {
  const account = deriveMiningAccountFromMnemonic(input.mnemonic);
  if (account.address.toLowerCase() !== input.expectedAddress.toLowerCase()) {
    throw new Error("Seed phrase does not match this Cloud Mining Agent wallet.");
  }
  const { publicClient, walletClient } = createClients(account);
  let paidFetchPromise: Promise<typeof fetch> | null = null;
  let ethUsdPromise: Promise<number> | null = null;

  async function refresh(): Promise<CloudMinerSnapshot> {
    const [balances, rigs, mintPrice] = await Promise.all([
      readBalances(publicClient, account.address),
      detectRigs(publicClient, account.address),
      publicClient.readContract({
        address: CONTRACTS.miningAgent,
        abi: miningAgentAbi,
        functionName: "getMintPrice",
      }) as Promise<bigint>,
    ]);
    return { address: account.address, balances, rigs, activeRig: selectBestRig(rigs), mintPrice };
  }

  async function getEthUsd(): Promise<number> {
    ethUsdPromise ??= api.ethUsd().then((quote) => quote.ethUsd);
    return ethUsdPromise;
  }

  async function swapEthToUsdc(ethAmount: bigint, minUsdcOut: bigint): Promise<Hex> {
    event(input, "info", `Auto-splitting ${formatEther(ethAmount)} ETH to USDC for x402 spend...`);
    const txHash = await walletClient.writeContract({
      address: CONTRACTS.uniswapSwapRouter,
      abi: swapRouterAbi,
      chain: base,
      account,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: CONTRACTS.baseWeth,
          tokenOut: CONTRACTS.baseUsdc,
          fee: UNISWAP_V3_ETH_USDC_FEE_TIER,
          recipient: account.address,
          amountIn: ethAmount,
          amountOutMinimum: minUsdcOut,
          sqrtPriceLimitX96: 0n,
        },
      ],
      value: ethAmount,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== "success") throw new Error("ETH to USDC auto-split reverted.");
    await api.recordMiningEvent({
      category: "swap",
      asset: "ETH",
      amount: formatEther(ethAmount),
      status: "confirmed",
      txHash,
      description: "Auto-split ETH to USDC for x402 GPU mining budget",
    });
    event(input, "success", "Auto-split ETH to USDC confirmed.", txHash);
    return txHash;
  }

  async function swapUsdcToEth(usdcAmount: bigint, minEthOut: bigint): Promise<Hex> {
    event(input, "info", `Auto-splitting ${formatUnits(usdcAmount, 6)} USDC to ETH for gas and minting...`);
    const allowance = (await publicClient.readContract({
      address: CONTRACTS.baseUsdc,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account.address, CONTRACTS.uniswapSwapRouter],
    })) as bigint;
    if (allowance < usdcAmount) {
      const approveHash = await walletClient.writeContract({
        address: CONTRACTS.baseUsdc,
        abi: erc20Abi,
        chain: base,
        account,
        functionName: "approve",
        args: [CONTRACTS.uniswapSwapRouter, usdcAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      event(input, "success", "USDC approval for auto-split confirmed.", approveHash);
    }

    const swapData = encodeFunctionData({
      abi: swapRouterAbi,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: CONTRACTS.baseUsdc,
          tokenOut: CONTRACTS.baseWeth,
          fee: UNISWAP_V3_ETH_USDC_FEE_TIER,
          recipient: CONTRACTS.uniswapSwapRouter,
          amountIn: usdcAmount,
          amountOutMinimum: minEthOut,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });
    const unwrapData = encodeFunctionData({
      abi: swapRouterAbi,
      functionName: "unwrapWETH9",
      args: [minEthOut, account.address],
    });
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);
    const txHash = await walletClient.writeContract({
      address: CONTRACTS.uniswapSwapRouter,
      abi: swapRouterAbi,
      chain: base,
      account,
      functionName: "multicall",
      args: [deadline, [swapData, unwrapData]],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== "success") throw new Error("USDC to ETH auto-split reverted.");
    await api.recordMiningEvent({
      category: "swap",
      asset: "USDC",
      amount: formatUnits(usdcAmount, 6),
      status: "confirmed",
      txHash,
      description: "Auto-split USDC to ETH for APoW minting and gas",
    });
    event(input, "success", "Auto-split USDC to ETH confirmed.", txHash);
    return txHash;
  }

  async function ensureStartupBalances(): Promise<CloudMinerSnapshot> {
    let snapshot = await refresh();
    const targetEth = (snapshot.activeRig ? 0n : snapshot.mintPrice) + MINT_GAS_RESERVE_WEI;
    if (snapshot.balances.eth >= targetEth && snapshot.balances.usdc >= STARTUP_USDC_UNITS) {
      return snapshot;
    }

    const ethUsd = await getEthUsd();
    let balances = snapshot.balances;

    if (balances.usdc < STARTUP_USDC_UNITS && balances.eth > targetEth) {
      const usdcNeeded = Number(formatUnits(STARTUP_USDC_UNITS - balances.usdc, 6));
      const ethToSwap = parseEther(fixed((usdcNeeded / ethUsd) * AUTO_SPLIT_BUFFER, 18));
      if (ethToSwap > 0n && balances.eth - ethToSwap >= targetEth) {
        const minUsdcOut = parseUnits(minWithSlippage(usdcNeeded, 6), 6);
        await swapEthToUsdc(ethToSwap, minUsdcOut);
        balances = await readBalances(publicClient, account.address);
      }
    }

    if (balances.eth < targetEth && balances.usdc > STARTUP_USDC_UNITS) {
      const ethNeeded = Number(formatEther(targetEth - balances.eth));
      const usdcToSwap = parseUnits(fixed(ethNeeded * ethUsd * AUTO_SPLIT_BUFFER, 6), 6);
      if (usdcToSwap > 0n && balances.usdc - usdcToSwap >= STARTUP_USDC_UNITS) {
        const minEthOut = parseEther(minWithSlippage(ethNeeded, 18));
        await swapUsdcToEth(usdcToSwap, minEthOut);
        balances = await readBalances(publicClient, account.address);
      }
    }

    snapshot = await refresh();
    const requiredEth = (snapshot.activeRig ? 0n : snapshot.mintPrice) + MINT_GAS_RESERVE_WEI;
    if (snapshot.balances.eth < requiredEth) {
      throw new Error(
        `Agent wallet needs ${formatEther(requiredEth)} ETH for ${snapshot.activeRig ? "gas" : "rig minting and gas"}. Fund with more ETH or enough USDC to auto-split.`,
      );
    }
    if (snapshot.balances.usdc < STARTUP_USDC_UNITS) {
      throw new Error(`Agent wallet needs at least ${MIN_STARTUP_USDC} USDC for x402 GPU grinding.`);
    }
    return snapshot;
  }

  async function mintRig(): Promise<OwnedRig> {
    const snapshot = await ensureStartupBalances();
    if (snapshot.activeRig) return snapshot.activeRig;
    const requiredEth = snapshot.mintPrice + MINT_GAS_RESERVE_WEI;
    if (snapshot.balances.eth < requiredEth) {
      throw new Error(`Mint needs ${formatEther(requiredEth)} ETH including gas reserve. Fund the mining wallet with ETH first.`);
    }

    for (let mintAttempt = 1; mintAttempt <= 2; mintAttempt += 1) {
      event(input, "info", `Requesting rig mint challenge${mintAttempt > 1 ? " again" : ""}...`);
      const challengeHash = await walletClient.writeContract({
        address: CONTRACTS.miningAgent,
        abi: miningAgentAbi,
        chain: base,
        account,
        functionName: "getChallenge",
        args: [account.address],
      });
      const challengeReceipt = await publicClient.waitForTransactionReceipt({ hash: challengeHash });
      if (challengeReceipt.status !== "success") throw new Error("Mint challenge request reverted on-chain.");

      let seed = ZERO_SEED;
      try {
        seed = (await publicClient.readContract({
          address: CONTRACTS.miningAgent,
          abi: miningAgentAbi,
          functionName: "challengeSeeds",
          args: [account.address],
          blockNumber: challengeReceipt.blockNumber,
        })) as Hex;
      } catch {
        // Some providers cannot serve just-confirmed historical state. Poll latest below.
      }

      if (seed.toLowerCase() === ZERO_SEED.toLowerCase()) {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          seed = (await publicClient.readContract({
            address: CONTRACTS.miningAgent,
            abi: miningAgentAbi,
            functionName: "challengeSeeds",
            args: [account.address],
          })) as Hex;
          if (seed.toLowerCase() !== ZERO_SEED.toLowerCase()) break;
          await new Promise((resolve) => setTimeout(resolve, 750));
        }
      }
      if (seed.toLowerCase() === ZERO_SEED.toLowerCase()) {
        throw new Error("Mint challenge seed was not available after confirmation. Try again.");
      }

      const solution = solveSmhlAlgorithmic(deriveChallengeFromSeed(seed));
      event(input, "info", "Minting APoW rig from browser-held mining wallet...");
      try {
        const mintHash = await walletClient.writeContract({
          address: CONTRACTS.miningAgent,
          abi: miningAgentAbi,
          chain: base,
          account,
          functionName: "mint",
          args: [solution],
          value: snapshot.mintPrice,
        });
        const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintHash });
        if (mintReceipt.status !== "success") throw new Error("Mint transaction reverted on-chain.");
        await api.recordMiningEvent({
          category: "mint",
          asset: "ETH",
          amount: formatEther(snapshot.mintPrice),
          status: "confirmed",
          txHash: mintHash,
          description: "Cloud Mining Agent minted APoW rig",
        });

        const rigs = await detectRigs(publicClient, account.address);
        const rig = selectBestRig(rigs);
        if (!rig) throw new Error("Mint confirmed but no rig was detected yet. Refresh and try again.");
        event(input, "success", `Minted rig #${rig.tokenId.toString()} (${rig.rarityLabel}, ${formatHashpower(rig.hashpower)})`, mintHash);
        return rig;
      } catch (error) {
        if (mintAttempt < 2 && isExpiredMintError(error)) {
          event(input, "warning", "Mint challenge expired before submit; requesting a fresh challenge.");
          continue;
        }
        throw error;
      }
    }

    throw new Error("Mint challenge expired twice. Try again.");
  }

  async function mineOnce(): Promise<Hex> {
    const snapshot = await ensureStartupBalances();
    const activeRig = snapshot.activeRig ?? (await mintRig());
    const balances = await readBalances(publicClient, account.address);
    if (balances.eth < MINE_GAS_RESERVE_WEI) {
      throw new Error(`Mining needs at least ${formatEther(MINE_GAS_RESERVE_WEI)} ETH for gas reserve.`);
    }
    if (balances.usdc === 0n) {
      throw new Error("x402 GPU grinding needs USDC in the mining wallet.");
    }

    const [beforeEarnings, miningChallenge] = await Promise.all([
      publicClient.readContract({
        address: CONTRACTS.agentCoin,
        abi: agentCoinAbi,
        functionName: "tokenEarnings",
        args: [activeRig.tokenId],
      }) as Promise<bigint>,
      readChallenge(publicClient),
    ]);
    const [challengeNumber, target, rawSmhl] = miningChallenge;
    const smhlSolution = solveSmhlAlgorithmic(normalizeSmhlChallenge(rawSmhl));
    event(input, "info", `Requesting x402 GPU grind for rig #${activeRig.tokenId.toString()}...`);

    paidFetchPromise ??= createPaidFetch(account, publicClient);
    const paidFetch = await paidFetchPromise;
    const grindResponse = await paidFetch("/api/grind", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        challenge: challengeNumber,
        target: target.toString(),
        address: account.address,
      }),
    });
    if (!grindResponse.ok) {
      const detail = await grindResponse.text().catch(() => "");
      throw new Error(`x402 GPU grind failed: ${grindResponse.status} ${detail.slice(0, 180)}`);
    }
    const grind = (await grindResponse.json()) as { nonce?: string; elapsed?: number };
    if (!grind.nonce) throw new Error("x402 GPU grind returned no nonce.");

    const latestChallenge = await readChallenge(publicClient);
    if (latestChallenge[0] !== challengeNumber) {
      event(input, "warning", "Challenge changed before submit; restarting with fresh work.");
      return mineOnce();
    }

    event(input, "info", "Submitting mine transaction from mining wallet...");
    const mineHash = await walletClient.writeContract({
      address: CONTRACTS.agentCoin,
      abi: agentCoinAbi,
      chain: base,
      account,
      functionName: "mine",
      args: [BigInt(grind.nonce), smhlSolution, activeRig.tokenId],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: mineHash });
    if (receipt.status !== "success") throw new Error("Mine transaction reverted on-chain.");

    const afterEarnings = (await publicClient.readContract({
      address: CONTRACTS.agentCoin,
      abi: agentCoinAbi,
      functionName: "tokenEarnings",
      args: [activeRig.tokenId],
    })) as bigint;
    const delta = afterEarnings > beforeEarnings ? afterEarnings - beforeEarnings : 0n;
    await api.recordMiningEvent({
      category: "mine",
      asset: "AGENT",
      amount: formatEther(delta),
      status: "confirmed",
      txHash: mineHash,
      description: `Cloud Mining Agent mined with rig #${activeRig.tokenId.toString()}`,
      jobStatus: "active",
    });
    await api.recordMiningEvent({
      category: "x402-grind",
      asset: "USDC",
      amount: "0",
      status: "confirmed",
      description: `x402 GPU grind completed${grind.elapsed ? ` in ${grind.elapsed.toFixed(1)}s` : ""}`,
    });
    event(input, "success", `Mine confirmed${delta > 0n ? ` (+${formatEther(delta)} AGENT)` : ""}`, mineHash);
    return mineHash;
  }

  async function run(signal: AbortSignal): Promise<void> {
    await api.startMining();
    event(input, "success", "Cloud Mining Agent session active. Keep this tab open so the wallet can sign.");
    while (!signal.aborted) {
      try {
        await mineOnce();
        await new Promise((resolve) => setTimeout(resolve, 2_500));
      } catch (error) {
        if (signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        await api.recordMiningEvent({
          category: "system",
          asset: "SYSTEM",
          amount: "0",
          status: "failed",
          description: message,
          jobStatus: "error",
          lastError: message,
        });
        event(input, "error", message);
        throw error;
      }
    }
  }

  return { account, refresh, mintRig, mineOnce, run };
}

export function formatBalances(balances: WalletBalances): { eth: string; usdc: string } {
  return {
    eth: Number(formatEther(balances.eth)).toFixed(5),
    usdc: Number(formatUnits(balances.usdc, 6)).toFixed(2),
  };
}

export { formatHashpower };
