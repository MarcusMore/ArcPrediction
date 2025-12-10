import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Verifying All Contract Functions ===\n");

  const contractAddress = process.env.CONTRACT_ADDRESS || process.env.VITE_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS or VITE_CONTRACT_ADDRESS not set in .env file");
  }

  console.log("Contract Address:", contractAddress);
  
  const [deployer] = await ethers.getSigners();
  console.log("Checking with account:", deployer.address);
  console.log();
  
  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const contract = BettingPlatform.attach(contractAddress);

  // List of functions that should exist
  const requiredFunctions = [
    // Admin functions
    { name: 'addAdmin', type: 'function', params: ['address'] },
    { name: 'removeAdmin', type: 'function', params: ['address'] },
    { name: 'getAllAdmins', type: 'view', params: [] },
    { name: 'isAdmin', type: 'view', params: ['address'] },
    
    // Scenario functions
    { name: 'createScenario', type: 'function', params: ['string', 'uint256', 'uint256'] },
    { name: 'getScenario', type: 'view', params: ['uint256'] },
    { name: 'getScenarioCount', type: 'view', params: [] },
    { name: 'scenarioBettors', type: 'view', params: ['uint256'] },
    
    // Betting functions
    { name: 'placeBet', type: 'function', params: ['uint256', 'uint256', 'bool'] },
    { name: 'getUserBet', type: 'view', params: ['address', 'uint256'] },
    
    // Resolution functions
    { name: 'closeBetting', type: 'function', params: ['uint256'] },
    { name: 'resolveScenario', type: 'function', params: ['uint256', 'bool'] },
    { name: 'emergencyResolve', type: 'function', params: ['uint256', 'bool'] },
    
    // Claim functions
    { name: 'claimWinnings', type: 'function', params: ['uint256'] },
    { name: 'claimAdminFee', type: 'function', params: ['uint256'] },
    
    // Owner functions
    { name: 'owner', type: 'view', params: [] },
    { name: 'pause', type: 'function', params: [] },
    { name: 'unpause', type: 'function', params: [] },
    { name: 'paused', type: 'view', params: [] },
    
    // Constants
    { name: 'MIN_BET', type: 'view', params: [] },
    { name: 'MAX_BET', type: 'view', params: [] },
    { name: 'ADMIN_FEE_PERCENT', type: 'view', params: [] },
  ];

  console.log("📋 Checking Required Functions:\n");
  
  const results = {
    found: [] as string[],
    missing: [] as string[],
    errors: [] as { name: string; error: string }[]
  };

  for (const func of requiredFunctions) {
    try {
      // Try to get the function from the contract
      const contractFunc = (contract as any)[func.name];
      
      if (contractFunc) {
        // If it's a view function, try to call it (with dummy params if needed)
        if (func.type === 'view') {
          try {
            if (func.params.length === 0) {
              await contractFunc();
            } else if (func.name === 'isAdmin') {
              await contractFunc(deployer.address);
            } else if (func.name === 'getScenario') {
              // Try with scenario 1
              try {
                await contractFunc(1);
              } catch (e) {
                // Scenario might not exist, but function exists
              }
            } else if (func.name === 'getUserBet') {
              // Try with deployer and scenario 1
              try {
                await contractFunc(deployer.address, 1);
              } catch (e) {
                // Bet might not exist, but function exists
              }
            } else if (func.name === 'scenarioBettors') {
              // Try with scenario 1
              try {
                await contractFunc(1);
              } catch (e) {
                // Scenario might not exist, but function exists
              }
            }
            results.found.push(func.name);
            console.log(`✅ ${func.name} - EXISTS`);
          } catch (error: any) {
            // Function exists but call failed (might be expected)
            if (error.message.includes('not found') || error.message.includes('does not exist')) {
              results.missing.push(func.name);
              console.log(`❌ ${func.name} - NOT FOUND`);
            } else {
              results.found.push(func.name);
              console.log(`✅ ${func.name} - EXISTS (call failed but function exists: ${error.message.substring(0, 50)})`);
            }
          }
        } else {
          // For non-view functions, just check if they exist
          results.found.push(func.name);
          console.log(`✅ ${func.name} - EXISTS`);
        }
      } else {
        results.missing.push(func.name);
        console.log(`❌ ${func.name} - NOT FOUND`);
      }
    } catch (error: any) {
      results.errors.push({ name: func.name, error: error.message });
      console.log(`⚠️  ${func.name} - ERROR: ${error.message.substring(0, 80)}`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`✅ Found: ${results.found.length} functions`);
  console.log(`❌ Missing: ${results.missing.length} functions`);
  console.log(`⚠️  Errors: ${results.errors.length} functions`);
  
  if (results.missing.length > 0) {
    console.log("\n❌ Missing Functions:");
    results.missing.forEach(name => console.log(`   - ${name}`));
    console.log("\n💡 These functions are missing from the deployed contract.");
    console.log("   Solution: Deploy a new contract with the latest code.");
    console.log("   Run: npm run deploy");
  }
  
  if (results.errors.length > 0) {
    console.log("\n⚠️  Functions with Errors:");
    results.errors.forEach(({ name, error }) => console.log(`   - ${name}: ${error.substring(0, 60)}`));
  }
  
  // Also check contract version
  try {
    const minBet = await contract.MIN_BET();
    const minBetUsdc = ethers.formatUnits(minBet, 6);
    console.log(`\n📋 Contract Version Info:`);
    console.log(`   MIN_BET: ${minBetUsdc} USDC`);
    
    if (minBetUsdc === "1.0") {
      console.log(`   ✅ Latest version (MIN_BET = 1 USDC)`);
    } else {
      console.log(`   ⚠️  Older version (MIN_BET = ${minBetUsdc} USDC)`);
    }
  } catch (e) {
    console.log(`\n⚠️  Could not check MIN_BET`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });



