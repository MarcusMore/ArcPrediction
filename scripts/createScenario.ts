import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Creating Scenario on BettingPlatform ===\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env file");
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "USDC\n");

  // Get contract instance
  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const bettingPlatform = BettingPlatform.attach(contractAddress);

  // Example scenario parameters
  const description = process.argv[2] || "Will Bitcoin reach $100k by Q4 2024?";
  
  // Calculate deadlines (7 days for betting, 8 days for resolution)
  const now = Math.floor(Date.now() / 1000);
  const bettingDeadline = now + 7 * 24 * 60 * 60; // 7 days from now
  const resolutionDeadline = bettingDeadline + 24 * 60 * 60; // 1 day after betting closes

  console.log("Creating scenario:");
  console.log("  Description:", description);
  console.log("  Betting Deadline:", new Date(bettingDeadline * 1000).toLocaleString());
  console.log("  Resolution Deadline:", new Date(resolutionDeadline * 1000).toLocaleString());
  console.log();

  // Create scenario
  const tx = await bettingPlatform.createScenario(
    description,
    bettingDeadline,
    resolutionDeadline
  );

  console.log("Transaction sent:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Scenario created successfully!");
  console.log("Transaction hash:", receipt.hash);
  console.log("\nYou can now view and bet on this scenario in the frontend.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to create scenario:");
    console.error(error);
    process.exit(1);
  });



