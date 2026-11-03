import { pay } from "@base-org/account";
import { SignInWithBaseButton } from "@base-org/account-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  Bot,
  Brain,
  CirclePause,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Pickaxe,
  Play,
  Power,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
import { BASESCAN_BASE_URL, CONTRACTS, erc20Abi } from "../shared/constants";
import { sourceAssetLabel } from "../shared/funding";
import type { DashboardState, FundingIntent, SourceAsset } from "../shared/types";
import { api } from "./lib/api";
import {
  createCloudMinerSession,
  formatBalances,
  formatHashpower,
  type CloudMinerEvent,
  type CloudMinerSession,
  type CloudMinerSnapshot,
} from "./lib/cloudMiner";
import { generateMiningWallet, type GeneratedMiningWallet } from "./lib/miningWallet";

const sourceAssets: SourceAsset[] = ["BASE_USDC", "BASE_ETH", "SOLANA_USDC", "SOLANA_SOL"];

const primaryButton =
  "inline-flex h-9 w-full items-center justify-center gap-2 bg-[#0052FF] px-4 text-[11px] font-mono uppercase tracking-[0.08em] text-white shadow-[0_0_24px_rgba(0,82,255,0.25)] transition-colors hover:bg-[#0047E0] disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex h-9 w-full items-center justify-center gap-2 border border-[rgba(255,255,255,0.08)] px-4 text-[11px] font-mono uppercase tracking-[0.08em] text-[#4D9FFF] transition-colors hover:border-[rgba(255,255,255,0.15)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";
const compactSecondaryButton =
  "inline-flex h-9 items-center justify-center gap-2 border border-[rgba(255,255,255,0.08)] px-4 text-[11px] font-mono uppercase tracking-[0.08em] text-[#4D9FFF] transition-colors hover:border-[rgba(255,255,255,0.15)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";
const iconButton =
  "inline-flex h-9 w-9 flex-none items-center justify-center border border-[rgba(255,255,255,0.08)] text-[#4D9FFF] transition-colors hover:border-[#4D9FFF]/30 hover:bg-[#0052FF]/10 hover:text-white";

