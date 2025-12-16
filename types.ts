
export interface Scenario {
  id: string;
  title: string;
  category: 'Finance' | 'Sports' | 'Politics' | 'Crypto';
  description: string;
  endDate: string;
  totalVolume: number;
  yesPool: number;
  noPool: number;
  yesPrice: number; // 0.0 to 1.0
  isTrending?: boolean;
  history: { time: string; price: number }[];
  // Contract-specific fields (optional for compatibility)
  isResolved?: boolean;
  isClosed?: boolean;
  outcome?: boolean; // true = Yes, false = No
  adminFee?: number;
  feeClaimed?: boolean;
  bettingDeadline?: number; // Unix timestamp in seconds
  resolutionDeadline?: number; // Unix timestamp in seconds
  yesBettors?: number; // Number of bettors on YES side
  noBettors?: number; // Number of bettors on NO side
  totalBettors?: number; // Total number of bettors
  closedAt?: number; // Unix timestamp when betting was closed
}

export interface UserBet {
  id: string;
  scenarioId: string;
  amount: number;
  position: 'YES' | 'NO';
  timestamp: number;
  entryPrice: number;
  currentValue: number;
  // Claim-related fields
  claimed?: boolean;
  canClaim?: boolean; // true if scenario is resolved, user won, and not yet claimed
  winnings?: number; // Calculated winnings amount (if resolved and won)
}

export interface UserProfile {
  balance: number;
  activeBets: number;
  totalEarnings: number;
  winRate: number;
}

export interface Notification {
  id: string;
  type: 'WIN' | 'LOSS' | 'INFO';
  title: string;
  message: string;
  amount?: number;
  timestamp: string;
  read: boolean;
}

export type ViewState = 'DASHBOARD' | 'PORTFOLIO' | 'ADMIN' | 'BETTING' | 'WHITEPAPER' | 'ACHIEVEMENTS' | 'LEADERBOARD' | 'ROULETTE';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or icon name
  category: 'betting' | 'winning' | 'volume' | 'streak' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: number; // Timestamp
  progress?: number; // 0-100
  target?: number; // Target value for progress
  current?: number; // Current value
}

export interface UserStats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalVolume: number;
  totalProfit: number;
  currentStreak: number;
  longestStreak: number;
  biggestWin: number;
  categoriesPlayed: string[];
  scenariosWon: number;
  scenariosLost: number;
}
