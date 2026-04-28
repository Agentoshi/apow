import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pay } from "@base-org/account";
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
import { createSiweMessage } from "viem/siwe";
import { base } from "wagmi/chains";
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
import { parseEther, parseUnits } from "viem";
import { api } from "./lib/api";
import { generateMiningWallet, type GeneratedMiningWallet } from "./lib/miningWallet";
import { BASESCAN_BASE_URL, CONTRACTS, DEFAULT_DAILY_CAP_USDC, erc20Abi } from "../shared/constants";
import { sourceAssetLabel } from "../shared/funding";
import type { DashboardState, SourceAsset } from "../shared/types";

const sourceAssets: SourceAsset[] = ["BASE_USDC", "BASE_ETH", "SOLANA_USDC", "SOLANA_SOL"];

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
    <main className="shell">
      <section className="topbar">
        <div>
          <div className="brand">APoW</div>
          <h1>Cloud mining console</h1>
        </div>
        <div className="wallet-pill">
          <Wallet size={16} />
          <span>{isConnected ? shortAddress(address) : "No wallet"}</span>
        </div>
      </section>

      <section className="status-grid">
        <Metric label="Hosted wallet" value={state?.wallet ? shortAddress(state.wallet.address) : "Not created"} />
        <Metric label="Mining status" value={state?.miningJob?.status ?? "idle"} />
        <Metric label="Daily cap" value={`$${state?.miningJob?.dailyCapUsdc ?? DEFAULT_DAILY_CAP_USDC}`} />
      </section>

      {!isConnected && (
        <Panel title="Connect Base Account" icon={<Wallet size={18} />}>
          {isReconnecting && <p className="muted">Restoring wallet connection...</p>}
          <div className="button-stack">
            {connectors.map((connector) => (
              <button className="primary" key={connector.uid} onClick={() => connect({ connector })}>
                <Wallet size={16} />
                Connect {connector.name}
              </button>
            ))}
          </div>
        </Panel>
      )}

      {isConnected && wrongChain && (
        <Panel title="Switch to Base" icon={<ShieldCheck size={18} />}>
          <button className="primary" onClick={() => switchChain({ chainId: base.id })} disabled={isSwitching}>
            {isSwitching ? <Loader2 className="spin" size={16} /> : <ShieldCheck size={16} />}
            Switch network
          </button>
        </Panel>
      )}

      {isConnected && !wrongChain && !isSignedIn && (
        <Panel title="Sign in" icon={<KeyRound size={18} />}>
          <p className="muted">Your Base Account controls the hosted mining wallet. It never exposes your main wallet key.</p>
          <button className="primary" onClick={() => signIn.mutate()} disabled={signBusy}>
            {signBusy ? <Loader2 className="spin" size={16} /> : <KeyRound size={16} />}
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
        />
      )}

      {isSignedIn && !state?.wallet && !pendingWalletBackup && (
        <Panel title="Create hosted mining wallet" icon={<Bot size={18} />}>
          <p className="muted">
            APoW uses one dedicated mining EOA per Base Account because the live contracts reject smart-wallet callers. This wallet can own multiple rigs, but only one rig can mine at a time.
          </p>
          <button className="primary" onClick={() => createWallet.mutate()} disabled={createWallet.isPending}>
            {createWallet.isPending ? <Loader2 className="spin" size={16} /> : <Bot size={16} />}
            Create agent wallet
          </button>
          {createWallet.error && <ErrorText error={createWallet.error} />}
        </Panel>
      )}

      {isSignedIn && state?.wallet && (
        <div className="main-grid">
          <MiningPanel
            state={state}
            supportsBatching={supportsBatching}
            startMining={() => startMining.mutate()}
            pauseMining={() => pauseMining.mutate()}
            busy={startMining.isPending || pauseMining.isPending}
          />
          <FundingPanel state={state} />
          <WalletPanel state={state} />
          <ActivityPanel state={state} />
        </div>
      )}

      {isSignedIn && (
        <button className="ghost logout" onClick={() => logout.mutate()} disabled={logout.isPending}>
          <Power size={16} />
          Sign out
        </button>
      )}
    </main>
  );
}

