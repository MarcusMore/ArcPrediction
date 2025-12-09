# ArcPrediction - Decentralized Betting Platform

A comprehensive smart contract system for a decentralized betting platform on the Arc Testnet where users can bet USDC on yes/no scenarios posted by an admin.

## Features

- ✅ **Yes/No Scenario Betting**: Users can bet on multiple concurrent scenarios
- ✅ **USDC Native**: Uses USDC as the native gas token on Arc Testnet
- ✅ **Admin Controls**: Create scenarios, close betting, resolve outcomes, claim fees
- ✅ **Secure**: Built with OpenZeppelin's security patterns (Ownable, Pausable, ReentrancyGuard)
- ✅ **Fee System**: 1% admin fee on each resolved scenario
- ✅ **Multi-Scenario Support**: Users can participate in unlimited scenarios simultaneously

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
CONTRACT_ADDRESS=your_deployed_contract_address
ARC_EXPLORER_API_KEY=your_explorer_api_key_optional
```

3. Compile contracts:
```bash
npm run compile
```

4. Deploy to Arc Testnet:
```bash
npm run deploy
```

## Contract Details

### Betting Limits
- **Minimum Bet**: 1 USDC
- **Maximum Bet**: 200 USDC
- **Admin Fee**: 1% of total pool

### Key Functions

#### Admin Functions
- `createScenario()`: Create a new betting scenario
- `closeBetting()`: Manually close betting (optional override)
- `resolveScenario()`: Declare outcome and calculate winnings
- `claimAdminFee()`: Claim 1% fee from resolved scenario
- `pause()` / `unpause()`: Emergency controls

#### User Functions
- `placeBet()`: Place a bet on a scenario (YES or NO)
- `claimWinnings()`: Claim winnings from resolved scenarios

## Frontend Integration

The frontend is located in the root directory and uses:
- React + Vite
- Ethers.js for Web3 interactions
- Framer Motion for animations
- Recharts for data visualization

To run the frontend:
```bash
npm run dev
```

## Documentation

- [Arc Network Docs](https://docs.arc.network/)
- [Connect to Arc](https://docs.arc.network/arc/references/connect-to-arc)
- [Contract Addresses](https://docs.arc.network/arc/references/contract-addresses)
- [Deploy on Arc](https://docs.arc.network/arc/tutorials/deploy-on-arc)

## Security

- Reentrancy protection using OpenZeppelin's ReentrancyGuard
- Access control using Ownable pattern
- Emergency pause functionality
- Input validation on all functions
- Timestamp validation for deadlines
- Maximum bet enforcement

## Contact & Support

- **Discord**: @marcusmore
- **GitHub**: [MarcusMore](https://github.com/MarcusMore)

For issues, questions, or feedback, feel free to reach out!

## License

MIT
