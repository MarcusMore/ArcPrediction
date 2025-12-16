# 🎰 Roulette Feature Guide

## Overview

The Roulette feature allows users to spin a wheel and win prizes from a prize pool. The system uses weighted probabilities where higher prizes have lower chances of winning.

## Smart Contract

### Contract: `Roulette.sol`

**Location:** `contracts/Roulette.sol`

**Features:**
- Prize pool funded by owner/admin
- Weighted probability system for different prize tiers
- Configurable spin cost
- Support for any ERC-20 token (USDT/USDC)
- Pausable for emergency stops
- Reentrancy protection

### Prize Tiers (Default Configuration)

| Prize | Amount (USDC) | Probability | Chance |
|-------|---------------|-------------|--------|
| Nothing | 0 | 3500 | 35% |
| Small Prize | 1 | 2500 | 25% |
| Tiny Prize | 2 | 1500 | 15% |
| Medium Prize | 5 | 1000 | 10% |
| Good Prize | 10 | 600 | 6% |
| Great Prize | 20 | 400 | 4% |
| Excellent Prize | 50 | 300 | 3% |
| Epic Prize | 75 | 140 | 1.4% |
| Legendary Prize | 100 | 60 | 0.6% |

**Total Probability:** 10000 (100%)
**Maximum Prize:** 100 USDC

## Deployment

### Prerequisites

1. Ensure you have a `.env` file with:
   ```
   ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
   PRIVATE_KEY=your_private_key_here
   USDC_ADDRESS=0x3600000000000000000000000000000000000000
   # Or USDT_ADDRESS if using USDT
   ```

### Deploy Contract

```bash
npm run deploy-roulette
```

This will:
1. Deploy the Roulette contract
2. Set the prize token (USDC/USDT)
3. Set the initial spin cost (default: 1 USDC)
4. Initialize prize tiers with default probabilities

### After Deployment

1. **Add to `.env`:**
   ```
   VITE_ROULETTE_CONTRACT_ADDRESS=0x...your_contract_address
   ```

2. **Fund the Prize Pool:**
   - Connect as owner/admin
   - Go to Roulette tab
   - Use the "Fund Prize Pool" section
   - Or call `fundPrizePool(amount)` directly on the contract

## Frontend Integration

### Component: `RoulettePanel.tsx`

**Location:** `components/Roulette/RoulettePanel.tsx`

**Features:**
- Animated roulette wheel
- Real-time prize pool display
- Prize tier list with probabilities
- Spin functionality
- Result modal
- Admin funding panel
- Statistics display

### Navigation

The Roulette tab is available in:
- Desktop sidebar (Sparkles icon)
- Mobile bottom navigation

### Usage

1. **For Users:**
   - Navigate to Roulette tab
   - Ensure you have enough USDC/USDT for spin cost
   - Click "Spin" button
   - Wait for animation
   - View result (prize won or nothing)

2. **For Admins:**
   - Navigate to Roulette tab
   - Use "Fund Prize Pool" section
   - Enter amount to add
   - Click "Fund Pool"
   - Approve token transfer if needed

## Contract Functions

### User Functions

- `spin()` - Spin the roulette wheel (pays spin cost)

### Admin/Owner Functions

- `fundPrizePool(uint256 amount)` - Add tokens to prize pool
- `setSpinCost(uint256 newCost)` - Update spin cost
- `updatePrizeTier(...)` - Modify prize tier configuration
- `withdrawPrizePool(uint256 amount)` - Emergency withdrawal
- `pause()` / `unpause()` - Emergency controls

### View Functions

- `getPrizePool()` - Get current prize pool balance
- `getSpinCost()` - Get current spin cost
- `getAllPrizeTiers()` - Get all prize tiers
- `totalSpins()` - Get total number of spins
- `totalPrizesWon()` - Get total prizes won count
- `totalPrizeAmount()` - Get total amount of prizes paid

## Service Functions

**Location:** `services/rouletteService.ts`

- `setRouletteContractAddress(address)` - Set contract address
- `getPrizePool()` - Get prize pool balance
- `getSpinCost()` - Get spin cost
- `getAllPrizeTiers()` - Get all prize tiers
- `spin()` - Execute spin and return result
- `fundPrizePool(amount)` - Fund prize pool (admin)
- `getRouletteStats()` - Get statistics

## Configuration

### Changing Prize Tiers

Only the contract owner can modify prize tiers. Use `updatePrizeTier()`:

```solidity
updatePrizeTier(
    tierIndex,      // Index of tier to update
    amount,         // New prize amount (in token units)
    probability,   // New probability (in basis points)
    name           // New tier name
)
```

**Important:** Probabilities must always sum to 10000 (100%).

### Changing Spin Cost

```solidity
setSpinCost(newCost) // New cost in token units
```

## Security Features

1. **ReentrancyGuard** - Prevents reentrancy attacks
2. **Pausable** - Can pause contract in emergencies
3. **Ownable** - Only owner can modify settings
4. **Input Validation** - All inputs are validated
5. **Probability Validation** - Ensures probabilities sum to 100%

## Events

- `PrizePoolFunded(address indexed funder, uint256 amount)`
- `SpinExecuted(address indexed player, uint256 spinResult, uint256 prizeWon, string prizeName)`
- `PrizeTierUpdated(...)`
- `SpinCostUpdated(uint256 newCost)`

## Notes

- The contract uses block data for randomness (not cryptographically secure, but sufficient for gaming)
- Prize pool must be funded before users can win prizes
- Users pay spin cost even if they win nothing
- Higher prizes have exponentially lower probabilities
- Contract supports any ERC-20 token (configured at deployment)

## Troubleshooting

**Issue:** "Roulette contract address not set"
- **Solution:** Add `VITE_ROULETTE_CONTRACT_ADDRESS` to your `.env` file

**Issue:** "Insufficient prize pool"
- **Solution:** Fund the prize pool using the admin panel

**Issue:** "Spin cost transfer failed"
- **Solution:** Approve the contract to spend your tokens first

**Issue:** "Probabilities must sum to 10000"
- **Solution:** When updating prize tiers, ensure all probabilities sum to exactly 10000

