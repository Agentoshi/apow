import { baseAccount, injected } from "wagmi/connectors";
import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { base } from "wagmi/chains";
import { APP_NAME, BUILDER_DATA_SUFFIX } from "../../shared/constants";

const baseRpcUrl = import.meta.env.VITE_BASE_RPC_URL as string | undefined;

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    baseAccount({ appName: APP_NAME }),
    injected(),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: baseRpcUrl ? http(baseRpcUrl) : http(),
  },
  dataSuffix: BUILDER_DATA_SUFFIX,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
