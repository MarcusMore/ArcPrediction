import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Testing Hardhat Configuration ===\n");

  // Check environment variables
  console.log("Environment Variables:");
  console.log("  ARC_TESTNET_RPC_URL:", process.env.ARC_TESTNET_RPC_URL || "not set");
  console.log("  PRIVATE_KEY:", process.env.PRIVATE_KEY ? `${process.env.PRIVATE_KEY.substring(0, 10)}...` : "not set");
  console.log("  USDC_ADDRESS:", process.env.USDC_ADDRESS || "not set");
  console.log();

  // Test network connection
  try {
    const provider = ethers.provider;
    const network = await provider.getNetwork();
    console.log("Network Info:");
    console.log("  Chain ID:", network.chainId.toString());
    console.log("  Name:", network.name);
    console.log();
  } catch (error: any) {
    console.error("❌ Network connection failed:", error.message);
    return;
  }

  // Test signers
  try {
    const signers = await ethers.getSigners();
    console.log("Signers:");
    console.log("  Count:", signers.length);
    
    if (signers.length === 0) {
      console.error("❌ No signers available!");
      console.error("\nPossible issues:");
      console.error("  1. PRIVATE_KEY not set in .env file");
      console.error("  2. PRIVATE_KEY format is invalid");
      console.error("  3. PRIVATE_KEY is set to placeholder value");
      console.error("\nPrivate key should be:");
      console.error("  - 64 hex characters (without 0x)");
      console.error("  - OR 66 characters (with 0x prefix)");
      console.error("  - Example: PRIVATE_KEY=0x1234567890abcdef...");
      return;
    }

    const deployer = signers[0];
    console.log("  Deployer Address:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("  Balance:", ethers.formatEther(balance), "USDC");
    
    if (balance === 0n) {
      console.warn("\n⚠️  Warning: Account has zero balance!");
      console.warn("Get testnet USDC from: https://faucet.circle.com");
      console.warn("Select 'Arc Testnet' as the network.");
    }
    
    console.log("\n✅ Configuration looks good!");
    console.log("You can proceed with deployment using: npm run deploy");
    
  } catch (error: any) {
    console.error("❌ Error getting signers:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  });



