import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Deploying BettingPlatform to Arc Testnet ===\n");

  // Get deployer account
  const signers = await ethers.getSigners();
  
  if (signers.length === 0) {
    throw new Error(
      "No signers available. Please set a valid PRIVATE_KEY in your .env file.\n" +
      "The private key should be a 64-character hex string (32 bytes).\n" +
      "Example: PRIVATE_KEY=0x1234567890abcdef..."
    );
  }

  const deployer = signers[0];
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "USDC\n");
  
  // Check if balance is sufficient (at least 0.001 USDC for gas)
  if (balance < ethers.parseEther("0.001")) {
    console.warn("⚠️  Warning: Low balance. You may need USDC for gas fees.");
    console.warn("Get testnet USDC from: https://faucet.circle.com\n");
  }

  // USDC address on Arc Testnet (ERC-20 interface)
  // From: https://docs.arc.network/arc/references/contract-addresses
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
  console.log("USDC Token Address:", USDC_ADDRESS);

  // Deploy BettingPlatform
  console.log("\nDeploying BettingPlatform...");
  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const bettingPlatform = await BettingPlatform.deploy(USDC_ADDRESS);

  await bettingPlatform.waitForDeployment();
  const contractAddress = await bettingPlatform.getAddress();

  console.log("\n✅ BettingPlatform deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("Deployer Address:", deployer.address);
  console.log("Network: Arc Testnet (Chain ID: 5042002)");
  console.log("\nExplorer URL: https://testnet.arcscan.app/address/" + contractAddress);

  // Save deployment info
  console.log("\n=== Deployment Summary ===");
  console.log("CONTRACT_ADDRESS=" + contractAddress);
  console.log("USDC_ADDRESS=" + USDC_ADDRESS);
  console.log("DEPLOYER_ADDRESS=" + deployer.address);
  console.log("\nPlease update your .env file with these values.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

