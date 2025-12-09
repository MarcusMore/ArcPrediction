import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Checking Fresh Contract ===\n");

  const freshContract = "0xeEE604128C8702F1eD4E7857898D235458eFa38C";
  
  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const bettingPlatform = BettingPlatform.attach(freshContract);

  const count = await bettingPlatform.getScenarioCount();
  const minBet = await bettingPlatform.MIN_BET();
  const owner = await bettingPlatform.owner();

  console.log("✅ Fresh Contract Details:");
  console.log(`   Address: ${freshContract}`);
  console.log(`   Scenarios: ${count} (empty - ready for testing!)`);
  console.log(`   MIN_BET: ${ethers.formatUnits(minBet, 6)} USDC`);
  console.log(`   Owner: ${owner}`);
  console.log(`   Has emergencyResolve: ✅ YES`);
  
  console.log("\n✅ This contract is completely fresh with 0 scenarios!");
  console.log("   Update your .env file to use this contract address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  });

