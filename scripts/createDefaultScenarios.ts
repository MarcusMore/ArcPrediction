import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Creating Default Test Scenarios ===\n");

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

  // Verify we're the owner
  const owner = await bettingPlatform.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(`Current account is not the contract owner. Owner is: ${owner}`);
  }

  // Calculate deadlines
  const now = Math.floor(Date.now() / 1000);
  const oneDay = 24 * 60 * 60;
  const oneWeek = 7 * oneDay;
  const twoWeeks = 14 * oneDay;
  const oneMonth = 30 * oneDay;

  // Define test scenarios
  const scenarios = [
    {
      description: "Will Bitcoin reach $100k by Q4 2024?",
      bettingDays: 7,
      resolutionDays: 1,
    },
    {
      description: "Will Ethereum reach $5000 by end of 2024?",
      bettingDays: 7,
      resolutionDays: 1,
    },
    {
      description: "Will the Federal Reserve cut interest rates in March 2024?",
      bettingDays: 14,
      resolutionDays: 1,
    },
    {
      description: "Will SpaceX Starship complete a successful orbital flight in 2024?",
      bettingDays: 30,
      resolutionDays: 7,
    },
    {
      description: "Will the LA Lakers win the 2024 NBA Championship?",
      bettingDays: 60,
      resolutionDays: 7,
    },
    {
      description: "Will AI-generated content be regulated by US Congress in 2024?",
      bettingDays: 45,
      resolutionDays: 7,
    },
    {
      description: "Will the S&P 500 close above 6000 points in 2024?",
      bettingDays: 30,
      resolutionDays: 1,
    },
    {
      description: "Will a major cryptocurrency exchange be hacked in 2024?",
      bettingDays: 90,
      resolutionDays: 7,
    },
  ];

  console.log(`Creating ${scenarios.length} test scenarios...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const bettingDeadline = now + scenario.bettingDays * oneDay;
    const resolutionDeadline = bettingDeadline + scenario.resolutionDays * oneDay;

    try {
      console.log(`[${i + 1}/${scenarios.length}] Creating: "${scenario.description}"`);
      console.log(`  Betting deadline: ${new Date(bettingDeadline * 1000).toLocaleString()}`);
      console.log(`  Resolution deadline: ${new Date(resolutionDeadline * 1000).toLocaleString()}`);

      const tx = await bettingPlatform.createScenario(
        scenario.description,
        bettingDeadline,
        resolutionDeadline
      );

      console.log(`  Transaction: ${tx.hash}`);
      await tx.wait();
      console.log(`  ✅ Created successfully!\n`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}\n`);
      failCount++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`✅ Successfully created: ${successCount} scenarios`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} scenarios`);
  }
  console.log(`\nTotal scenarios on contract: ${await bettingPlatform.getScenarioCount()}`);
  console.log("\nYou can now view and bet on these scenarios in the frontend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to create scenarios:");
    console.error(error);
    process.exit(1);
  });
