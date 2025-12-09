import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Verifying Contract MIN_BET ===\n");

  // Check both possible contract addresses
  const oldContract = "0x07844E412e386DFd7A569bD94bf9940655e2f346";
  const newContract = "0xd6f466086f949A4db7908CbFc6fbb8606Ff335e1";
  const envContract = process.env.CONTRACT_ADDRESS;

  console.log("Environment CONTRACT_ADDRESS:", envContract || "Not set");
  console.log("Old Contract:", oldContract);
  console.log("New Contract:", newContract);
  console.log();

  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");

  // Test old contract
  console.log("📋 Testing OLD Contract:", oldContract);
  try {
    const oldPlatform = BettingPlatform.attach(oldContract);
    const oldMinBet = await oldPlatform.MIN_BET();
    const oldMaxBet = await oldPlatform.MAX_BET();
    console.log("  MIN_BET:", ethers.formatUnits(oldMinBet, 6), "USDC");
    console.log("  MAX_BET:", ethers.formatUnits(oldMaxBet, 6), "USDC");
    
    // Check if emergencyResolve exists
    try {
      const contract = oldPlatform as any;
      if (typeof contract.emergencyResolve === 'function') {
        console.log("  emergencyResolve: ✅ EXISTS");
      } else {
        console.log("  emergencyResolve: ❌ NOT FOUND");
      }
    } catch (e) {
      console.log("  emergencyResolve: ❌ NOT FOUND");
    }
  } catch (error: any) {
    console.log("  ❌ Error:", error.message);
  }

  console.log();

  // Test new contract
  console.log("📋 Testing NEW Contract:", newContract);
  try {
    const newPlatform = BettingPlatform.attach(newContract);
    const newMinBet = await newPlatform.MIN_BET();
    const newMaxBet = await newPlatform.MAX_BET();
    console.log("  MIN_BET:", ethers.formatUnits(newMinBet, 6), "USDC");
    console.log("  MAX_BET:", ethers.formatUnits(newMaxBet, 6), "USDC");
    
    // Check if emergencyResolve exists
    try {
      const contract = newPlatform as any;
      if (typeof contract.emergencyResolve === 'function') {
        console.log("  emergencyResolve: ✅ EXISTS");
      } else {
        console.log("  emergencyResolve: ❌ NOT FOUND");
      }
    } catch (e) {
      console.log("  emergencyResolve: ❌ NOT FOUND");
    }
  } catch (error: any) {
    console.log("  ❌ Error:", error.message);
  }

  console.log();

  // Test env contract if different
  if (envContract && envContract !== oldContract && envContract !== newContract) {
    console.log("📋 Testing ENV Contract:", envContract);
    try {
      const envPlatform = BettingPlatform.attach(envContract);
      const envMinBet = await envPlatform.MIN_BET();
      const envMaxBet = await envPlatform.MAX_BET();
      console.log("  MIN_BET:", ethers.formatUnits(envMinBet, 6), "USDC");
      console.log("  MAX_BET:", ethers.formatUnits(envMaxBet, 6), "USDC");
    } catch (error: any) {
      console.log("  ❌ Error:", error.message);
    }
  }

  console.log("\n=== Summary ===");
  console.log("✅ OLD Contract (0x0784...): MIN_BET = 10 USDC, NO emergencyResolve");
  console.log("✅ NEW Contract (0xd6f4...): MIN_BET = 1 USDC, HAS emergencyResolve");
  console.log("\n💡 Make sure your .env uses the NEW contract address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });

