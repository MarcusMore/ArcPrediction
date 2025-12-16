# Forsightt - Decentralized Betting Platform

A comprehensive smart contract system for a decentralized betting platform on the Arc Testnet where users can bet USDC on yes/no scenarios posted by an admin.

## Features

### Betting Platform
- ✅ **Yes/No Scenario Betting**: Users can bet on multiple concurrent scenarios
- ✅ **USDC Native**: Uses USDC as the native gas token on Arc Testnet
- ✅ **Admin Controls**: Create scenarios, close betting, resolve outcomes, claim fees
- ✅ **Secure**: Built with OpenZeppelin's security patterns (Ownable, Pausable, ReentrancyGuard)
- ✅ **Fee System**: 1% admin fee on each resolved scenario
- ✅ **Multi-Scenario Support**: Users can participate in unlimited scenarios simultaneously
- ✅ **Closed Bets Filter**: Toggle to show/hide closed and resolved bets in dashboard and portfolio

### Roulette Game
- ✅ **Premium Roulette**: Spin to win prizes from a funded prize pool
- ✅ **Weighted Probabilities**: Higher prizes have lower chances, with possibility of winning nothing
- ✅ **Daily Spin Limit**: One free spin per day (24 hours)
- ✅ **Extra Spin**: Pay 5 USDC to spin again before cooldown expires
- ✅ **Admin Fee**: 10% of extra spin cost goes to admin, 90% to prize pool
- ✅ **Smart Prize Tiers**: Prize tiers automatically deactivate when prize pool is insufficient
- ✅ **Prize Pool Management**: When user wins "Nothing", spin cost goes to prize pool
- ✅ **Prize Tiers**: From 1 USDC to 100 USDC maximum prize

## Network Information

- **Network**: Arc Testnet
- **Chain ID**: 5042002
- **RPC URL**: https://rpc.testnet.arc.network
- **Explorer**: https://testnet.arcscan.app
- **USDC Address**: `0x3600000000000000000000000000000000000000` (ERC-20 interface, 6 decimals)
- **Faucet**: https://faucet.circle.com

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MetaMask or compatible Web3 wallet
- USDC testnet tokens (from Circle Faucet)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=your_private_key_here
USDC_ADDRESS=0x3600000000000000000000000000000000000000
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
VITE_ROULETTE_CONTRACT_ADDRESS=your_deployed_roulette_contract_address
ARC_EXPLORER_API_KEY=your_explorer_api_key_optional
```

3. Compile contracts:
```bash
npm run compile
```

4. Deploy contracts to Arc Testnet:
```bash
# Deploy main betting platform
npm run deploy

# Deploy roulette contract
npm run deploy-roulette
```

## Contract Details

### BettingPlatform Contract

#### Betting Limits
- **Minimum Bet**: 1 USDC
- **Maximum Bet**: 200 USDC
- **Admin Fee**: 1% of total pool

#### Key Functions

**Admin Functions:**
- `createScenario()`: Create a new betting scenario
- `closeBetting()`: Manually close betting (optional override)
- `resolveScenario()`: Declare outcome and calculate winnings
- `claimAdminFee()`: Claim 1% fee from resolved scenario
- `pause()` / `unpause()`: Emergency controls

**User Functions:**
- `placeBet()`: Place a bet on a scenario (YES or NO)
- `claimWinnings()`: Claim winnings from resolved scenarios

### Roulette Contract

#### Prize Tiers
- **Nothing**: 0 USDC (35% chance)
- **Small Prize**: 1 USDC (25% chance)
- **Tiny Prize**: 2 USDC (15% chance)
- **Medium Prize**: 5 USDC (10% chance)
- **Good Prize**: 10 USDC (6% chance)
- **Great Prize**: 20 USDC (4% chance)
- **Excellent Prize**: 50 USDC (3% chance)
- **Epic Prize**: 75 USDC (1.4% chance)
- **Legendary Prize**: 100 USDC (0.6% chance)

#### Spin Costs
- **Normal Spin**: 1 USDC (one per day)
- **Extra Spin**: 5 USDC (unlimited, bypasses daily limit)
  - 10% goes to admin (0.5 USDC)
  - 90% goes to prize pool (4.5 USDC)

#### Key Functions

**Admin Functions:**
- `fundPrizePool()`: Add USDC to prize pool
- `updatePrizeTier()`: Modify prize tier amounts/probabilities
- `setSpinCost()`: Change the spin cost
- `withdrawPrizePool()`: Withdraw funds from prize pool
- `pause()` / `unpause()`: Emergency controls

**User Functions:**
- `spin()`: Spin the roulette (free once per day, or pay 5 USDC for extra spin)
- `getAvailablePrizeTiers()`: Get tiers that can be paid with current pool
- `isPrizeTierAvailable()`: Check if a specific tier is available

**View Functions:**
- `getPrizePool()`: Get current prize pool balance
- `getSpinCost()`: Get current spin cost
- `canUserSpin()`: Check if user can spin (cooldown status)
- `getTimeUntilNextSpin()`: Get time remaining until next free spin

## Frontend Integration

The frontend is located in the root directory and uses:
- React + Vite
- Ethers.js for Web3 interactions
- Framer Motion for animations
- Recharts for data visualization

### Frontend Features
- **Dashboard**: View all active betting scenarios with filtering
- **Portfolio**: Track your bets, winnings, and performance
- **Roulette**: Interactive roulette game with prize wheel animation
- **Admin Panel**: Manage scenarios, resolve outcomes, claim fees
- **Closed Bets Filter**: Toggle to show/hide closed and resolved bets
- **Error Handling**: Robust error handling with retry logic for RPC rate limiting
- **Tooltips**: Navigation tooltips for better UX

To run the frontend:
```bash
npm run dev
```

### Environment Variables (Frontend)
Make sure to set these in your `.env` file:
- `VITE_CONTRACT_ADDRESS`: BettingPlatform contract address
- `VITE_ROULETTE_CONTRACT_ADDRESS`: Roulette contract address

## Documentation

### External Resources
- [Arc Network Docs](https://docs.arc.network/)
- [Connect to Arc](https://docs.arc.network/arc/references/connect-to-arc)
- [Contract Addresses](https://docs.arc.network/arc/references/contract-addresses)
- [Deploy on Arc](https://docs.arc.network/arc/tutorials/deploy-on-arc)

### Project Documentation
- `ROULETTE_GUIDE.md`: Complete guide for Roulette contract setup and usage
- `DEPLOYMENT.md`: Deployment instructions and contract addresses
- `TESTING_GUIDE.md`: Testing procedures and test scenarios
- `TROUBLESHOOTING.md`: Common issues and solutions

## Security

### BettingPlatform
- Reentrancy protection using OpenZeppelin's ReentrancyGuard
- Access control using Ownable pattern
- Emergency pause functionality
- Input validation on all functions
- Timestamp validation for deadlines
- Maximum bet enforcement

### Roulette
- Reentrancy protection on spin function
- Prize pool validation before prize distribution
- Automatic prize tier deactivation when pool is insufficient
- Cooldown enforcement for daily spin limit
- Safe token transfers with error handling
- Admin fee distribution with fallback to prize pool

## Contact & Support

- **Discord**: @marcusmore
- **GitHub**: [MarcusMore](https://github.com/MarcusMore)

For issues, questions, or feedback, feel free to reach out!

## License

MIT
