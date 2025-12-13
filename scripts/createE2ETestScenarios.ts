import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 CREATING E2E TEST SCENARIOS");
  console.log("=".repeat(60) + "\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env file");
  }

  const [signer] = await ethers.getSigners();
  console.log("👤 Admin Account:", signer.address);
  console.log("📋 Contract Address:", contractAddress);
  console.log("");

  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const contract = BettingPlatform.attach(contractAddress);

  // Check if user is admin
  const owner = await contract.owner();
  const isAdmin = await contract.isAdmin(signer.address);
  
  if (signer.address.toLowerCase() !== owner.toLowerCase() && !isAdmin) {
    throw new Error("Current signer is not an admin. Only admins can create scenarios.");
  }

  console.log("✅ Admin access confirmed\n");

  // Get current time
  const now = Math.floor(Date.now() / 1000);
  const oneHour = 3600;
  const oneDay = 86400;
  const oneWeek = 604800;

  // Test Scenarios for E2E Testing
  const testScenarios = [
    {
      name: "Short-term Test (1 hour)",
      description: "Will Bitcoin reach $100,000 in the next hour?",
      bettingDeadline: now + oneHour,
      resolutionDeadline: now + oneHour + 300, // 5 minutes after betting closes
      purpose: "Quick test scenario for immediate testing"
    },
    {
      name: "Today Test",
      description: "Will the S&P 500 close above 5,000 today?",
      bettingDeadline: now + (oneDay - 3600), // End of day
      resolutionDeadline: now + oneDay + 3600, // Next day
      purpose: "Daily scenario test"
    },
    {
      name: "Week Test",
      description: "Will Ethereum reach $4,000 this week?",
      bettingDeadline: now + (oneWeek / 2), // Mid-week
      resolutionDeadline: now + oneWeek + 3600, // End of week
      purpose: "Weekly scenario test"
    },
    {
      name: "Long-term Test (30 days)",
      description: "Will the Federal Reserve cut interest rates in the next 30 days?",
      bettingDeadline: now + (oneDay * 7), // 7 days
      resolutionDeadline: now + (oneDay * 30), // 30 days
      purpose: "Long-term scenario test"
    },
    {
      name: "Multiple Outcomes Test",
      description: "Will Apple stock price increase by 5% this month?",
      bettingDeadline: now + (oneDay * 3), // 3 days
      resolutionDeadline: now + (oneDay * 30), // 30 days
      purpose: "Test multiple bet outcomes"
    },
    {
      name: "High Volume Test",
      description: "Will Tesla stock reach $300 by end of quarter?",
      bettingDeadline: now + (oneDay * 14), // 2 weeks
      resolutionDeadline: now + (oneDay * 90), // 3 months
      purpose: "Test high betting volume scenario"
    },
    {
      name: "Crypto Test",
      description: "Will Solana (SOL) reach $200 in the next 7 days?",
      bettingDeadline: now + (oneDay * 3), // 3 days
      resolutionDeadline: now + (oneDay * 7) + 3600, // 7 days
      purpose: "Crypto market test"
    },
    {
      name: "Sports Test",
      description: "Will the Lakers win their next game?",
      bettingDeadline: now + (oneDay * 2), // 2 days
      resolutionDeadline: now + (oneDay * 3) + 3600, // 3 days
      purpose: "Sports betting test"
    },
    {
      name: "Politics Test",
      description: "Will there be a government shutdown this month?",
      bettingDeadline: now + (oneDay * 7), // 7 days
      resolutionDeadline: now + (oneDay * 30), // 30 days
      purpose: "Political event test"
    },
    {
      name: "Tech Test",
      description: "Will OpenAI release GPT-5 this quarter?",
      bettingDeadline: now + (oneDay * 14), // 2 weeks
      resolutionDeadline: now + (oneDay * 90), // 3 months
      purpose: "Technology event test"
    }
  ];

  console.log(`📝 Creating ${testScenarios.length} test scenarios...\n`);

  let created = 0;
  let failed = 0;

  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    try {
      console.log(`Creating scenario ${i + 1}/${testScenarios.length}: ${scenario.name}`);
      
      const tx = await contract.createScenario(
        scenario.description,
        scenario.bettingDeadline,
        scenario.resolutionDeadline
      );
      
      console.log(`   Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`   ✅ Created successfully!`);
      console.log(`   Purpose: ${scenario.purpose}`);
      console.log(`   Betting Deadline: ${new Date(scenario.bettingDeadline * 1000).toLocaleString()}`);
      console.log(`   Resolution Deadline: ${new Date(scenario.resolutionDeadline * 1000).toLocaleString()}`);
      console.log("");
      
      created++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`);
      failed++;
    }
  }

  console.log("=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Created: ${created}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((created / testScenarios.length) * 100).toFixed(2)}%`);
  console.log("");

  if (created > 0) {
    const totalScenarios = await contract.getScenarioCount();
    console.log(`📋 Total scenarios on contract: ${totalScenarios}`);
    console.log("");
    console.log("💡 Next steps for E2E testing:");
    console.log("   1. Place bets on different scenarios");
    console.log("   2. Test betting deadline enforcement");
    console.log("   3. Test scenario resolution");
    console.log("   4. Test winnings claiming");
    console.log("   5. Test admin fee claiming");
    console.log("   6. Test emergency resolve (for past deadlines)");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to create test scenarios:");
    console.error(error);
    process.exit(1);
  });

