import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Transferring BettingPlatform Ownership ===\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env file");
  }

  // Get new owner address from environment variable or command line arguments
  // Hardhat passes arguments after --, so we need to check process.argv
  let newOwnerAddress = process.env.NEW_OWNER_ADDRESS;
  
  // Check for address in command line arguments (after --)
  if (!newOwnerAddress) {
    // Find the address in process.argv (it should be after the script name and network)
    const args = process.argv.slice(2); // Skip node and script path
    const addressArg = args.find(arg => arg.startsWith('0x') && arg.length === 42);
    if (addressArg) {
      newOwnerAddress = addressArg;
    }
  }
  
  if (!newOwnerAddress) {
    throw new Error(
      "Please provide the new owner address:\n" +
      "  Option 1: Set NEW_OWNER_ADDRESS in .env file\n" +
      "  Option 2: Use: $env:NEW_OWNER_ADDRESS='0x...'; npm run transfer-ownership\n" +
      "  Option 3: Use: hardhat run scripts/transferOwnership.ts --network arcTestnet -- 0x..."
    );
  }

  // Validate address format
  if (!ethers.isAddress(newOwnerAddress)) {
    throw new Error(`Invalid address format: ${newOwnerAddress}`);
  }

  // Get current owner account
  const [currentOwner] = await ethers.getSigners();
  console.log("Current owner (deployer):", currentOwner.address);
  console.log("New owner address:", newOwnerAddress);
  console.log("Contract address:", contractAddress);
  console.log();

  // Get contract instance
  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const bettingPlatform = BettingPlatform.attach(contractAddress);

  // Check current owner
  const currentContractOwner = await bettingPlatform.owner();
  console.log("Current contract owner:", currentContractOwner);
  
  if (currentContractOwner.toLowerCase() !== currentOwner.address.toLowerCase()) {
    throw new Error(
      `Current signer (${currentOwner.address}) is not the contract owner.\n` +
      `Contract owner is: ${currentContractOwner}`
    );
  }

  // Check if already the owner
  if (currentContractOwner.toLowerCase() === newOwnerAddress.toLowerCase()) {
    console.log("⚠️  This address is already the owner!");
    return;
  }

  console.log("Transferring ownership...");
  
  // Transfer ownership
  const tx = await bettingPlatform.transferOwnership(newOwnerAddress);
  console.log("Transaction sent:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Ownership transferred successfully!");
  console.log("Transaction hash:", receipt.hash);
  
  // Verify new owner
  const newContractOwner = await bettingPlatform.owner();
  console.log("New contract owner:", newContractOwner);
  
  if (newContractOwner.toLowerCase() === newOwnerAddress.toLowerCase()) {
    console.log("\n✅ Verification successful! The new address is now the contract owner.");
    console.log("\nThe new owner can now:");
    console.log("  - Create scenarios");
    console.log("  - Close betting");
    console.log("  - Resolve scenarios");
    console.log("  - Claim admin fees");
    console.log("  - Pause/unpause the contract");
  } else {
    console.log("\n⚠️  Warning: Ownership transfer may not have completed correctly.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to transfer ownership:");
    console.error(error);
    process.exit(1);
  });