type SignInInput = {
  address: `0x${string}`;
  chainId: number;
};

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
  const { address, isConnected, isReconnecting, chainId, connector: activeConnector } = useAccount();
  const { connectors, connect, connectAsync, isPending: isConnectingWallet, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const capabilities = useCapabilities({ account: address });
  const supportsBatching = useMemo(() => {
    const atomic = capabilities.data?.[base.id]?.atomic;
    return atomic?.status === "ready" || atomic?.status === "supported";
  }, [capabilities.data]);
  const baseAccountConnector = useMemo(
    () => connectors.find((connector) => connector.name.toLowerCase().includes("base")) ?? connectors[0],
    [connectors],
  );
  const browserConnector = useMemo(
    () =>
      connectors.find((connector) => connector.id === "injected") ??
      connectors.find((connector) => connector.name.toLowerCase().includes("injected")),
    [connectors],
  );
  const activeIsBaseAccount = activeConnector?.name.toLowerCase().includes("base") ?? false;

  const signIn = useMutation({
    mutationFn: async (input?: SignInInput) => {
      const controlAddress = input?.address ?? address;
      const controlChainId = input?.chainId ?? chainId;
      if (!controlAddress || !controlChainId) throw new Error("Connect your Base wallet first.");
      const { nonce } = await api.nonce(controlAddress, "signin");
      const message = createSiweMessage({
        address: controlAddress,
        chainId: controlChainId,
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

  const connectBaseAccount = useMutation({
    mutationFn: async () => {
      if (!baseAccountConnector) throw new Error("Base Account connector is not available.");
      const connection = await connectAsync({ connector: baseAccountConnector, chainId: base.id });
      await signIn.mutateAsync({ address: connection.accounts[0], chainId: connection.chainId });
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

  const state = dashboard.data;
  const isSignedIn = Boolean(state?.user);
  const wrongChain = isConnected && chainId !== base.id;
  const signBusy = isSigning || signIn.isPending || connectBaseAccount.isPending || isConnectingWallet;

  return (
    <main className="noise-haze plus-grid crt-both min-h-screen overflow-x-hidden bg-[#060608] text-white">
      <div className="crt-bloom-overlay" aria-hidden="true" />

      <div className="border-b border-[rgba(255,255,255,0.04)]">
        <nav className="mx-auto flex h-11 max-w-[1200px] items-center justify-between px-5">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo.png?v=2" alt="APoW" className="h-5 w-5" />
            <span className="text-[13px] font-semibold">APoW</span>
            <span className="hidden text-[10px] font-mono uppercase tracking-[0.1em] text-[#4D9FFF] sm:inline">
              Cloud Mining Agent
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
              <Label>Cloud Mining Agent</Label>
              <h1 className="mt-2 text-[34px] font-extrabold leading-none sm:text-[48px]">
                Deploy cloud <span className="block text-[#0052FF]">mining agent</span>
              </h1>
              <p className="mt-4 max-w-[520px] text-[12px] leading-[1.7] text-[#717886]">
                Fund your agent wallet, back up the one-time seed phrase, and let a hosted APoW agent deploy your
                strongest rig for mining. The agent's LLM brain plans actions and provides explanations, while deterministic
                APoW tooling and x402 GPU routes handle mining proof and nonce grinding. No software download needed.
              </p>
            </div>
            {isSignedIn && (
              <button className={compactSecondaryButton} onClick={() => logout.mutate()} disabled={logout.isPending}>
                <Power size={14} />
                Sign out
              </button>
            )}
          </div>
        </section>

        <section className="dashboard grid grid-cols-1 border-b border-[rgba(255,255,255,0.04)] sm:grid-cols-3">
          <Metric coord="01.00" label="Agent Brain" value="blockrun/eco" />
          <Metric coord="01.01" label="Agent Status" value={state?.miningJob?.status ?? "Idle"} />
          <Metric
            coord="01.02"
            label="Agent Wallet"
            value={state?.wallet ? shortAddress(state.wallet.address) : "Not Created"}
          />
        </section>

        {!isSignedIn && !isConnected && (
          <Panel coord="02.00" label="Connect" title="Connect Base Account" icon={<Wallet size={16} />}>
            {isReconnecting && (
              <p className="mb-4 text-[10px] leading-[1.7] text-[#717886]">Restoring wallet connection...</p>
            )}
            <div className="grid gap-3 sm:max-w-[360px]">
              <BaseAccountAction busy={signBusy} onClick={() => connectBaseAccount.mutate()} />
              {browserConnector && (
                <button
                  className={secondaryButton}
                  onClick={() => connect({ connector: browserConnector, chainId: base.id })}
                  disabled={signBusy}
                >
                  <Wallet size={14} />
                  Use browser wallet
                </button>
              )}
              <p className="text-[9px] font-mono leading-[1.7] text-[#717886]">
                Base Account is the default for Base App users. Browser wallet fallback is available for desktop
                testing.
              </p>
            </div>
            {connectBaseAccount.error && <ErrorText error={connectBaseAccount.error} />}
            {connectError && <ErrorText error={connectError} />}
          </Panel>
        )}

        {!isSignedIn && isConnected && wrongChain && (
          <Panel coord="02.00" label="Network" title="Switch to Base" icon={<ShieldCheck size={16} />}>
            <button
              className={`${primaryButton} sm:max-w-[260px]`}
              onClick={() => switchChain({ chainId: base.id })}
              disabled={isSwitching}
            >
              {isSwitching ? <Loader2 className="spin" size={14} /> : <ShieldCheck size={14} />}
              Switch network
            </button>
          </Panel>
        )}

        {!isSignedIn && isConnected && !wrongChain && (
          <Panel coord="02.00" label="Authenticate" title="Sign in" icon={<KeyRound size={16} />}>
            <p className="mb-4 max-w-[520px] text-[10px] leading-[1.7] text-[#4D9FFF]">
              Your Base Account controls app access and funding. It never exposes your main wallet key to APoW.
            </p>
            <div className="grid gap-3 sm:max-w-[360px]">
              {activeIsBaseAccount ? (
                <BaseAccountAction
                  busy={signBusy}
                  onClick={() => address && chainId && signIn.mutate({ address, chainId })}
                />
              ) : (
                <button
                  className={primaryButton}
                  onClick={() => address && chainId && signIn.mutate({ address, chainId })}
                  disabled={signBusy}
                >
                  {signBusy ? <Loader2 className="spin" size={14} /> : <KeyRound size={14} />}
                  Sign in with connected wallet
                </button>
              )}
            </div>
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
          <Panel
            coord="02.00"
            label="Agent Wallet"
            title="Create cloud mining agent wallet"
            icon={<Bot size={16} />}
          >
            <p className="mb-4 max-w-[620px] text-[10px] leading-[1.7] text-[#4D9FFF]">
              The Cloud Mining Agent uses one dedicated EOA because APoW contracts reject smart-wallet callers. This
              wallet can own multiple rig-agents, but only one rig-agent can mine at a time.
            </p>
            <button
              className={`${primaryButton} sm:max-w-[280px]`}
              onClick={() => createWallet.mutate()}
              disabled={createWallet.isPending}
            >
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
              />
              <FundingPanel state={state} />
            </div>
            <div className="grid grid-cols-1 border-b border-[rgba(255,255,255,0.04)] lg:grid-cols-12">
              <AgentBrainPanel />
              <AgentToolsPanel state={state} />
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
    <section
      className={`relative min-w-0 border-b border-[rgba(255,255,255,0.04)] p-5 pt-8 sm:p-6 sm:pt-8 ${
        props.className ?? ""
      }`}
    >
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

function BaseAccountAction({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <div className={`base-account-action ${busy ? "pointer-events-none opacity-60" : ""}`}>
      <SignInWithBaseButton align="left" variant="solid" colorScheme="dark" onClick={onClick} />
    </div>
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
}) {
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [session, setSession] = useState<CloudMinerSession | null>(null);
  const [snapshot, setSnapshot] = useState<CloudMinerSnapshot | null>(null);
  const [logs, setLogs] = useState<CloudMinerEvent[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = (event: CloudMinerEvent) => {
    setLogs((current) => [{ ...event }, ...current].slice(0, 12));
  };

  const walletAddress = props.state.wallet?.address;
  const active = running || props.state.miningJob?.status === "active";
  const balances = snapshot ? formatBalances(snapshot.balances) : null;

  const unlock = useMutation({
    mutationFn: async () => {
      if (!walletAddress) throw new Error("Create the Cloud Mining Agent wallet first.");
      const next = createCloudMinerSession({
        mnemonic: seedPhrase,
        expectedAddress: walletAddress,
        onEvent: addLog,
      });
      const nextSnapshot = await next.refresh();
      setSession(next);
      setSnapshot(nextSnapshot);
      setSeedPhrase("");
      addLog({ level: "success", message: "Mining wallet unlocked locally. Seed phrase cleared from the form." });
      return nextSnapshot;
    },
  });

  const refreshMiner = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Unlock the mining wallet seed phrase first.");
      const nextSnapshot = await session.refresh();
      setSnapshot(nextSnapshot);
      return nextSnapshot;
    },
  });

  const mintRig = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Unlock the mining wallet seed phrase first.");
      const rig = await session.mintRig();
      setSnapshot(await session.refresh());
      return rig;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const mineOnce = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Unlock the mining wallet seed phrase first.");
      const hash = await session.mineOnce();
      setSnapshot(await session.refresh());
      return hash;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const runMiner = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Unlock the mining wallet seed phrase first.");
      const controller = new AbortController();
      abortRef.current = controller;
      setRunning(true);
      await session.run(controller.signal);
    },
    onSettled: async () => {
      abortRef.current = null;
      setRunning(false);
      if (session) {
        setSnapshot(await session.refresh().catch(() => snapshot));
      }
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const pauseAgent = async () => {
    abortRef.current?.abort();
    setRunning(false);
    try {
      await api.pauseMining();
      addLog({ level: "info", message: "Cloud Mining Agent session paused." });
    } catch (error) {
      addLog({ level: "warning", message: error instanceof Error ? error.message : "Pause request failed." });
    }
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const busy =
    unlock.isPending || refreshMiner.isPending || mintRig.isPending || mineOnce.isPending || runMiner.isPending;
  const panelError = unlock.error ?? refreshMiner.error ?? mintRig.error ?? mineOnce.error ?? runMiner.error;

  return (
    <Panel
      coord="02.00"
      label="Cloud Mining Agent"
      title="Agent Control"
      icon={<Pickaxe size={16} />}
      className="lg:col-span-7 lg:border-r"
    >
      <div className="mb-4 border border-[#0052FF]/[0.08] bg-[#0052FF]/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-[#0052FF] shadow-[0_0_6px_#0052FF]" />
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.1em]">Agent wallet</span>
        </div>
        <p className="break-all font-mono text-[11px] leading-[1.7] text-[#4D9FFF]">{props.state.wallet?.address}</p>
      </div>

      <div className="mb-4 border border-[#4D9FFF]/[0.12] bg-[rgba(255,255,255,0.015)] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={14} className="text-[#4D9FFF]" />
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.1em]">Active rig-agent rule</span>
        </div>
        <p className="text-[10px] leading-[1.7] text-[#4D9FFF]">
          You may own multiple rig-agents, but the Cloud Mining Agent can deploy exactly one active rig-agent. It
          defaults to the strongest hashpower multiplier in the wallet.
        </p>
      </div>

      {!session ? (
        <div className="mb-4 grid gap-3 border border-[#4D9FFF]/[0.12] bg-[rgba(255,255,255,0.015)] p-4">
          <div>
            <span className="text-[11px] font-mono font-medium uppercase tracking-[0.1em] text-white">
              Unlock local signer
            </span>
            <p className="mt-2 text-[10px] leading-[1.7] text-[#717886]">
              Paste the one-time seed phrase you backed up. It stays in this browser tab, derives the registered mining
              wallet locally, and is cleared from the form after unlock. APoW never receives it.
            </p>
          </div>
          <textarea
            className="min-h-24 resize-y border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.35)] p-3 font-mono text-[12px] leading-[1.7] text-white outline-none transition-colors focus:border-[#0052FF]"
            value={seedPhrase}
            onChange={(event) => setSeedPhrase(event.target.value)}
            placeholder="seed phrase"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
          />
          <button className={primaryButton} onClick={() => unlock.mutate()} disabled={busy || !seedPhrase.trim()}>
            {unlock.isPending ? <Loader2 className="spin" size={14} /> : <KeyRound size={14} />}
            Unlock mining wallet
          </button>
        </div>
      ) : (
        <div className="mb-4 grid gap-4">
          <div className="grid gap-px border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] sm:grid-cols-3">
            <AgentDatum label="ETH Gas" value={balances ? `${balances.eth} ETH` : "Loading"} />
            <AgentDatum label="x402 Budget" value={balances ? `${balances.usdc} USDC` : "Loading"} />
            <AgentDatum
              label="Active Rig"
              value={
                snapshot?.activeRig
                  ? `#${snapshot.activeRig.tokenId.toString()} ${formatHashpower(snapshot.activeRig.hashpower)}`
                  : "None minted"
              }
            />
          </div>

          {snapshot?.rigs.length ? (
            <div className="grid gap-px border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)]">
              {snapshot.rigs.map((rig) => (
                <div
                  key={rig.tokenId.toString()}
                  className={`grid gap-2 bg-[#0A0B0D] p-3 sm:grid-cols-[1fr_auto] ${
                    rig.tokenId === snapshot.activeRig?.tokenId ? "outline outline-1 outline-[#0052FF]/50" : ""
                  }`}
                >
                  <div>
                    <strong className="block text-[11px] font-medium">Rig-agent #{rig.tokenId.toString()}</strong>
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#4D9FFF]">
                      {rig.rarityLabel} / selectable inventory
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#4D9FFF]">{formatHashpower(rig.hashpower)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] leading-[1.7] text-[#717886]">
              No rig-agent detected. The agent will mint one before mining if the wallet has enough ETH or enough USDC
              to auto-split into ETH.
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <button className={secondaryButton} onClick={() => refreshMiner.mutate()} disabled={busy}>
              {refreshMiner.isPending ? <Loader2 className="spin" size={14} /> : <ShieldCheck size={14} />}
              Refresh agent state
            </button>
            <button className={secondaryButton} onClick={() => mintRig.mutate()} disabled={busy}>
              {mintRig.isPending ? <Loader2 className="spin" size={14} /> : <Sparkles size={14} />}
              Mint rig-agent
            </button>
            <button className={secondaryButton} onClick={() => mineOnce.mutate()} disabled={busy || running}>
              {mineOnce.isPending ? <Loader2 className="spin" size={14} /> : <Pickaxe size={14} />}
              Mine one block
            </button>
            <button
              className={active ? secondaryButton : primaryButton}
              onClick={active ? pauseAgent : () => runMiner.mutate()}
              disabled={busy && !running}
            >
              {runMiner.isPending ? (
                <Loader2 className="spin" size={14} />
              ) : active ? (
                <CirclePause size={14} />
              ) : (
                <Play size={14} />
              )}
              {active ? "Pause agent" : "Deploy cloud mining agent"}
            </button>
          </div>
        </div>
      )}

      <p className="mb-4 flex items-center gap-2 text-[10px] leading-[1.7] text-[#717886]">
        <ShieldCheck size={14} className="text-[#4D9FFF]" />
        {props.supportsBatching
          ? "Base Account batching available for funding UX"
          : "Single-transaction fallback active"}
      </p>

      {active && (
        <p className="mb-4 text-[10px] leading-[1.7] text-[#4D9FFF]">
          Session active. Keep this tab open so the browser-held mining wallet can sign x402 payments and Base
          transactions. APoW hosts the RPC and GPU grinding routes, not your private key.
        </p>
      )}

      {logs.length > 0 && (
        <div className="grid gap-px border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)]">
          {logs.map((entry, index) => (
            <div className="bg-[#0A0B0D] p-3" key={`${entry.message}-${index}`}>
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.1em] ${
                  entry.level === "error"
                    ? "text-[#FC401F]"
                    : entry.level === "warning"
                    ? "text-[#F8B84E]"
                    : "text-[#4D9FFF]"
                }`}
              >
                {entry.level} / cloud agent
              </span>
              <strong className="mt-1 block overflow-wrap-anywhere text-[11px] font-medium">{entry.message}</strong>
              {entry.txHash && (
                <a
                  href={`${BASESCAN_BASE_URL}/tx/${entry.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all font-mono text-[9px] text-[#4D9FFF] hover:text-white"
                >
                  {entry.txHash}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {panelError && <ErrorText error={panelError} />}
    </Panel>
  );
}

function AgentBrainPanel() {
  return (
    <Panel
      coord="03.00"
      label="Agent Brain"
      title="LLM Routing Profile"
      icon={<Brain size={16} />}
      className="lg:col-span-7 lg:border-r"
    >
      <div className="mb-4 grid gap-px border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] sm:grid-cols-3">
        <AgentDatum label="LLM Route" value="blockrun/eco" />
        <AgentDatum label="Simple Model" value="free/gpt-oss-120b" />
        <AgentDatum label="Payment Rail" value="x402 USDC" />
      </div>
      <p className="mb-4 text-[10px] leading-[1.7] text-[#4D9FFF]">
        The agent's brain uses the <code>blockrun/eco</code> routing profile. SIMPLE tasks use{" "}
        <code>free/gpt-oss-120b</code>. MEDIUM and COMPLEX tasks use <code>google/gemini-3.1-flash-lite</code>.
        REASONING tasks use <code>xai/grok-4-1-fast-reasoning</code>.
      </p>
      <p className="text-[9px] font-mono leading-[1.7] text-[#717886]">
        The LLM plans and explains agent actions. Core mining proofs and nonce grinding are deterministic tool work
        handled by APoW and x402 GPU routes.
      </p>
    </Panel>
  );
}

function AgentToolsPanel({ state }: { state: DashboardState }) {
  return (
    <Panel coord="03.01" label="Agent Tools" title="Execution Stack" icon={<Bot size={16} />} className="lg:col-span-5">
      <div className="grid gap-px border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)]">
        <AgentDatum
          label="Operating Wallet"
          value={state.wallet ? shortAddress(state.wallet.address) : "Not Created"}
        />
        <AgentDatum label="GPU Grinder" value="x402 GrindProxy" />
        <AgentDatum label="Base RPC" value="APoW RPC proxy" />
        <AgentDatum label="Rig Policy" value="Strongest Only" />
      </div>
    </Panel>
  );
}

function AgentDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-[#0A0B0D] p-3">
      <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-[#4D9FFF]">{label}</span>
      <strong className="mt-1 block overflow-wrap-anywhere text-[12px] font-medium text-white">{value}</strong>
    </div>
  );
}

function FundingPanel({ state }: { state: DashboardState }) {
  const queryClient = useQueryClient();
  const [sourceAsset, setSourceAsset] = useState<SourceAsset>("BASE_USDC");
  const [amount, setAmount] = useState("25.00");
  const [latestIntent, setLatestIntent] = useState<FundingIntent | null>(null);
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
    onSuccess: (intent) => {
      setLatestIntent(intent);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
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
    <Panel
      coord="02.01"
      label="Funding"
      title="Fund agent tools"
      icon={<ArrowDownToLine size={16} />}
      className="lg:col-span-5"
    >
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
      <button
        className={primaryButton}
        onClick={() => createIntent.mutate()}
        disabled={createIntent.isPending || waitEth.isLoading || waitUsdc.isLoading}
      >
        {createIntent.isPending ? <Loader2 className="spin" size={14} /> : <ArrowDownToLine size={14} />}
        {sourceAsset === "BASE_USDC"
          ? "Pay with Base Pay"
          : sourceAsset === "BASE_ETH"
          ? "Deposit ETH"
          : "Create Solana route"}
      </button>
      {sourceAsset === "BASE_USDC" && (
        <button className={`${secondaryButton} mt-2`} onClick={() => directUsdc.mutate()} disabled={directUsdc.isPending}>
          <ArrowDownToLine size={14} />
          Direct USDC transfer
        </button>
      )}
      {sourceAsset.startsWith("SOLANA") && (
        <p className="mt-4 text-[10px] leading-[1.7] text-[#717886]">
          Solana routes use Squid deposit addresses. Send only the selected asset to the returned address before it
          expires.
        </p>
      )}
      {latestIntent?.sourceAsset.startsWith("SOLANA") && (
        <div className="mt-4 border border-[#4D9FFF]/[0.12] bg-[rgba(255,255,255,0.015)] p-4">
          <span className="block text-[9px] font-mono uppercase tracking-[0.15em] text-[#4D9FFF]">
            Solana deposit address
          </span>
          <div className="mt-2 flex items-stretch gap-2">
            <span className="min-w-0 flex-1 break-all border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.35)] p-3 font-mono text-[10px] leading-[1.7] text-white">
              {latestIntent.depositAddress}
            </span>
            <button
              className={iconButton}
              onClick={() => navigator.clipboard.writeText(latestIntent.depositAddress)}
              aria-label="Copy Solana deposit address"
              title="Copy"
            >
              <Copy size={14} />
            </button>
          </div>
          <p className="mt-3 text-[9px] font-mono leading-[1.7] text-[#717886]">
            Expected on Base: {latestIntent.expectedReceive ?? "unknown"} / expires{" "}
            {latestIntent.expiresAt ? new Date(latestIntent.expiresAt).toLocaleString() : "when Squid route closes"}
          </p>
        </div>
      )}
      <p className="mt-4 text-[10px] leading-[1.7] text-[#717886]">
        One deposit is enough when the amount covers both sides. The unlocked mining wallet auto-splits on Base into ETH
        for minting/gas and USDC for x402 GPU spend before it starts mining.
      </p>
      {createIntent.error && <ErrorText error={createIntent.error} />}
      {directUsdc.error && <ErrorText error={directUsdc.error} />}
      <p className="mt-4 break-all text-[9px] font-mono leading-[1.7] text-[#4D9FFF]">
        Agent wallet deposit target: {state.wallet?.address}
      </p>
    </Panel>
  );
}

type CopyStatus = "idle" | "copied" | "failed";

function SeedBackupPanel(props: {
  generated: GeneratedMiningWallet;
  confirm: () => void;
  busy: boolean;
  error: unknown;
}) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  const handleCopy = async () => {
    let success = false;
    try {
      await navigator.clipboard.writeText(props.generated.mnemonic);
      success = true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, trying fallback.", err);
      const textArea = document.createElement("textarea");
      textArea.value = props.generated.mnemonic;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        success = document.execCommand("copy");
      } catch (execErr) {
        console.error("document.execCommand failed.", execErr);
        success = false;
      } finally {
        document.body.removeChild(textArea);
      }
    }

    if (success) {
      setCopyStatus("copied");
    } else {
      setCopyStatus("failed");
    }
    setTimeout(() => setCopyStatus("idle"), 2000);
  };

  return (
    <Panel coord="02.00" label="Custody" title="Back up seed phrase" icon={<KeyRound size={16} />}>
      <p className="mb-4 max-w-[720px] text-[10px] leading-[1.7] text-[#4D9FFF]">
        This is shown once. APoW does not store this seed phrase or private key. If it is lost, APoW cannot export or
        recover this mining wallet.
      </p>
      <div className="mb-4 grid grid-cols-2 gap-px border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)] sm:grid-cols-3 md:grid-cols-4">
        {props.generated.mnemonic.split(" ").map((word, index) => (
          <div className="min-h-12 bg-[#0A0B0D] p-3" key={`${word}-${index}`}>
            <span className="mr-2 font-mono text-[9px] text-[#4D9FFF]">{String(index + 1).padStart(2, "0")}</span>
            <strong className="font-mono text-[12px] font-medium text-white">{word}</strong>
          </div>
        ))}
      </div>
      <p className="mb-4 break-all text-[9px] font-mono leading-[1.7] text-[#717886]">
        Wallet: {props.generated.address}
      </p>
      <div className="flex flex-col gap-2 sm:max-w-[480px] sm:flex-row">
        <button className={secondaryButton} onClick={handleCopy} disabled={props.busy}>
          {copyStatus === "copied" ? (
            <>
              <ShieldCheck size={14} /> Copied
            </>
          ) : copyStatus === "failed" ? (
            "Failed to copy"
          ) : (
            <>
              <Copy size={14} /> Copy seed phrase
            </>
          )}
        </button>
        <button className={`${primaryButton}`} onClick={props.confirm} disabled={props.busy}>
          {props.busy ? <Loader2 className="spin" size={14} /> : <ShieldCheck size={14} />}
          I backed it up
        </button>
      </div>
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
    <Panel
      coord="04.00"
      label="Agent Wallet"
      title="Mining EOA"
      icon={<Wallet size={16} />}
      className="lg:col-span-5 lg:border-r"
    >
      <div className="mb-4 flex items-stretch gap-2">
        <span className="min-w-0 flex-1 break-all border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.35)] p-3 font-mono text-[10px] leading-[1.7] text-[#4D9FFF]">
          {state.wallet?.address}
        </span>
        <button
          className={iconButton}
          onClick={() => navigator.clipboard.writeText(state.wallet?.address ?? "")}
          aria-label="Copy hosted wallet address"
          title="Copy"
        >
          <Copy size={14} />
        </button>
        <a
          className={iconButton}
          href={`${BASESCAN_BASE_URL}/address/${state.wallet?.address}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Open hosted wallet on Basescan"
          title="Open on Basescan"
        >
          <ExternalLink size={14} />
        </a>
      </div>
      <p className="mb-4 text-[10px] leading-[1.7] text-[#4D9FFF]">
        One Cloud Mining Agent wallet is allowed per signed-in Base Account.
      </p>
      <button className={secondaryButton} onClick={() => pauseWallet.mutate()} disabled={pauseWallet.isPending}>
        {state.wallet?.paused ? <Play size={14} /> : <CirclePause size={14} />}
        {state.wallet?.paused ? "Resume wallet" : "Pause wallet"}
      </button>
      <p className="mt-4 text-[9px] font-mono leading-[1.7] text-[#717886]">
        APoW does not store this wallet's seed phrase or private key. Back up the phrase shown at creation or this
        wallet cannot be exported or recovered.
      </p>
    </Panel>
  );
}

function ActivityPanel({ state }: { state: DashboardState }) {
  const items = state.ledger.slice(0, 8);
  const active = state.miningJob?.status === "active";
  return (
    <Panel
      coord="04.01"
      label="Agent Log"
      title="Agent Activity"
      icon={<ShieldCheck size={16} />}
      className="lg:col-span-7"
    >
      {items.length === 0 ? (
        <div className="grid gap-px border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.06)]">
          {[
            "LLM brain ready on blockrun/eco route",
            state.wallet ? "Agent wallet registered and awaiting funding" : "Waiting for agent wallet creation",
            active ? "Cloud Mining Agent deployed" : "Deploy agent to begin x402 GPU workflow",
          ].map((line, index) => (
            <div className="bg-[#0A0B0D] p-3" key={line}>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#4D9FFF]">
                {String(index + 1).padStart(2, "0")} / agent
              </span>
              <strong className="mt-1 block text-[11px] font-medium">{line}</strong>
            </div>
          ))}
        </div>
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
  return (
    <p className="mt-3 text-[10px] font-mono leading-[1.7] text-[#FC401F]">
      {error instanceof Error ? error.message : "Something failed"}
    </p>
  );
}