function Panel(props: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-title">
        {props.icon}
        <h2>{props.title}</h2>
      </div>
      {props.children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
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
    <Panel title="Mine" icon={<Pickaxe size={18} />}>
      <div className="rig-box">
        <Bot size={28} />
        <div>
          <strong>Hosted APoW agent</strong>
          <span>{props.state.wallet?.address}</span>
        </div>
      </div>
      <div className="rule-box">
        <strong>Rig rule</strong>
        <span>
          You may mint multiple mining rigs into this wallet, but APoW mines with exactly one active rig. The app defaults to the rig with the best hashpower multiplier.
        </span>
      </div>
      <div className="capability">
        <ShieldCheck size={16} />
        {props.supportsBatching ? "Base Account batching available for funding UX" : "Single-transaction fallback active"}
      </div>
      <button className={active ? "secondary" : "primary"} onClick={active ? props.pauseMining : props.startMining} disabled={props.busy}>
        {props.busy ? <Loader2 className="spin" size={16} /> : active ? <CirclePause size={16} /> : <Play size={16} />}
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
    <Panel title="Add budget" icon={<ArrowDownToLine size={18} />}>
      <div className="segmented">
        {sourceAssets.map((asset) => (
          <button key={asset} className={sourceAsset === asset ? "selected" : ""} onClick={() => setSourceAsset(asset)}>
            {sourceAssetLabel(asset)}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Amount</span>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
      </label>
      <button className="primary" onClick={() => createIntent.mutate()} disabled={createIntent.isPending || waitEth.isLoading || waitUsdc.isLoading}>
        {createIntent.isPending ? <Loader2 className="spin" size={16} /> : <ArrowDownToLine size={16} />}
        {sourceAsset === "BASE_USDC" ? "Pay with Base Pay" : sourceAsset === "BASE_ETH" ? "Deposit ETH" : "Create Solana route"}
      </button>
      {sourceAsset === "BASE_USDC" && (
        <button className="ghost" onClick={() => directUsdc.mutate()} disabled={directUsdc.isPending}>
          <ArrowDownToLine size={16} />
          Direct USDC transfer
        </button>
      )}
      {sourceAsset.startsWith("SOLANA") && (
        <p className="muted">The API records the Solana route request now; bridge quoting is the next wired backend step.</p>
      )}
      {createIntent.error && <ErrorText error={createIntent.error} />}
      {directUsdc.error && <ErrorText error={directUsdc.error} />}
      <p className="muted">Deposit target: {state.wallet?.address}</p>
    </Panel>
  );
}

function SeedBackupPanel(props: {
  generated: GeneratedMiningWallet;
  confirm: () => void;
  busy: boolean;
}) {
  return (
    <section className="panel seed-panel">
      <div className="panel-title">
        <KeyRound size={18} />
        <h2>Back up seed phrase</h2>
      </div>
      <p className="warning">
        This is shown once. APoW does not store this seed phrase or private key. If it is lost, APoW cannot export or recover this mining wallet.
      </p>
      <div className="seed-grid">
        {props.generated.mnemonic.split(" ").map((word, index) => (
          <div className="seed-word" key={`${word}-${index}`}>
            <span>{index + 1}</span>
            <strong>{word}</strong>
          </div>
        ))}
      </div>
      <p className="muted">Wallet: {props.generated.address}</p>
      <button className="primary" onClick={props.confirm} disabled={props.busy}>
        {props.busy ? <Loader2 className="spin" size={16} /> : <ShieldCheck size={16} />}
        I backed it up
      </button>
    </section>
  );
}

function WalletPanel({ state }: { state: DashboardState }) {
  const queryClient = useQueryClient();
  const pauseWallet = useMutation({
    mutationFn: state.wallet?.paused ? api.resumeWallet : api.pauseWallet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  });
  return (
    <Panel title="Agent wallet" icon={<Wallet size={18} />}>
      <div className="address-row">
        <span>{state.wallet?.address}</span>
        <button className="icon" onClick={() => navigator.clipboard.writeText(state.wallet?.address ?? "")} aria-label="Copy hosted wallet address">
          <Copy size={16} />
        </button>
        <a className="icon" href={`${BASESCAN_BASE_URL}/address/${state.wallet?.address}`} target="_blank" rel="noreferrer" aria-label="Open hosted wallet on Basescan">
          <ExternalLink size={16} />
        </a>
      </div>
      <p className="muted">One hosted mining wallet is allowed per signed-in Base Account.</p>
      <button className="secondary" onClick={() => pauseWallet.mutate()} disabled={pauseWallet.isPending}>
        {state.wallet?.paused ? <Play size={16} /> : <CirclePause size={16} />}
        {state.wallet?.paused ? "Resume wallet" : "Pause wallet"}
      </button>
      <p className="muted">APoW does not store this wallet's seed phrase or private key. Back up the phrase shown at creation or this wallet cannot be exported or recovered.</p>
    </Panel>
  );
}

function ActivityPanel({ state }: { state: DashboardState }) {
  const items = state.ledger.slice(0, 8);
  return (
    <Panel title="Activity" icon={<ShieldCheck size={18} />}>
      {items.length === 0 ? (
        <p className="muted">Deposits, swaps, x402 costs, gas, minting, and mining events will appear here.</p>
      ) : (
        <div className="activity-list">
          {items.map((entry) => (
            <div className="activity" key={entry.id}>
              <div>
                <strong>{entry.description}</strong>
                <span>{entry.category} · {entry.status}</span>
              </div>
              <span>{entry.amount} {entry.asset}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ErrorText({ error }: { error: unknown }) {
  return <p className="error">{error instanceof Error ? error.message : "Something failed"}</p>;
}
