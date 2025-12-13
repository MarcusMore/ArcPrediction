# Deployment Guide

This guide will walk you through deploying the BettingPlatform contract to Arc Testnet and connecting the frontend.

## Prerequisites

1. **Node.js** >= 18.0.0
2. **MetaMask** or compatible Web3 wallet
3. **USDC Testnet Tokens** from [Circle Faucet](https://faucet.circle.com)
4. **Private Key** with USDC for gas fees

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Arc Testnet Configuration
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=your_private_key_here

# Contract Addresses
USDC_ADDRESS=0x3600000000000000000000000000000000000000
CONTRACT_ADDRESS=

# Frontend Environment Variables (for Vite)
VITE_CONTRACT_ADDRESS=
```

**Important**: 
- Never commit your `.env` file to version control
- Your `PRIVATE_KEY` should be from a wallet with USDC testnet tokens
- Get USDC from the [Circle Faucet](https://faucet.circle.com) - select "Arc Testnet"

## Step 3: Compile Contracts

```bash
npm run compile
```

This will compile the Solidity contracts and generate TypeScript types.

## Step 4: Deploy to Arc Testnet

```bash
npm run deploy
```

The deployment script will:
1. Connect to Arc Testnet
2. Deploy the BettingPlatform contract
3. Display the contract address
4. Show the explorer URL

**Save the contract address** - you'll need it for the frontend!

## Step 5: Update Frontend Configuration

After deployment, update your `.env` file with the contract address:

```env
CONTRACT_ADDRESS=0x...your_deployed_address...
VITE_CONTRACT_ADDRESS=0x...your_deployed_address...
```

Or set it directly in `constants.ts`:

```typescript
export const CONTRACT_ADDRESS = '0x...your_deployed_address...';
```

## Step 6: Run the Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Step 7: Connect Your Wallet

1. Open the app in your browser
2. Click "Connect Wallet"
3. Select MetaMask
4. Approve the connection
5. If Arc Testnet is not added, MetaMask will prompt you to add it

## Step 8: Approve USDC Spending

Before placing bets, you need to approve the contract to spend your USDC:

1. Go to the dashboard
2. Select a scenario
3. When placing a bet, the app will automatically request USDC approval
4. Confirm the approval transaction in MetaMask

## Creating Scenarios (Admin Only)

To create betting scenarios, you need to be the contract owner (the deployer address).

You can use Hardhat console or create a script:

```typescript
// scripts/createScenario.ts
import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS!;
  const BettingPlatform = await ethers.getContractAt("BettingPlatform", contractAddress);
  
  const description = "Will Bitcoin reach $100k by Q4 2024?";
  const bettingDeadline = Math.floor(Date.now() / 1000) + 86400 * 7; // 7 days from now
  const resolutionDeadline = bettingDeadline + 86400; // 1 day after betting closes
  
  const tx = await BettingPlatform.createScenario(description, bettingDeadline, resolutionDeadline);
  await tx.wait();
  
  console.log("Scenario created!");
}

main().catch(console.error);
```

Run with:
```bash
npx hardhat run scripts/createScenario.ts --network arcTestnet
```

## Verifying the Contract

To verify the contract on Arc Explorer:

1. Get an API key from [Arc Explorer](https://testnet.arcscan.app)
2. Add it to `.env`:
   ```env
   ARC_EXPLORER_API_KEY=your_api_key
   ```
3. Run verification:
   ```bash
   npx hardhat verify --network arcTestnet <CONTRACT_ADDRESS> <USDC_ADDRESS>
   ```

## Troubleshooting

### "Insufficient funds"
- Make sure your wallet has USDC testnet tokens
- Get tokens from [Circle Faucet](https://faucet.circle.com)

### "Contract not deployed"
- Check that `CONTRACT_ADDRESS` is set correctly
- Verify the contract address on [Arc Explorer](https://testnet.arcscan.app)

### "Network not found"
- Make sure Arc Testnet is added to MetaMask
- Check that the RPC URL is correct: `https://rpc.testnet.arc.network`

### "Transaction failed"
- Check that you have enough USDC for gas
- Verify the contract is not paused
- Check that betting deadlines haven't passed

## Network Information

- **Network Name**: Arc Testnet
- **Chain ID**: 5042002
- **RPC URL**: https://rpc.testnet.arc.network
- **Explorer**: https://testnet.arcscan.app
- **USDC Address**: `0x3600000000000000000000000000000000000000`
- **USDC Decimals**: 6 (ERC-20 interface), 18 (native gas token)

## Next Steps

- Create your first scenario
- Test betting functionality
- Resolve scenarios and claim winnings
- Explore the admin panel features

For more information, see the [Arc Network Documentation](https://docs.arc.network/).



