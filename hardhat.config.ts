import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// Helper function to validate private key
function isValidPrivateKey(key: string | undefined): boolean {
  if (!key || key === "your_private_key_here") return false;
  // Private keys should be 64 hex characters (32 bytes) or 66 with 0x prefix
  const cleanKey = key.startsWith("0x") ? key.slice(2) : key;
  return cleanKey.length === 64 && /^[0-9a-fA-F]+$/.test(cleanKey);
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR-based optimizer for complex contracts
    },
  },
  networks: {
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: isValidPrivateKey(process.env.PRIVATE_KEY)
        ? [process.env.PRIVATE_KEY!]
        : [],
      gasPrice: "auto",
      timeout: 120000,
    },
  },
  etherscan: {
    apiKey: {
      arcTestnet: process.env.ARC_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "arcTestnet",
        chainId: 5042002,
        urls: {
          apiURL: "https://api.testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;

