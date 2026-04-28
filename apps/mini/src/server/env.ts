export interface Env {
  ASSETS?: Fetcher;
  DB?: D1Database;
  ENVIRONMENT?: string;
  SESSION_SECRET?: string;
  BASE_RPC_URL?: string;
  GRIND_URL?: string;
  BASE_CHAIN_ID?: string;
  BASE_PAY_TESTNET?: string;
  ENABLE_LIVE_BASE_PAY_VERIFICATION?: string;
  APOW_BUILDER_CODE?: string;
  SQUID_INTEGRATOR_ID?: string;
}

export function isProduction(env: Env): boolean {
  return env.ENVIRONMENT === "production";
}

export function requiredSecret(env: Env, key: "SESSION_SECRET"): string {
  const value = env[key];
  if (value) return value;
  if (isProduction(env)) {
    throw new Error(`${key} is required in production`);
  }
  return `apow-mini-dev-only-${key.toLowerCase()}-replace-before-production`;
}

export function basePayTestnet(env: Env): boolean {
  return env.BASE_PAY_TESTNET === "true";
}
