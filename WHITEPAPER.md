# Forsightt Whitepaper

## Executive Summary

Forsightt is a decentralized prediction market platform built on the Arc Testnet, enabling users to bet USDC on yes/no scenarios. The platform leverages smart contracts for transparent, trustless betting with automatic settlement and fee distribution.

## 1. Product Overview

### 1.1 What is Forsightt?

Forsightt is a decentralized betting platform where users can participate in prediction markets by betting on binary outcomes (Yes/No) for various scenarios across categories including Finance, Crypto, Sports, and Politics.

### 1.2 Key Features

- **Decentralized**: Built on Arc Testnet with smart contract-based settlement
- **Transparent**: All bets, outcomes, and payouts are recorded on-chain
- **Zero Gas Fees**: Uses USDC as the native gas token on Arc Testnet
- **Real-time Odds**: Dynamic pricing based on pool distribution
- **Multi-Scenario Betting**: Users can participate in multiple concurrent scenarios
- **Automatic Settlement**: Smart contracts handle resolution and distribution
- **Gamification**: Achievement system with 30+ achievements and progress tracking
- **Leaderboard**: Competitive rankings with privacy-protected addresses
- **Portfolio Management**: Comprehensive tracking of bets, profits, and performance
- **Admin Management**: Multi-admin support with role-based access control

## 2. Technical Architecture

### 2.1 Blockchain Network

- **Network**: Arc Testnet
- **Chain ID**: 5042002 (0x4cef52)
- **Native Token**: USDC (for gas fees)
- **Token Standard**: ERC-20 (6 decimals for USDC interface)

### 2.2 Smart Contract

The platform is powered by a single smart contract: `BettingPlatform.sol`

**Key Components:**
- Scenario management with custom deadlines
- Bet placement and tracking
- Outcome resolution (normal and emergency)
- Fee calculation and distribution
- Emergency pause functionality
- Multi-admin role management
- Permanent owner protection
- Bettor tracking and analytics

### 2.3 Contract Address

Current deployment: `0xDE4544a8bB8e764A66E5659dcbb5b1f60327b13f`

**Note:** Contract address may vary. Check `.env` file or deployment logs for the latest address.

## 3. Betting Mechanics

### 3.1 Scenario Lifecycle

#### 3.1.1 Creation
- Admin creates a scenario with:
  - Description/question
  - Betting deadline (timestamp)
  - Resolution deadline (timestamp)
- Scenarios are assigned unique sequential IDs

#### 3.1.2 Betting Period
- Users can place bets during the betting period
- Each user can place one bet per scenario
- Bets are locked until resolution
- Real-time odds update based on pool distribution

#### 3.1.3 Closure
- Betting closes automatically at the betting deadline
- Admin can manually close betting earlier if needed
- No new bets accepted after closure

#### 3.1.4 Resolution
- Admin declares the outcome (Yes/No) by the resolution deadline
- Outcome is immutable once declared
- Winnings are calculated automatically
- Admin fee is deducted from the total pool

#### 3.1.5 Distribution
- Winners can claim their winnings
- Admin can claim the 1% fee after resolution
- Losers' funds are redistributed to winners

### 3.2 Betting Limits

- **Minimum Bet**: 1 USDC
- **Maximum Bet**: 200 USDC
- **Per Scenario**: One bet per user per scenario
- **Concurrent Scenarios**: Unlimited participation across different scenarios

## 4. Financial Calculations

### 4.1 Pool Structure

Each scenario maintains three pools:

- **Total Pool**: Sum of all bets on the scenario
- **Yes Pool**: Sum of all "Yes" bets
- **No Pool**: Sum of all "No" bets

```
Total Pool = Yes Pool + No Pool
```

### 4.2 Price Calculation

The probability/price for each outcome is calculated as:

```
Yes Price = Yes Pool / Total Pool
No Price = No Pool / Total Pool
```

