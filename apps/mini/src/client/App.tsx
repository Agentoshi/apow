import { pay } from "@base-org/account";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  Bot,
  CirclePause,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Pickaxe,
  Play,
  Power,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { parseEther, parseUnits } from "viem";
import { createSiweMessage } from "viem/siwe";
import {
  useAccount,
  useCapabilities,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSignMessage,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import { BASESCAN_BASE_URL, CONTRACTS, DEFAULT_DAILY_CAP_USDC, erc20Abi } from "../shared/constants";
import { sourceAssetLabel } from "../shared/funding";
import type { DashboardState, SourceAsset } from "../shared/types";
import { api } from "./lib/api";
import { generateMiningWallet, type GeneratedMiningWallet } from "./lib/miningWallet";

const sourceAssets: SourceAsset[] = ["BASE_USDC", "BASE_ETH", "SOLANA_USDC", "SOLANA_SOL"];

const primaryButton =
  "inline-flex h-9 w-full items-center justify-center gap-2 bg-[#0052FF] px-4 text-[11px] font-mono uppercase tracking-[0.08em] text-white shadow-[0_0_24px_rgba(0,82,255,0.25)] transition-colors hover:bg-[#0047E0] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex h-9 w-full items-center justify-center gap-2 border border-[rgba(255,255,255,0.08)] px-4 text-[11px] font-mono uppercase tracking-[0.08em] text-[#4D9FFF] transition-colors hover:border-[rgba(255,255,255,0.15)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";
const iconButton =
  "inline-flex h-9 w-9 flex-none items-center justify-center border border-[rgba(255,255,255,0.08)] text-[#4D9FFF] transition-colors hover:border-[#4D9FFF]/30 hover:bg-[#0052FF]/10 hover:text-white";

function shortAddress(address?: string | null): string {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
    retry: false,
    refetchInterval: 8000,
  });
}

