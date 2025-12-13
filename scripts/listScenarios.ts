import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Listing All Scenarios ===\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env file");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Contract Address:", contractAddress);
  console.log("Checking account:", deployer.address);
  console.log();

  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const bettingPlatform = BettingPlatform.attach(contractAddress);

  const count = await bettingPlatform.getScenarioCount();
  console.log(`Total scenarios: ${count}\n`);

  if (Number(count) === 0) {
    console.log("✅ Contract has no scenarios - ready for fresh start!");
    return;
  }

  console.log("Existing scenarios:");
  for (let i = 1; i <= Number(count); i++) {
    try {
      const scenario = await bettingPlatform.getScenario(i);
      const [
        id, description, createdAt, bettingDeadline, resolutionDeadline,
        totalPool, yesPool, noPool, isResolved, outcome, adminFee, feeClaimed, isClosed
      ] = scenario;

      console.log(`\nScenario #${id}:`);
      console.log(`  Description: ${description}`);
      console.log(`  Total Pool: ${ethers.formatUnits(totalPool, 6)} USDC`);
      console.log(`  Is Resolved: ${isResolved}`);
      console.log(`  Is Closed: ${isClosed}`);
    } catch (error) {
      console.log(`  Error fetching scenario ${i}`);
    }
  }

  console.log("\n⚠️  Note: Scenarios cannot be deleted from the blockchain.");
  console.log("To start fresh, deploy a new contract.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  });
