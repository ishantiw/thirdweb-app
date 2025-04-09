import { defineChain } from "thirdweb/chains";

export const lisk = defineChain({
  id: 1135,
  name: "Lisk",
  rpc: "https://rpc.lisk.com",
  blockExplorers: [
    {
      name: "Lisk BlockScout",
      url: "https://blockscout.lisk.com/",
    },
  ],
  chainId: 1135,
  slug: "lisk",
});

export const liskSepolia = defineChain({
  id: 4202,
  name: "Lisk Sepolia Testnet",
  rpc: "https://rpc.sepolia-api.lisk.com",
  blockExplorers: [
    {
      name: "Lisk Sepolia BlockScout",
      url: "https://sepolia-blockscout.lisk.com/",
    },
  ],
  chainId: 4202,
  slug: "lisk",
});