import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Resolving Scenario on Arc Testnet ===\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env file");
  }

  // Get scenario ID from environment variable or try to find it
  const scenarioIdArg = process.env.SCENARIO_ID;

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Please set a valid PRIVATE_KEY in your .env file.");
  }

  const deployer = signers[0];
  console.log("Using account:", deployer.address);

  // Get contract instance
  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const bettingPlatform = BettingPlatform.attach(contractAddress);

  // Get scenario count
  const scenarioCount = await bettingPlatform.getScenarioCount();
  console.log(`Total scenarios: ${scenarioCount}\n`);

  // Find scenarios that can be resolved (betting deadline has passed)
  const currentTime = Math.floor(Date.now() / 1000);
  let targetScenarioId = 0;
  let resolvableScenarios: number[] = [];

  for (let i = 1; i <= Number(scenarioCount); i++) {
    try {
      const scenario = await bettingPlatform.getScenario(i);
      const description = scenario[1].toLowerCase();
      const bettingDeadline = Number(scenario[3]);
      const isResolved = scenario[9];
      
      // Check if this scenario can be resolved
      if (!isResolved && bettingDeadline <= currentTime) {
        resolvableScenarios.push(i);
        // Prefer scenarios with "bitcoin" and "100000"
        if (description.includes("bitcoin") && 
            (description.includes("100000") || description.includes("100,000") || description.includes("100k"))) {
          targetScenarioId = i;
          console.log(`Found scenario #${i}: ${scenario[1]} (can be resolved)`);
        }
      }
    } catch (error) {
      // Scenario might not exist
    }
  }
  
  // If no specific match, use first resolvable scenario
  if (targetScenarioId === 0 && resolvableScenarios.length > 0) {
    targetScenarioId = resolvableScenarios[0];
    const scenario = await bettingPlatform.getScenario(targetScenarioId);
    console.log(`Using first resolvable scenario #${targetScenarioId}: ${scenario[1]}`);
  }
  
  // If not found, allow user to specify scenario ID via environment variable
  if (targetScenarioId === 0 && scenarioIdArg) {
    targetScenarioId = parseInt(scenarioIdArg);
    if (isNaN(targetScenarioId) || targetScenarioId < 1 || targetScenarioId > Number(scenarioCount)) {
      console.log(`❌ Invalid scenario ID: ${scenarioIdArg}`);
      process.exit(1);
    }
    const scenario = await bettingPlatform.getScenario(targetScenarioId);
    console.log(`Using scenario #${targetScenarioId}: ${scenario[1]}`);
  }

  if (targetScenarioId === 0) {
    console.log("❌ No resolvable scenarios found (betting deadline must have passed).");
    console.log("\nResolvable scenarios (deadline passed):");
    if (resolvableScenarios.length > 0) {
      for (const id of resolvableScenarios) {
        const scenario = await bettingPlatform.getScenario(id);
        console.log(`  #${id}: ${scenario[1]}`);
      }
    } else {
      console.log("  None - all scenarios have future deadlines or are already resolved.");
    }
    console.log("\n💡 Tip: You can specify a scenario ID via environment variable:");
    console.log("   $env:SCENARIO_ID=<id>; npm run resolve-scenario");
    process.exit(1);
  }

  // Check scenario status
  const scenario = await bettingPlatform.getScenario(targetScenarioId);
  const [
    id, description, createdAt, bettingDeadline, resolutionDeadline,
    totalPool, yesPool, noPool, isResolved, outcome, adminFee, feeClaimed, isClosed
  ] = scenario;

  console.log("\n=== Scenario Details ===");
  console.log(`ID: ${id}`);
  console.log(`Description: ${description}`);
  console.log(`Betting Deadline: ${new Date(Number(bettingDeadline) * 1000).toLocaleString()}`);
  console.log(`Resolution Deadline: ${new Date(Number(resolutionDeadline) * 1000).toLocaleString()}`);
  console.log(`Total Pool: ${ethers.formatUnits(totalPool, 6)} USDC`);
  console.log(`Yes Pool: ${ethers.formatUnits(yesPool, 6)} USDC`);
  console.log(`No Pool: ${ethers.formatUnits(noPool, 6)} USDC`);
  console.log(`Is Closed: ${isClosed}`);
  console.log(`Is Resolved: ${isResolved}`);

  if (isResolved) {
    console.log(`\n⚠️  Scenario is already resolved as: ${outcome ? "YES" : "NO"}`);
    process.exit(0);
  }

  // Check if betting deadline has passed
  const currentTime = Math.floor(Date.now() / 1000);
  if (Number(bettingDeadline) > currentTime && !isClosed) {
    console.log(`\n⚠️  Betting deadline has not passed yet.`);
    console.log(`Current time: ${new Date().toLocaleString()}`);
    console.log(`Betting deadline: ${new Date(Number(bettingDeadline) * 1000).toLocaleString()}`);
    console.log(`\nClosing betting first...`);
    
    // Close betting
    const closeTx = await bettingPlatform.closeBetting(targetScenarioId);
    await closeTx.wait();
    console.log("✅ Betting closed successfully!");
  } else if (isClosed) {
    console.log(`\n✅ Betting is already closed. Proceeding to resolution...`);
  }

  // Check if we can resolve (betting deadline must have passed)
  if (Number(bettingDeadline) > currentTime) {
    console.log(`\n❌ Cannot resolve: Betting deadline has not passed yet.`);
    console.log(`Current time: ${new Date().toLocaleString()}`);
    console.log(`Betting deadline: ${new Date(Number(bettingDeadline) * 1000).toLocaleString()}`);
    console.log(`\n💡 For testing, you can create a new scenario with a past deadline, or wait for the deadline to pass.`);
    process.exit(1);
  }

  // Resolve as YES (you can change this to false for NO)
  const resolveAsYes = true; // Change to false to resolve as NO
  console.log(`\nResolving scenario #${targetScenarioId} as ${resolveAsYes ? "YES" : "NO"}...`);
  
  const resolveTx = await bettingPlatform.resolveScenario(targetScenarioId, resolveAsYes);
  await resolveTx.wait();
  
  console.log("\n✅ Scenario resolved successfully!");
  console.log(`Outcome: ${resolveAsYes ? "YES" : "NO"}`);
  
  // Get updated scenario to show admin fee
  const updatedScenario = await bettingPlatform.getScenario(targetScenarioId);
  const updatedAdminFee = updatedScenario[10];
  console.log(`Admin Fee: ${ethers.formatUnits(updatedAdminFee, 6)} USDC`);
  console.log(`\nExplorer URL: https://testnet.arcscan.app/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Resolution failed:");
    console.error(error);
    process.exit(1);
  });

