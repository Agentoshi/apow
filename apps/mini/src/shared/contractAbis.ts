export const miningAgentAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenOfOwnerByIndex",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "rarity",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "hashpower",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint16" }],
  },
  {
    type: "function",
    name: "getMintPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getChallenge",
    stateMutability: "nonpayable",
    inputs: [{ name: "minter", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "targetAsciiSum", type: "uint16" },
          { name: "firstNChars", type: "uint8" },
          { name: "wordCount", type: "uint8" },
          { name: "charPosition", type: "uint8" },
          { name: "charValue", type: "uint8" },
          { name: "totalLength", type: "uint16" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "challengeSeeds",
    stateMutability: "view",
    inputs: [{ name: "minter", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [{ name: "solution", type: "string" }],
    outputs: [],
  },
] as const;

export const agentCoinAbi = [
  {
    type: "function",
    name: "getMiningChallenge",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "challenge", type: "bytes32" },
      { name: "target", type: "uint256" },
      {
        name: "smhl",
        type: "tuple",
        components: [
          { name: "targetAsciiSum", type: "uint16" },
          { name: "firstNChars", type: "uint8" },
          { name: "wordCount", type: "uint8" },
          { name: "charPosition", type: "uint8" },
          { name: "charValue", type: "uint8" },
          { name: "totalLength", type: "uint16" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "mine",
    stateMutability: "nonpayable",
    inputs: [
      { name: "nonce", type: "uint256" },
      { name: "smhlSolution", type: "string" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "tokenEarnings",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalMines",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalMinted",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MINEABLE_SUPPLY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "ERA_INTERVAL",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "lastMineBlockNumber",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const swapRouterAbi = [
  {
    type: "function",
    name: "exactInputSingle",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
  {
    type: "function",
    name: "multicall",
    stateMutability: "payable",
    inputs: [
      { name: "deadline", type: "uint256" },
      { name: "data", type: "bytes[]" },
    ],
    outputs: [{ name: "results", type: "bytes[]" }],
  },
  {
    type: "function",
    name: "unwrapWETH9",
    stateMutability: "payable",
    inputs: [
      { name: "amountMinimum", type: "uint256" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
  },
] as const;
