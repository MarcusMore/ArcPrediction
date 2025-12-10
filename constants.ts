
import { Scenario, UserProfile, Notification } from './types';

// Contract address - set after deployment
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

export const MOCK_USER: UserProfile = {
  balance: 2450.50,
  activeBets: 4,
  totalEarnings: 850.20,
  winRate: 68,
};

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'WIN',
    title: 'Bet Won: ETH ETF Approval',
    message: 'Scenario resolved YES. You successfully predicted the market outcome.',
    amount: 450.50,
    timestamp: '2 hours ago',
    read: false
  },
  {
    id: '2',
    type: 'LOSS',
    title: 'Bet Lost: Solana Outage',
    message: 'Scenario resolved NO. Better luck next time.',
    amount: -120.00,
    timestamp: '5 hours ago',
    read: false
  },
  {
    id: '3',
    type: 'INFO',
    title: 'Welcome to Forsightt',
    message: 'Your wallet has been successfully connected. Start trading now!',
    timestamp: '1 day ago',
    read: true
  }
];

export const MOCK_SCENARIOS: Scenario[] = [
  {
    id: '1',
    title: 'Bitcoin to break $100k by Q4?',
    category: 'Crypto',
    description: 'Will the price of Bitcoin (BTC) exceed $100,000 USD on any major exchange before December 31st, 2024?',
    endDate: '2024-12-31',
    totalVolume: 1250000,
    yesPool: 800000,
    noPool: 450000,
    yesPrice: 0.64,
    isTrending: true,
    history: [
      { time: '10:00', price: 0.55 },
      { time: '11:00', price: 0.58 },
      { time: '12:00', price: 0.62 },
      { time: '13:00', price: 0.64 },
    ]
  },
  {
    id: '2',
    title: 'Fed Rate Cut in March?',
    category: 'Finance',
    description: 'Will the Federal Reserve announce a rate cut of at least 25 basis points at the March meeting?',
    endDate: '2024-03-20',
    totalVolume: 850000,
    yesPool: 300000,
    noPool: 550000,
    yesPrice: 0.35,
    history: [
      { time: '10:00', price: 0.40 },
      { time: '11:00', price: 0.38 },
      { time: '12:00', price: 0.36 },
      { time: '13:00', price: 0.35 },
    ]
  },
  {
    id: '3',
    title: 'SpaceX Starship Orbital Success',
    category: 'Finance',
    description: 'Will the next Starship launch complete a full orbit and splash down successfully?',
    endDate: '2024-05-15',
    totalVolume: 500000,
    yesPool: 400000,
    noPool: 100000,
    yesPrice: 0.80,
    isTrending: true,
    history: [
      { time: '10:00', price: 0.75 },
      { time: '11:00', price: 0.78 },
      { time: '12:00', price: 0.79 },
      { time: '13:00', price: 0.80 },
    ]
  },
  {
    id: '4',
    title: 'Lakers to win Championship?',
    category: 'Sports',
    description: 'Will the LA Lakers win the 2024 NBA Championship?',
    endDate: '2024-06-20',
    totalVolume: 200000,
    yesPool: 20000,
    noPool: 180000,
    yesPrice: 0.10,
    history: [
      { time: '10:00', price: 0.12 },
      { time: '11:00', price: 0.11 },
      { time: '12:00', price: 0.10 },
      { time: '13:00', price: 0.10 },
    ]
  }
];

export const CATEGORIES = ['All', 'Finance', 'Crypto', 'Sports', 'Politics'];
