import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Testing All BettingPlatform Functionalities ===\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env file");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  console.log("Contract Address:", contractAddress);
  
  // Verify which contract this is
  const newContract = "0xd6f466086f949A4db7908CbFc6fbb8606Ff335e1";
  const oldContract = "0x07844E412e386DFd7A569bD94bf9940655e2f346";
  if (contractAddress.toLowerCase() === newContract.toLowerCase()) {
    console.log("✅ Using NEW contract (has emergencyResolve, MIN_BET = 1 USDC)");
  } else if (contractAddress.toLowerCase() === oldContract.toLowerCase()) {
    console.log("⚠️  Using OLD contract (may not have emergencyResolve)");
  } else {
    console.log("⚠️  Using UNKNOWN contract address - verify this is correct!");
  }
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "USDC\n");

  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const bettingPlatform = BettingPlatform.attach(contractAddress);

  // Test 1: Check contract owner
  console.log("📋 Test 1: Check Contract Owner");
  try {
    const owner = await bettingPlatform.owner();
    console.log("✅ Owner:", owner);
    console.log("   Deployer:", deployer.address);
    console.log("   Is Owner:", owner.toLowerCase() === deployer.address.toLowerCase() ? "✅ YES" : "❌ NO");
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  // Test 2: Check constants
  console.log("\n📋 Test 2: Check Contract Constants");
  try {
    const minBet = await bettingPlatform.MIN_BET();
    const maxBet = await bettingPlatform.MAX_BET();
    const adminFeePercent = await bettingPlatform.ADMIN_FEE_PERCENT();
    console.log("✅ MIN_BET:", ethers.formatUnits(minBet, 6), "USDC");
    console.log("✅ MAX_BET:", ethers.formatUnits(maxBet, 6), "USDC");
    console.log("✅ ADMIN_FEE_PERCENT:", adminFeePercent.toString(), "%");
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  // Test 3: Check if emergencyResolve exists
  console.log("\n📋 Test 3: Check emergencyResolve Function");
  try {
    // Try to get the function signature
    const contract = bettingPlatform as any;
    if (typeof contract.emergencyResolve === 'function') {
      console.log("✅ emergencyResolve function exists!");
    } else {
      console.log("❌ emergencyResolve function NOT found");
    }
  } catch (error: any) {
    console.log("❌ Error checking function:", error.message);
  }

  // Test 4: Get scenario count
  console.log("\n📋 Test 4: Get Scenario Count");
  try {
    const count = await bettingPlatform.getScenarioCount();
    console.log("✅ Total scenarios:", count.toString());
    
    if (Number(count) > 0) {
      console.log("\n📋 Existing Scenarios:");
      for (let i = 1; i <= Number(count); i++) {
        try {
          const scenario = await bettingPlatform.getScenario(i);
          const [
            id, description, createdAt, bettingDeadline, resolutionDeadline,
            totalPool, yesPool, noPool, isResolved, outcome, adminFee, feeClaimed, isClosed
          ] = scenario;
          
          const now = Math.floor(Date.now() / 1000);
          const bettingDeadlinePassed = Number(bettingDeadline) <= now;
          const resolutionDeadlinePassed = Number(resolutionDeadline) < now;
          
          console.log(`\n  Scenario #${id}:`);
          console.log(`    Description: ${description}`);
          console.log(`    Betting Deadline: ${new Date(Number(bettingDeadline) * 1000).toLocaleString()}`);
          console.log(`    Resolution Deadline: ${new Date(Number(resolutionDeadline) * 1000).toLocaleString()}`);
          console.log(`    Total Pool: ${ethers.formatUnits(totalPool, 6)} USDC`);
          console.log(`    Yes Pool: ${ethers.formatUnits(yesPool, 6)} USDC`);
          console.log(`    No Pool: ${ethers.formatUnits(noPool, 6)} USDC`);
          console.log(`    Is Closed: ${isClosed}`);
          console.log(`    Is Resolved: ${isResolved}`);
          if (isResolved) {
            console.log(`    Outcome: ${outcome ? "YES" : "NO"}`);
            console.log(`    Admin Fee: ${ethers.formatUnits(adminFee, 6)} USDC`);
            console.log(`    Fee Claimed: ${feeClaimed}`);
          }
          console.log(`    Betting Deadline Passed: ${bettingDeadlinePassed ? "✅ YES" : "❌ NO"}`);
          console.log(`    Resolution Deadline Passed: ${resolutionDeadlinePassed ? "✅ YES" : "❌ NO"}`);
          console.log(`    Can Resolve: ${bettingDeadlinePassed && !resolutionDeadlinePassed && !isResolved ? "✅ YES" : "❌ NO"}`);
          console.log(`    Can Emergency Resolve: ${bettingDeadlinePassed && resolutionDeadlinePassed && !isResolved ? "✅ YES" : "❌ NO"}`);
        } catch (error: any) {
          console.log(`  ❌ Error fetching scenario ${i}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  // Test 5: Check USDC token
  console.log("\n📋 Test 5: Check USDC Token");
  try {
    const usdcAddress = await bettingPlatform.usdcToken();
    console.log("✅ USDC Token Address:", usdcAddress);
    
    // Check USDC balance
    const USDC_ABI = [
      "function balanceOf(address account) external view returns (uint256)",
      "function decimals() external view returns (uint8)"
    ];
    const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, ethers.provider);
    const balance = await usdcContract.balanceOf(deployer.address);
    const decimals = await usdcContract.decimals();
    console.log("✅ Deployer USDC Balance:", ethers.formatUnits(balance, decimals), "USDC");
    
    const contractBalance = await usdcContract.balanceOf(contractAddress);
    console.log("✅ Contract USDC Balance:", ethers.formatUnits(contractBalance, decimals), "USDC");
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  // Test 6: Check pause status
  console.log("\n📋 Test 6: Check Pause Status");
  try {
    const paused = await bettingPlatform.paused();
    console.log("✅ Contract Paused:", paused ? "❌ YES (contract is paused)" : "✅ NO (contract is active)");
  } catch (error: any) {
    console.log("❌ Error:", error.message);
  }

  console.log("\n=== Test Summary ===");
  console.log("✅ All basic checks completed!");
  console.log("\n💡 Next steps:");
  console.log("  1. Create a test scenario with future deadlines");
  console.log("  2. Place a bet on the scenario");
  console.log("  3. Wait for betting deadline or close betting manually");
  console.log("  4. Resolve the scenario");
  console.log("  5. Claim winnings (if you bet on the winning side)");
  console.log("  6. Claim admin fee");
  console.log("\n📝 To test emergency resolve:");
  console.log("  - Create a scenario with a very short resolution deadline");
  console.log("  - Wait for resolution deadline to pass");
  console.log("  - Use emergencyResolve() function");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  });

