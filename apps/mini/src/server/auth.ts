import { createPublicClient, http, verifyMessage } from "viem";
import { base } from "viem/chains";
import { parseSiweMessage } from "viem/siwe";
import type { Env } from "./env";

export interface VerifiedSiwe {
  address: `0x${string}`;
  nonce: string;
  chainId: number;
  domain: string;
}

export async function verifySiwe(input: {
  message: string;
  signature: `0x${string}`;
  expectedNonce: string;
  env: Env;
}): Promise<VerifiedSiwe> {
  const parsed = parseSiweMessage(input.message);
  if (!parsed.address || !parsed.nonce || !parsed.chainId || !parsed.domain) {
    throw new Error("SIWE message is missing required fields");
  }
  if (parsed.nonce !== input.expectedNonce) {
    throw new Error("SIWE nonce mismatch");
  }

  let valid = false;
  if (input.env.BASE_RPC_URL) {
    const client = createPublicClient({ chain: base, transport: http(input.env.BASE_RPC_URL) });
    valid = await client.verifySiweMessage({ message: input.message, signature: input.signature });
  } else {
    valid = await verifyMessage({
      address: parsed.address,
      message: input.message,
      signature: input.signature,
    });
  }

  if (!valid) throw new Error("SIWE signature verification failed");
  return {
    address: parsed.address,
    nonce: parsed.nonce,
    chainId: parsed.chainId,
    domain: parsed.domain,
  };
}
