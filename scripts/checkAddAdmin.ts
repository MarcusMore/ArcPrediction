import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Checking if Contract has addAdmin Function ===\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  const viteContractAddress = process.env.VITE_CONTRACT_ADDRESS;
  
  console.log("CONTRACT_ADDRESS (backend):", contractAddress || "Not set");
  console.log("VITE_CONTRACT_ADDRESS (frontend):", viteContractAddress || "Not set");
  console.log();
  
  if (!contractAddress && !viteContractAddress) {
    throw new Error("Both CONTRACT_ADDRESS and VITE_CONTRACT_ADDRESS are not set in .env file");
  }
  
  if (contractAddress && viteContractAddress && contractAddress.toLowerCase() !== viteContractAddress.toLowerCase()) {
    console.log("⚠️  WARNING: CONTRACT_ADDRESS and VITE_CONTRACT_ADDRESS are different!");
    console.log("   Backend will use:", contractAddress);
    console.log("   Frontend will use:", viteContractAddress);
    console.log();
  }
  
  const addressToCheck = contractAddress || viteContractAddress;
  if (!addressToCheck) {
    throw new Error("No contract address found");
  }
  
  console.log("Checking contract:", addressToCheck);
  
  const [deployer] = await ethers.getSigners();
  console.log("Checking with account:", deployer.address);
  
  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const contract = BettingPlatform.attach(contractAddress);

  // Check if addAdmin function exists
  console.log("\n📋 Checking for addAdmin function...");
  try {
    // Try to call getAllAdmins (which should exist if addAdmin exists)
    const admins = await contract.getAllAdmins();
    console.log("✅ Contract HAS admin management functions!");
    console.log("   Current admins:", admins);
    
    // Try to check if addAdmin exists
    try {
      const owner = await contract.owner();
      console.log("   Contract owner:", owner);
      console.log("   Is deployer owner:", owner.toLowerCase() === deployer.address.toLowerCase() ? "✅ YES" : "❌ NO");
    } catch (e) {
      console.log("   ⚠️  Could not check owner");
    }
  } catch (error: any) {
    console.log("❌ Contract does NOT have admin management functions");
    console.log("   Error:", error.message);
    console.log("\n💡 Solution: Deploy a new contract with the latest code.");
    console.log("   Run: npm run deploy");
  }

  // Also check MIN_BET to verify contract version
  try {
    const minBet = await contract.MIN_BET();
    console.log("\n📋 Contract MIN_BET:", ethers.formatUnits(minBet, 6), "USDC");
    if (minBet === ethers.parseUnits("1", 6)) {
      console.log("✅ Using latest contract version (MIN_BET = 1 USDC)");
    } else {
      console.log("⚠️  Using older contract version (MIN_BET = 10 USDC)");
    }
  } catch (error: any) {
    console.log("⚠️  Could not check MIN_BET");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Check failed:");
    console.error(error);
    process.exit(1);
  });

