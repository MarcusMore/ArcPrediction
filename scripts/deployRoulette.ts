import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🎰 Deploying Roulette contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get USDC/USDT address from environment or use default
  const PRIZE_TOKEN = process.env.USDC_ADDRESS || process.env.USDT_ADDRESS || "0x3600000000000000000000000000000000000000";
  console.log("Prize token address:", PRIZE_TOKEN);

  // Spin cost (1 USDC with 6 decimals)
  const SPIN_COST = ethers.parseUnits("1", 6); // 1 USDC
  console.log("Spin cost:", ethers.formatUnits(SPIN_COST, 6), "USDC");

  // Deploy Roulette contract
  const Roulette = await ethers.getContractFactory("Roulette");
  const roulette = await Roulette.deploy(PRIZE_TOKEN, SPIN_COST);

  await roulette.waitForDeployment();
  const rouletteAddress = await roulette.getAddress();

  console.log("\n✅ Roulette deployed to:", rouletteAddress);
  console.log("\n📋 Contract Details:");
  console.log("  - Prize Token:", PRIZE_TOKEN);
  console.log("  - Spin Cost:", ethers.formatUnits(SPIN_COST, 6), "USDC");
  console.log("\n💡 Next steps:");
  console.log("  1. Add VITE_ROULETTE_CONTRACT_ADDRESS=" + rouletteAddress + " to your .env file");
  console.log("  2. Fund the prize pool using the fundPrizePool() function");
  console.log("  3. Update the frontend to use this contract address");
  
  // Verify contract on explorer (if verification is set up)
  if (process.env.ARC_EXPLORER_API_KEY) {
    console.log("\n🔍 Verifying contract on Arc Explorer...");
    try {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for contract to be indexed
      console.log("Contract verification may be available on Arc Explorer");
    } catch (error) {
      console.log("Verification skipped:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


