import { Attribution } from "ox/erc8021";

export const APP_NAME = "APoW Cloud Mining";
export const BUILDER_CODE = "bc_6wfeb1kd";
export const BUILDER_DATA_SUFFIX = Attribution.toDataSuffix({
  codes: [BUILDER_CODE],
});

export const BASE_CHAIN_ID = 8453;

export const CONTRACTS = {
  agentCoin: "0x12577CF0D8a07363224D6909c54C056A183e13b3",
  miningAgent: "0xB7caD3ca5F2BD8aEC2Eb67d6E8D448099B3bC03D",
  lpVault: "0xDD47511d060eA4E955B95F6f43553414328648a6",
  baseUsdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  baseWeth: "0x4200000000000000000000000000000000000006",
  uniswapSwapRouter: "0x2626664c2603336E57B271c5C0b26F421741e481",
} as const;

export const BASESCAN_BASE_URL = "https://basescan.org";
export const MIN_STARTUP_USDC = "2.00";
export const MIN_ETH_RESERVE = "0.003";
export const DEFAULT_DERIVATION_PATH = "m/44'/60'/0'/0/0";
export const UNISWAP_V3_ETH_USDC_FEE_TIER = 500;
export const SWAP_SLIPPAGE_BPS = 200;

export const erc20Abi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