export function App() {
  const queryClient = useQueryClient();
  const dashboard = useDashboard();
  const [pendingWalletBackup, setPendingWalletBackup] = useState<GeneratedMiningWallet | null>(null);
  const { address, isConnected, isReconnecting, chainId } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const capabilities = useCapabilities({ account: address });
  const supportsBatching = useMemo(() => {
    const atomic = capabilities.data?.[base.id]?.atomic;
    return atomic?.status === "ready" || atomic?.status === "supported";
  }, [capabilities.data]);

  const signIn = useMutation({
    mutationFn: async () => {
      if (!address || !chainId) throw new Error("Connect your Base wallet first.");
      const { nonce } = await api.nonce(address, "signin");
      const message = createSiweMessage({
        address,
        chainId,
        domain: window.location.host,
        uri: window.location.origin,
        version: "1",
        nonce,
        statement: "Sign in to APoW Cloud Mining.",
      });
      const signature = await signMessageAsync({ message });
      await api.verify(message, signature);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      disconnect();
      queryClient.resetQueries({ queryKey: ["dashboard"] });
    },
  });

  const createWallet = useMutation({
    mutationFn: async () => {
      const generated = generateMiningWallet();
      setPendingWalletBackup(generated);
      return generated;
    },
  });

  const confirmWalletBackup = useMutation({
    mutationFn: async () => {
      if (!pendingWalletBackup) throw new Error("No generated wallet to register");
      const { wallet } = await api.createWallet(pendingWalletBackup.address, pendingWalletBackup.derivationPath);
      if (wallet.address.toLowerCase() !== pendingWalletBackup.address.toLowerCase()) {
        throw new Error("This account already has a different mining wallet.");
      }
      return api.confirmWalletBackup();
    },
    onSuccess: () => {
      setPendingWalletBackup(null);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const startMining = useMutation({
    mutationFn: () => api.startMining(DEFAULT_DAILY_CAP_USDC),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const pauseMining = useMutation({
    mutationFn: api.pauseMining,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const state = dashboard.data;
  const isSignedIn = Boolean(state?.user);
  const wrongChain = isConnected && chainId !== base.id;
  const signBusy = isSigning || signIn.isPending;

  return (
    <main className="noise-haze plus-grid crt-both min-h-screen overflow-x-hidden bg-[#060608] text-white">
      <div className="crt-bloom-overlay" aria-hidden="true" />

      <div className="border-b border-[rgba(255,255,255,0.04)]">
        <nav className="mx-auto flex h-11 max-w-[1200px] items-center justify-between px-5">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo.png?v=2" alt="APoW" className="h-5 w-5" />
            <span className="text-[13px] font-semibold">APoW</span>
            <span className="hidden text-[10px] font-mono uppercase tracking-[0.1em] text-[#4D9FFF] sm:inline">
              Cloud Mining
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] font-mono uppercase tracking-[0.1em] text-[#4D9FFF] sm:inline">
              Base App
            </span>
            <div className="flex h-7 items-center gap-2 border border-[#4D9FFF]/20 px-2 text-[10px] font-mono text-[#4D9FFF]">
              <Wallet size={13} />
              <span>{isConnected ? shortAddress(address) : "No wallet"}</span>
            </div>
          </div>
        </nav>
      </div>

      <div className="mx-auto max-w-[1200px] border-x border-[rgba(255,255,255,0.04)]">
        <section className="relative border-b border-[rgba(255,255,255,0.04)] p-5 pt-8 sm:p-6 sm:pt-8">
          <Coord value="00.00" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-[620px]">
              <Label>Hosted Agent Console</Label>
              <h1 className="mt-2 text-[34px] font-extrabold leading-none sm:text-[48px]">
                Cloud mining <span className="block text-[#0052FF]">for $AGENT</span>
              </h1>
              <p className="mt-4 max-w-[520px] text-[12px] leading-[1.7] text-[#717886]">
                Fund one mining wallet from Base, back up the one-time seed phrase, and run APoW through the same Base-native console style as the protocol site.
              </p>
            </div>
            {isSignedIn && (
              <button className={`${secondaryButton} w-auto`} onClick={() => logout.mutate()} disabled={logout.isPending}>
                <Power size={14} />
                Sign out
              </button>
            )}
          </div>
        </section>

        <section className="dashboard grid grid-cols-1 border-b border-[rgba(255,255,255,0.04)] sm:grid-cols-3">
          <Metric coord="01.00" label="Hosted Wallet" value={state?.wallet ? shortAddress(state.wallet.address) : "Not Created"} />
          <Metric coord="01.01" label="Mining Status" value={state?.miningJob?.status ?? "Idle"} />
          <Metric coord="01.02" label="Daily Cap" value={`$${state?.miningJob?.dailyCapUsdc ?? DEFAULT_DAILY_CAP_USDC}`} />
        </section>

        {!isConnected && (
          <Panel coord="02.00" label="Connect" title="Connect Base Account" icon={<Wallet size={16} />}>
            {isReconnecting && <p className="mb-4 text-[10px] leading-[1.7] text-[#717886]">Restoring wallet connection...</p>}
            <div className="grid gap-2 sm:max-w-[360px]">
              {connectors.map((connector) => (
                <button className={primaryButton} key={connector.uid} onClick={() => connect({ connector })}>
                  <Wallet size={14} />
                  Connect {connector.name}
                </button>
              ))}
            </div>
          </Panel>
        )}

        {isConnected && wrongChain && (
          <Panel coord="02.00" label="Network" title="Switch to Base" icon={<ShieldCheck size={16} />}>
            <button className={`${primaryButton} sm:max-w-[260px]`} onClick={() => switchChain({ chainId: base.id })} disabled={isSwitching}>
              {isSwitching ? <Loader2 className="spin" size={14} /> : <ShieldCheck size={14} />}
              Switch network
            </button>
          </Panel>
        )}

        {isConnected && !wrongChain && !isSignedIn && (
          <Panel coord="02.00" label="Authenticate" title="Sign in" icon={<KeyRound size={16} />}>
            <p className="mb-4 max-w-[520px] text-[10px] leading-[1.7] text-[#4D9FFF]">
              Your Base Account controls app access and funding. It never exposes your main wallet key to APoW.
            </p>
            <button className={`${primaryButton} sm:max-w-[260px]`} onClick={() => signIn.mutate()} disabled={signBusy}>
              {signBusy ? <Loader2 className="spin" size={14} /> : <KeyRound size={14} />}
              Sign in with Base
            </button>
            {signIn.error && <ErrorText error={signIn.error} />}
          </Panel>
        )}

        {isSignedIn && !state?.wallet && pendingWalletBackup && (
          <SeedBackupPanel
            generated={pendingWalletBackup}
            confirm={() => confirmWalletBackup.mutate()}
            busy={confirmWalletBackup.isPending}
            error={confirmWalletBackup.error}
          />
        )}

        {isSignedIn && !state?.wallet && !pendingWalletBackup && (
          <Panel coord="02.00" label="Mining Wallet" title="Create agent wallet" icon={<Bot size={16} />}>
            <p className="mb-4 max-w-[620px] text-[10px] leading-[1.7] text-[#4D9FFF]">
              APoW uses one dedicated mining EOA per Base Account because the live contracts reject smart-wallet callers. This wallet can own multiple rigs, but only one rig can mine at a time.
            </p>
            <button className={`${primaryButton} sm:max-w-[280px]`} onClick={() => createWallet.mutate()} disabled={createWallet.isPending}>
              {createWallet.isPending ? <Loader2 className="spin" size={14} /> : <Bot size={14} />}
              Create agent wallet
            </button>
            {createWallet.error && <ErrorText error={createWallet.error} />}
          </Panel>
        )}

        {isSignedIn && state?.wallet && (
          <>
            <div className="grid grid-cols-1 border-b border-[rgba(255,255,255,0.04)] lg:grid-cols-12">
              <MiningPanel
                state={state}
                supportsBatching={supportsBatching}
                startMining={() => startMining.mutate()}
                pauseMining={() => pauseMining.mutate()}
                busy={startMining.isPending || pauseMining.isPending}
              />
              <FundingPanel state={state} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <WalletPanel state={state} />
              <ActivityPanel state={state} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#4D9FFF]">{children}</span>;
}

function Coord({ value }: { value: string }) {
  return <span className="absolute right-3 top-2 select-none text-[9px] font-mono text-[#4D9FFF]">{value}</span>;
}

function Panel(props: {
  coord: string;
  label: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative min-w-0 border-b border-[rgba(255,255,255,0.04)] p-5 pt-8 sm:p-6 sm:pt-8 ${props.className ?? ""}`}>
      <Coord value={props.coord} />
      <Label>{props.label}</Label>
      <div className="mb-4 mt-2 flex items-center gap-2">
        <span className="text-[#4D9FFF]">{props.icon}</span>
        <h2 className="text-[18px] font-bold">{props.title}</h2>
      </div>
      {props.children}
    </section>
  );
}

function Metric({ coord, label, value }: { coord: string; label: string; value: string }) {
  return (
    <div className="relative min-h-[104px] p-5 pt-8">
      <Coord value={coord} />
      <p className="mb-1 overflow-wrap-anywhere font-mono text-[30px] font-bold leading-none">{value}</p>
      <Label>{label}</Label>
    </div>
  );
}

function MiningPanel(props: {
  state: DashboardState;
  supportsBatching: boolean;
  startMining: () => void;
  pauseMining: () => void;
  busy: boolean;
}) {
  const active = props.state.miningJob?.status === "active";
  return (
    <Panel coord="02.00" label="Mine" title="Hosted APoW agent" icon={<Pickaxe size={16} />} className="lg:col-span-7 lg:border-r">
      <div className="mb-4 border border-[#0052FF]/[0.08] bg-[#0052FF]/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-[#0052FF] shadow-[0_0_6px_#0052FF]" />
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.1em]">Mining wallet</span>
        </div>
        <p className="break-all font-mono text-[11px] leading-[1.7] text-[#4D9FFF]">{props.state.wallet?.address}</p>
      </div>

      <div className="mb-4 border border-[#4D9FFF]/[0.12] bg-[rgba(255,255,255,0.015)] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Bot size={14} className="text-[#4D9FFF]" />
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.1em]">Rig rule</span>
        </div>
        <p className="text-[10px] leading-[1.7] text-[#4D9FFF]">
          You may mint multiple mining rigs into this wallet, but APoW mines with exactly one active rig. The app defaults to the rig with the best hashpower multiplier.
        </p>
      </div>

      <p className="mb-4 flex items-center gap-2 text-[10px] leading-[1.7] text-[#717886]">
        <ShieldCheck size={14} className="text-[#4D9FFF]" />
        {props.supportsBatching ? "Base Account batching available for funding UX" : "Single-transaction fallback active"}
      </p>
      <button className={active ? secondaryButton : primaryButton} onClick={active ? props.pauseMining : props.startMining} disabled={props.busy}>
        {props.busy ? <Loader2 className="spin" size={14} /> : active ? <CirclePause size={14} /> : <Play size={14} />}
        {active ? "Pause mining" : "Start mining"}
      </button>
    </Panel>
  );
}

function FundingPanel({ state }: { state: DashboardState }) {
  const queryClient = useQueryClient();
  const [sourceAsset, setSourceAsset] = useState<SourceAsset>("BASE_USDC");
  const [amount, setAmount] = useState("10.00");
  const { sendTransactionAsync, data: ethHash } = useSendTransaction();
  const { writeContractAsync, data: usdcHash } = useWriteContract();
  const waitEth = useWaitForTransactionReceipt({ hash: ethHash });
  const waitUsdc = useWaitForTransactionReceipt({ hash: usdcHash });

  const createIntent = useMutation({
    mutationFn: async () => {
      const { intent } = await api.createFundingIntent(sourceAsset, amount);
      if (sourceAsset === "BASE_USDC") {
        const payment = await pay({ amount, to: intent.depositAddress as `0x${string}`, testnet: false });
        await api.verifyBasePay(intent.id, payment.id);
      }
      if (sourceAsset === "BASE_ETH") {
        const txHash = await sendTransactionAsync({
          to: intent.depositAddress as `0x${string}`,
          value: parseEther(amount),
          chainId: base.id,
        });
        await api.confirmDirectFunding(intent.id, txHash);
      }
      if (sourceAsset === "SOLANA_SOL" || sourceAsset === "SOLANA_USDC") {
        return intent;
      }
      return intent;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const directUsdc = useMutation({
    mutationFn: async () => {
      const { intent } = await api.createFundingIntent("BASE_USDC", amount);
      const txHash = await writeContractAsync({
        address: CONTRACTS.baseUsdc,
        abi: erc20Abi,
        functionName: "transfer",
        args: [intent.depositAddress as `0x${string}`, parseUnits(amount, 6)],
        chainId: base.id,
      });
      await api.confirmDirectFunding(intent.id, txHash);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  return (
    <Panel coord="02.01" label="Funding" title="Add mining budget" icon={<ArrowDownToLine size={16} />} className="lg:col-span-5">
      <div className="mb-4 grid grid-cols-2 gap-px border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)]">
        {sourceAssets.map((asset) => (
          <button
            key={asset}
            className={`min-h-10 px-2 text-[10px] font-mono uppercase tracking-[0.08em] transition-colors ${
              sourceAsset === asset ? "bg-[#0052FF] text-white" : "bg-[#0A0B0D] text-[#4D9FFF] hover:text-white"
            }`}
            onClick={() => setSourceAsset(asset)}
          >
            {sourceAssetLabel(asset)}
          </button>
        ))}
      </div>
      <label className="mb-4 grid gap-1">
        <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#4D9FFF]">Amount</span>
        <input
          className="h-10 border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.35)] px-3 font-mono text-[12px] text-white outline-none transition-colors focus:border-[#0052FF]"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
        />
      </label>
      <button className={primaryButton} onClick={() => createIntent.mutate()} disabled={createIntent.isPending || waitEth.isLoading || waitUsdc.isLoading}>
        {createIntent.isPending ? <Loader2 className="spin" size={14} /> : <ArrowDownToLine size={14} />}
        {sourceAsset === "BASE_USDC" ? "Pay with Base Pay" : sourceAsset === "BASE_ETH" ? "Deposit ETH" : "Create Solana route"}
      </button>
      {sourceAsset === "BASE_USDC" && (
        <button className={`${secondaryButton} mt-2`} onClick={() => directUsdc.mutate()} disabled={directUsdc.isPending}>
          <ArrowDownToLine size={14} />
          Direct USDC transfer
        </button>
      )}
      {sourceAsset.startsWith("SOLANA") && (
        <p className="mt-4 text-[10px] leading-[1.7] text-[#717886]">
          The API records the Solana route request now; bridge quoting is the next wired backend step.
        </p>
      )}
      {createIntent.error && <ErrorText error={createIntent.error} />}
      {directUsdc.error && <ErrorText error={directUsdc.error} />}
      <p className="mt-4 break-all text-[9px] font-mono leading-[1.7] text-[#4D9FFF]">
        Deposit target: {state.wallet?.address}
      </p>
    </Panel>
  );
}

function SeedBackupPanel(props: {
  generated: GeneratedMiningWallet;
  confirm: () => void;
  busy: boolean;
  error: unknown;
}) {
  return (
    <Panel coord="02.00" label="Custody" title="Back up seed phrase" icon={<KeyRound size={16} />}>
      <p className="mb-4 max-w-[720px] text-[10px] leading-[1.7] text-[#4D9FFF]">
        This is shown once. APoW does not store this seed phrase or private key. If it is lost, APoW cannot export or recover this mining wallet.
      </p>
      <div className="mb-4 grid grid-cols-2 gap-px border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] sm:grid-cols-3 md:grid-cols-4">
        {props.generated.mnemonic.split(" ").map((word, index) => (
          <div className="min-h-12 bg-[#0A0B0D] p-3" key={`${word}-${index}`}>
            <span className="mr-2 font-mono text-[9px] text-[#4D9FFF]">{String(index + 1).padStart(2, "0")}</span>
            <strong className="font-mono text-[12px] font-medium text-white">{word}</strong>
          </div>
        ))}
      </div>
      <p className="mb-4 break-all text-[9px] font-mono leading-[1.7] text-[#717886]">Wallet: {props.generated.address}</p>
      <button className={`${primaryButton} sm:max-w-[220px]`} onClick={props.confirm} disabled={props.busy}>
        {props.busy ? <Loader2 className="spin" size={14} /> : <ShieldCheck size={14} />}
        I backed it up
      </button>
      {Boolean(props.error) && <ErrorText error={props.error} />}
    </Panel>
  );
}

function WalletPanel({ state }: { state: DashboardState }) {
  const queryClient = useQueryClient();
  const pauseWallet = useMutation({
    mutationFn: state.wallet?.paused ? api.resumeWallet : api.pauseWallet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });
  return (
    <Panel coord="03.00" label="Agent Wallet" title="Mining EOA" icon={<Wallet size={16} />} className="lg:col-span-5 lg:border-r">
      <div className="mb-4 flex items-stretch gap-2">
        <span className="min-w-0 flex-1 break-all border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.35)] p-3 font-mono text-[10px] leading-[1.7] text-[#4D9FFF]">
          {state.wallet?.address}
        </span>
        <button className={iconButton} onClick={() => navigator.clipboard.writeText(state.wallet?.address ?? "")} aria-label="Copy hosted wallet address" title="Copy">
          <Copy size={14} />
        </button>
        <a className={iconButton} href={`${BASESCAN_BASE_URL}/address/${state.wallet?.address}`} target="_blank" rel="noreferrer" aria-label="Open hosted wallet on Basescan" title="Open on Basescan">
          <ExternalLink size={14} />
        </a>
      </div>
      <p className="mb-4 text-[10px] leading-[1.7] text-[#4D9FFF]">One hosted mining wallet is allowed per signed-in Base Account.</p>
      <button className={secondaryButton} onClick={() => pauseWallet.mutate()} disabled={pauseWallet.isPending}>
        {state.wallet?.paused ? <Play size={14} /> : <CirclePause size={14} />}
        {state.wallet?.paused ? "Resume wallet" : "Pause wallet"}
      </button>
      <p className="mt-4 text-[9px] font-mono leading-[1.7] text-[#717886]">
        APoW does not store this wallet's seed phrase or private key. Back up the phrase shown at creation or this wallet cannot be exported or recovered.
      </p>
    </Panel>
  );
}

function ActivityPanel({ state }: { state: DashboardState }) {
  const items = state.ledger.slice(0, 8);
  return (
    <Panel coord="03.01" label="Ledger" title="Activity" icon={<ShieldCheck size={16} />} className="lg:col-span-7">
      {items.length === 0 ? (
        <p className="text-[10px] leading-[1.7] text-[#717886]">Deposits, swaps, x402 costs, gas, minting, and mining events will appear here.</p>
      ) : (
        <div className="grid gap-px border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)]">
          {items.map((entry) => (
            <div className="grid gap-2 bg-[#0A0B0D] p-3 sm:grid-cols-[1fr_auto]" key={entry.id}>
              <div className="min-w-0">
                <strong className="block text-[11px] font-medium">{entry.description}</strong>
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#4D9FFF]">
                  {entry.category} / {entry.status}
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#4D9FFF]">
                {entry.amount} {entry.asset}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ErrorText({ error }: { error: unknown }) {
  return <p className="mt-3 text-[10px] font-mono leading-[1.7] text-[#FC401F]">{error instanceof Error ? error.message : "Something failed"}</p>;
}
