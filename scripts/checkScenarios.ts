import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS or VITE_CONTRACT_ADDRESS not set in .env file");
  }

  console.log("\n=== Checking Contract Scenarios ===\n");
  console.log("Contract Address:", contractAddress);
  
  const [deployer] = await ethers.getSigners();
  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const contract = BettingPlatform.attach(contractAddress);

  try {
    const scenarioCount = await contract.getScenarioCount();
    console.log("📊 Total Scenarios:", scenarioCount.toString());
    
    if (scenarioCount === 0n) {
      console.log("✅ Contract is clean - no scenarios exist!");
    } else {
      console.log(`⚠️  Contract has ${scenarioCount} existing scenario(s)`);
    }
    
    // Check owner
    const owner = await contract.owner();
    console.log("👤 Contract Owner:", owner);
    
    // Check MIN_BET
    const minBet = await contract.MIN_BET();
    console.log("💰 MIN_BET:", ethers.formatUnits(minBet, 6), "USDC");
    
  } catch (error: any) {
    console.error("❌ Error checking contract:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Check failed:");
    console.error(error);
    process.exit(1);
  });