Prices range from 0.0 to 1.0 and always sum to 1.0.

### 4.3 Admin Fee

- **Fee Rate**: 1% of total pool
- **Calculation**: `Admin Fee = Total Pool × 0.01`
- **Deduction**: Fee is deducted before winnings distribution
- **Claiming**: Admin can claim fee after scenario resolution

### 4.4 Winnings Calculation

When a scenario is resolved, winners receive a proportional share of the adjusted pool.

#### 4.4.1 Adjusted Pool

The adjusted pool is the total pool minus the admin fee:

```
Adjusted Pool = Total Pool - Admin Fee
```

#### 4.4.2 Individual Winnings

Each winner's payout is calculated as:

```
Winnings = (User Bet Amount / Winning Pool Total) × Adjusted Pool
```

Where:
- **Winning Pool Total**: Sum of all bets on the correct outcome
- **User Bet Amount**: The amount the user bet on the winning outcome
- **Adjusted Pool**: Total pool minus 1% admin fee

#### 4.4.3 Profit Calculation

User profit is:

```
Profit = Winnings - Original Bet Amount
```

### 4.5 Example Calculation

**Scenario Setup:**
- Total Pool: 1000 USDC
- Yes Pool: 600 USDC
- No Pool: 400 USDC
- Outcome: Yes

**Admin Fee:**
```
Admin Fee = 1000 × 0.01 = 10 USDC
Adjusted Pool = 1000 - 10 = 990 USDC
```

**User Bet:**
- User bet: 100 USDC on Yes
- Winning Pool: 600 USDC

**Calculation:**
```
Winnings = (100 / 600) × 990 = 165 USDC
Profit = 165 - 100 = 65 USDC
```

**Result:**
- User receives: 165 USDC
- User profit: +65 USDC
- Admin receives: 10 USDC

### 4.6 Edge Cases

#### 4.6.1 Single Bettor Scenario

If only one user bets on the winning side:
- They receive the entire adjusted pool
- Profit = Adjusted Pool - Bet Amount

#### 4.6.2 Zero Pool Scenarios

If no bets are placed:
- No admin fee
- No winnings to distribute

#### 4.6.3 Unbalanced Pools

If all bets are on one side:
- Winners receive their bet back minus admin fee
- No redistribution from losers

## 5. User Experience Flow

### 5.1 Getting Started

1. **Connect Wallet**: User connects MetaMask or compatible Web3 wallet
2. **Approve USDC**: User approves USDC spending for the contract
3. **View Scenarios**: Browse available betting scenarios
4. **Select Scenario**: Choose a scenario to bet on

### 5.2 Placing a Bet

1. **Choose Position**: Select Yes or No
2. **Set Amount**: Use slider to set bet amount (1-200 USDC)
3. **Review**: Check potential return and fees
4. **Confirm**: Sign transaction to place bet
5. **Track**: Monitor bet in portfolio

### 5.3 Claiming Winnings

1. **Resolution**: Wait for admin to resolve scenario
2. **Check Status**: View resolved scenarios in portfolio
3. **Claim**: Click "Claim" button for winning bets
4. **Receive**: Winnings transferred to wallet

## 6. Security Features

### 6.1 Smart Contract Security

- **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
- **Access Control**: Ownable pattern for admin functions
- **Pausable**: Emergency pause functionality
- **Input Validation**: All inputs validated before execution

### 6.2 Betting Security

- **Deadline Enforcement**: Timestamps validated on-chain
- **Amount Limits**: Min/max bet enforced by contract
- **Single Bet Per User**: Prevents duplicate bets
- **Fund Isolation**: Each scenario's funds are isolated

### 6.3 Withdrawal Pattern

- **Pull Pattern**: Users must claim winnings (not pushed)
- **Prevents Reentrancy**: Claiming is separate from resolution
- **Explicit Approval**: Users control when to claim

## 7. Admin Functions

### 7.1 Scenario Management

