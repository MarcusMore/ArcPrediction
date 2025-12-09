import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Adding Owner as Admin ===\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env file");
  }

  // Get contract instance
  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const bettingPlatform = BettingPlatform.attach(contractAddress);

  // Get current owner
  const [signer] = await ethers.getSigners();
  const contractOwner = await bettingPlatform.owner();
  
  console.log("Current signer:", signer.address);
  console.log("Contract owner:", contractOwner);
  console.log("Contract address:", contractAddress);
  console.log();

  // Check if signer is the owner
  if (signer.address.toLowerCase() !== contractOwner.toLowerCase()) {
    throw new Error(
      `Current signer (${signer.address}) is not the contract owner.\n` +
      `Contract owner is: ${contractOwner}\n` +
      `Please use the owner's private key in .env file.`
    );
  }

  // Check if owner is already an admin
  const isAlreadyAdmin = await bettingPlatform.isAdmin(contractOwner);
  if (isAlreadyAdmin) {
    console.log("✅ The owner is already an admin!");
    return;
  }

  console.log("Adding owner as admin...");
  
  // Add owner as admin
  const tx = await bettingPlatform.addAdmin(contractOwner);
  console.log("Transaction sent:", tx.hash);
  console.log("Waiting for confirmation...");
  
  const receipt = await tx.wait();
  console.log("✅ Owner added as admin successfully!");
  console.log("Transaction hash:", receipt.hash);
  
  // Verify
  const isAdminNow = await bettingPlatform.isAdmin(contractOwner);
  if (isAdminNow) {
    console.log("\n✅ Verification successful! The owner is now an admin.");
  } else {
    console.log("\n⚠️  Warning: Admin status may not have been set correctly.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Failed to add owner as admin:");
    console.error(error);
    process.exit(1);
  });

