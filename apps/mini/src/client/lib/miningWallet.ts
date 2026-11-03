import { generateMnemonic, mnemonicToAccount } from "viem/accounts";
import { english } from "viem/accounts";
import { DEFAULT_DERIVATION_PATH } from "../../shared/constants";

export interface GeneratedMiningWallet {
  mnemonic: string;
  address: `0x${string}`;
  derivationPath: string;
}

export function generateMiningWallet(): GeneratedMiningWallet {
  const mnemonic = generateMnemonic(english, 128);
  const account = mnemonicToAccount(mnemonic, { path: DEFAULT_DERIVATION_PATH });
  return {
    mnemonic,
    address: account.address,
    derivationPath: DEFAULT_DERIVATION_PATH,
  };
}
