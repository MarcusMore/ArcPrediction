import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=== Checking Admin Status ===\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env file");
  }

  const walletToCheck = "0x06719b8e90900044bcA8addb93d225C260201a9c";

  console.log("Contract address:", contractAddress);
  console.log("Wallet to check:", walletToCheck);
  console.log();

  // Get contract instance
  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const bettingPlatform = BettingPlatform.attach(contractAddress);

  // Check owner
  const owner = await bettingPlatform.owner();
  console.log("Contract owner:", owner);
  console.log("Is wallet the owner?", owner.toLowerCase() === walletToCheck.toLowerCase());
  console.log();

  // Check admin status
  try {
    const isAdmin = await bettingPlatform.isAdmin(walletToCheck);
    console.log("Has ADMIN_ROLE?", isAdmin);
  } catch (error: any) {
    console.log("Error checking ADMIN_ROLE:", error.message);
  }

  // Check all admins
  try {
    const allAdmins = await bettingPlatform.getAllAdmins();
    console.log("All admins:", allAdmins);
    console.log("Wallet in admin list?", allAdmins.some(a => a.toLowerCase() === walletToCheck.toLowerCase()));
  } catch (error: any) {
    console.log("Error getting all admins:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:");
    console.error(error);
    process.exit(1);
  });