- **Create Scenario**: Post new betting scenarios with custom deadlines
- **Close Betting**: Manually close betting before deadline
- **Resolve Scenario**: Declare outcome (Yes/No) by resolution deadline
- **Emergency Resolve**: Resolve after deadline has passed (bypasses deadline check)
- **Bettor Analytics**: Track number of bettors on each side

### 7.2 Fee Management

- **Claim Admin Fee**: Collect 1% fee from resolved scenarios
- **Fee Tracking**: Fee status tracked per scenario
- **Fee Calculation**: Automatic 1% deduction from total pool

### 7.3 Admin Management

- **Add Admin**: Grant admin privileges to additional addresses
- **Remove Admin**: Revoke admin privileges (owner cannot be removed)
- **Admin List**: View all current admins
- **Role-Based Access**: Admins can create, close, and resolve scenarios

### 7.4 Emergency Controls

- **Pause Contract**: Temporarily halt all operations
- **Unpause Contract**: Resume operations
- **Permanent Owner**: Owner address is permanent and cannot be transferred away

## 8. Fee Structure

### 8.1 User Fees

- **Betting Fee**: None (0%)
- **Claiming Fee**: None (0%)
- **Gas Fees**: Paid in USDC (Arc Testnet native)

### 8.2 Platform Fees

- **Admin Fee**: 1% of total pool per scenario
- **Fee Collection**: After scenario resolution
- **Fee Distribution**: Claimed by contract owner

### 8.3 Fee Calculation Example

**Scenario:**
- Total bets: 10,000 USDC
- Admin fee: 100 USDC (1%)
- Adjusted pool: 9,900 USDC

**Distribution:**
- Winners share: 9,900 USDC
- Admin receives: 100 USDC

## 9. Risk Considerations

### 9.1 User Risks

- **Loss of Bet**: Users lose their bet if they choose the wrong outcome
- **Smart Contract Risk**: Platform uses audited OpenZeppelin contracts
- **Network Risk**: Arc Testnet is a test network
- **Liquidity Risk**: Small pools may result in lower returns

### 9.2 Platform Risks

- **Admin Centralization**: Admin controls scenario creation and resolution
- **Resolution Delay**: Admin must resolve by deadline
- **Oracle Dependency**: Outcomes depend on admin declaration

### 9.3 Mitigation Strategies

- **Transparent Resolution**: All resolutions recorded on-chain
- **Emergency Resolve**: Mechanism for late resolutions
- **Pause Functionality**: Can halt operations if issues arise

## 10. Gamification & Social Features

### 10.1 Achievement System

Forsightt includes a comprehensive gamification system with 30+ achievements across multiple categories:

**Achievement Categories:**
- **Betting**: First bet, 10/50/100/500 bets milestones
- **Winning**: First win, 10/50/100 wins milestones
- **Win Rate**: 60%/70%/80% win rate achievements
- **Volume**: 1K/10K/100K USDC total betting volume
- **Profit**: 100/1K/10K USDC profit milestones
- **Streaks**: 3/5/10 consecutive wins
- **Special**: All categories, perfect week

**Features:**
- Real-time progress tracking
- Rarity system (Common, Rare, Epic, Legendary)
- Category filtering
- Completion percentage
- Visual progress bars

### 10.2 Leaderboard

Competitive rankings system for users to compete:

**Features:**
- **Privacy-Protected**: Other users' addresses partially hidden (*****)
- **User Status Card**: Prominent display of user's position and stats
- **Multiple Sort Options**: By profit, win rate, volume, wins, or streak
- **Top 3 Podium**: Special display for top performers
- **Real-time Updates**: Rankings update as scenarios resolve

**Ranking Metrics:**
- Total Profit
- Win Rate
- Total Volume
- Total Wins
- Longest Streak

### 10.3 Portfolio Management

Comprehensive tracking and analytics:

