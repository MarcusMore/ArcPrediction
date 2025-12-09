# Troubleshooting Guide

## Common Issues and Solutions

### "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)"

**What it is:**
This is a known Node.js/libuv bug on Windows that occurs during async handle cleanup. It's a **harmless warning** that doesn't affect functionality.

**Why it happens:**
- Node.js v24+ on Windows has issues with async handle cleanup
- Hardhat's compilation process triggers this during shutdown
- It's a libuv (Node.js's async I/O library) assertion failure

**Solutions:**

1. **Ignore it (Recommended)**
   - The error doesn't affect functionality
   - Your contracts compile successfully
   - Everything works as expected

2. **Suppress the error in scripts**
   ```bash
   # Use the quiet compile script
   npm run compile:quiet
   ```

3. **Redirect stderr (PowerShell)**
   ```powershell
   npm run compile 2>$null
   ```

4. **Use Node.js LTS version (if really bothersome)**
   - Consider downgrading to Node.js v20 LTS
   - This version is more stable on Windows
   - Use `nvm` to manage Node versions:
     ```bash
     nvm install 20
     nvm use 20
     ```

5. **Update Hardhat (if available)**
   ```bash
   npm update hardhat @nomicfoundation/hardhat-toolbox
   ```

**Status:**
- ✅ Contracts compile successfully
- ✅ TypeScript types generate correctly
- ✅ All functionality works
- ⚠️ Only a cosmetic warning

**References:**
- [Node.js Issue #49344](https://github.com/nodejs/node/issues/49344)
- [Hardhat Issue #4200](https://github.com/NomicFoundation/hardhat/issues/4200)

---

### Other Common Issues

#### "Private key too short"
- **Solution:** Make sure your `.env` file has a valid 64-character hex private key (or 66 with 0x prefix)
- The config now validates this automatically

#### "Insufficient funds"
- **Solution:** Get USDC testnet tokens from [Circle Faucet](https://faucet.circle.com)
- Select "Arc Testnet" as the network

#### "Contract not deployed"
- **Solution:** Run `npm run deploy` first
- Update `CONTRACT_ADDRESS` in `.env` after deployment

#### "Network not found"
- **Solution:** Add Arc Testnet to MetaMask manually:
  - Network Name: Arc Testnet
  - RPC URL: https://rpc.testnet.arc.network
  - Chain ID: 5042002
  - Currency: USDC
  - Explorer: https://testnet.arcscan.app