**Features:**
- Total profit calculation
- Win rate tracking
- Active capital display
- Detailed bet history table
- Claimable bets section
- Performance metrics

## 11. Roadmap

### 11.1 Current Features (v1.0)

- ✅ Basic betting functionality
- ✅ Scenario management
- ✅ Admin panel with multi-admin support
- ✅ Portfolio tracking
- ✅ Notification system
- ✅ Achievement system (30+ achievements)
- ✅ Leaderboard with privacy protection
- ✅ Emergency resolve functionality
- ✅ Permanent owner protection
- ✅ Bettor analytics

### 11.2 Future Enhancements

- 🔄 Oracle integration for automatic resolution
- 🔄 Multi-signature admin controls
- 🔄 Advanced analytics and charts
- 🔄 Historical data export
- 🔄 Mobile app support
- 🔄 Social features (following, sharing)
- 🔄 Custom achievement creation
- 🔄 Tournament mode

## 12. Technical Specifications

### 11.1 Smart Contract

- **Language**: Solidity 0.8.20
- **Compiler**: Hardhat with optimizer
- **Libraries**: OpenZeppelin Contracts v5.0.0
- **Standards**: ERC-20 interface for USDC

### 11.2 Frontend

- **Framework**: React 19.2.1
- **Build Tool**: Vite 6.2.0
- **Web3 Library**: Ethers.js 6.13.0
- **Styling**: Tailwind CSS with custom components

### 11.3 Network Details

- **RPC URL**: https://rpc.blockdaemon.testnet.arc.network
- **Explorer**: https://testnet.arcscan.app
- **Faucet**: https://faucet.circle.com

## 13. Security & Access Control

### 13.1 Access Control System

**Owner:**
- Permanent owner address (cannot be changed)
- Full control over contract
- Can pause/unpause
- Can add/remove admins
- Cannot be removed from admin role

**Admins:**
- Can create scenarios
- Can close betting
- Can resolve scenarios
- Can claim admin fees
- Can use emergency resolve
- Cannot pause/unpause
- Cannot add/remove other admins

**Users:**
- Can place bets
- Can claim winnings
- Can view all public data
- No special privileges

### 13.2 Security Features

**Smart Contract:**
- ReentrancyGuard on all fund transfers
- Input validation on all functions
- Deadline enforcement
- Amount limits enforcement
- Scenario isolation

**Frontend:**
- Address validation
- Network validation
- Transaction error handling
- Privacy protection (leaderboard)

## 14. Legal and Compliance

### 12.1 Testnet Disclaimer

Forsightt is currently deployed on Arc Testnet for testing purposes only. All tokens and transactions are on a test network and have no real-world value.

### 12.2 Regulatory Notice

Prediction markets may be subject to regulatory restrictions in certain jurisdictions. Users are responsible for compliance with local laws and regulations.

### 12.3 No Warranty

The platform is provided "as is" without warranties. Users participate at their own risk.

## 15. Contact and Resources

### 13.1 Documentation

- **GitHub**: [Repository URL]
- **Explorer**: https://testnet.arcscan.app
- **Arc Network Docs**: https://docs.arc.network

### 13.2 Support

For issues, questions, or feedback, please contact the development team.

---

**Version**: 1.1  
**Last Updated**: December 2025  
**Network**: Arc Testnet

---

## Changelog

### Version 1.1 (December 2025)
- ✅ Added Achievement System (30+ achievements)
- ✅ Added Leaderboard with privacy protection
- ✅ Added Multi-Admin Management
- ✅ Added Permanent Owner Protection
- ✅ Added Emergency Resolve functionality
- ✅ Added Bettor Analytics
- ✅ Enhanced Portfolio Management
- ✅ Improved User Experience

### Version 1.0 (Initial Release)
- ✅ Basic betting functionality
- ✅ Scenario management
- ✅ Admin panel
- ✅ Portfolio tracking
- ✅ Notification system

