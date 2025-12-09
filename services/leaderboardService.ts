import { ethers } from 'ethers';
import { getProvider, BETTING_PLATFORM_ABI, formatUSDC } from '@/lib/web3';
import { Scenario } from '../types';
import { getContractAddress } from './contractService';

function normalizeAddress(address: string): string {
  if (!address) {
    throw new Error('Address is required');
  }
  address = address.trim();
  if (!address.startsWith('0x')) {
    address = '0x' + address;
  }
  if (address.length !== 42) {
    throw new Error(`Invalid address length: ${address.length}. Expected 42 characters.`);
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`Invalid address format: ${address}`);
  }
  return address;
}

export interface LeaderboardEntry {
  address: string;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  totalVolume: number;
  totalProfit: number;
  currentStreak: number;
  longestStreak: number;
  biggestWin: number;
}

/**
 * Get all unique bettors from all scenarios
 */
export async function getAllBettors(scenarios: Scenario[]): Promise<string[]> {
  const contract = getContract();
  const bettorsSet = new Set<string>();

  for (const scenario of scenarios) {
    try {
      const scenarioId = parseInt(scenario.id);
      const bettors = await contract.scenarioBettors(scenarioId);
      if (Array.isArray(bettors)) {
        bettors.forEach((addr: string) => {
          if (addr && addr !== ethers.ZeroAddress) {
            bettorsSet.add(ethers.getAddress(addr));
          }
        });
      }
    } catch (error) {
      console.warn(`Error fetching bettors for scenario ${scenario.id}:`, error);
    }
  }

  return Array.from(bettorsSet);
}

/**
 * Get user bet for a specific scenario
 */
async function getUserBetForScenario(
  contract: ethers.Contract,
  userAddress: string,
  scenarioId: number
): Promise<{ amount: bigint; choice: boolean; claimed: boolean } | null> {
  try {
    const bet = await contract.getUserBet(userAddress, scenarioId);
    if (bet && bet.amount > 0) {
      return {
        amount: bet.amount,
        choice: bet.choice,
        claimed: bet.claimed,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate leaderboard entry for a user
 */
export async function calculateUserStats(
  userAddress: string,
  scenarios: Scenario[]
): Promise<LeaderboardEntry> {
  const contract = getContract();
  const normalizedAddress = ethers.getAddress(userAddress);

  const userBets: Array<{
    scenarioId: number;
    amount: number;
    choice: boolean;
    scenario: Scenario;
  }> = [];

  // Fetch all bets for this user across all scenarios
  for (const scenario of scenarios) {
    const scenarioId = parseInt(scenario.id);
    const bet = await getUserBetForScenario(contract, normalizedAddress, scenarioId);
    
    if (bet) {
      userBets.push({
        scenarioId,
        amount: Number(formatUSDC(bet.amount)),
        choice: bet.choice,
        scenario,
      });
    }
  }

  // Calculate stats
  const resolvedBets = userBets.filter(bet => bet.scenario.isResolved);
  
  const wins = resolvedBets.filter(bet => {
    const scenario = bet.scenario;
    if (!scenario.isResolved) return false;
    return (bet.choice && scenario.outcome) || (!bet.choice && !scenario.outcome);
  });

  const losses = resolvedBets.filter(bet => {
    const scenario = bet.scenario;
    if (!scenario.isResolved) return false;
    return !((bet.choice && scenario.outcome) || (!bet.choice && !scenario.outcome));
  });

  const totalVolume = userBets.reduce((sum, bet) => sum + bet.amount, 0);

  // Calculate profit
  let totalProfit = 0;
  wins.forEach(bet => {
    const scenario = bet.scenario;
    const winningPool = scenario.outcome ? (scenario.yesPool || 0) : (scenario.noPool || 0);
    const totalPool = scenario.totalVolume || 0;
    const adminFee = scenario.adminFee || totalPool * 0.01;
    
    if (winningPool > 0 && totalPool > 0) {
      const adjustedPool = totalPool - adminFee;
      if (adjustedPool > 0) {
        const winnings = (bet.amount / winningPool) * adjustedPool;
        totalProfit += winnings - bet.amount;
      }
    }
  });

  losses.forEach(bet => {
    totalProfit -= bet.amount;
  });

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const sortedBets = [...resolvedBets].sort((a, b) => {
    const timeA = a.scenario.closedAt || 0;
    const timeB = b.scenario.closedAt || 0;
    return timeA - timeB;
  });

  for (const bet of sortedBets) {
    const scenario = bet.scenario;
    if (!scenario.isResolved) continue;

    const won = (bet.choice && scenario.outcome) || (!bet.choice && !scenario.outcome);

    if (won) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Current streak (from most recent)
  const recentBets = [...resolvedBets].sort((a, b) => {
    const timeA = a.scenario.closedAt || 0;
    const timeB = b.scenario.closedAt || 0;
    return timeB - timeA;
  });

  for (const bet of recentBets) {
    const scenario = bet.scenario;
    if (!scenario.isResolved) continue;

    const won = (bet.choice && scenario.outcome) || (!bet.choice && !scenario.outcome);

    if (won) {
      currentStreak++;
    } else {
      break;
    }
  }

  const biggestWin = Math.max(
    ...wins.map(bet => {
      const scenario = bet.scenario;
      const winningPool = scenario.outcome ? (scenario.yesPool || 0) : (scenario.noPool || 0);
      const totalPool = scenario.totalVolume || 0;
      const adminFee = scenario.adminFee || totalPool * 0.01;

      if (winningPool > 0 && totalPool > 0) {
        const adjustedPool = totalPool - adminFee;
        if (adjustedPool > 0) {
          const winnings = (bet.amount / winningPool) * adjustedPool;
          return winnings - bet.amount;
        }
      }
      return 0;
    }),
    0
  );

  const winRate = resolvedBets.length > 0 ? (wins.length / resolvedBets.length) * 100 : 0;

  return {
    address: normalizedAddress,
    totalBets: userBets.length,
    totalWins: wins.length,
    totalLosses: losses.length,
    winRate: Math.round(winRate * 100) / 100,
    totalVolume: Math.round(totalVolume * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    currentStreak,
    longestStreak,
    biggestWin: Math.round(biggestWin * 100) / 100,
  };
}

/**
 * Get full leaderboard
 */
export async function getLeaderboard(
  scenarios: Scenario[],
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  console.log('[Leaderboard] Fetching all bettors...');
  const allBettors = await getAllBettors(scenarios);
  console.log(`[Leaderboard] Found ${allBettors.length} unique bettors`);

  const entries: LeaderboardEntry[] = [];

  // Calculate stats for each bettor (with batching to avoid overwhelming the RPC)
  const batchSize = 5;
  for (let i = 0; i < allBettors.length; i += batchSize) {
    const batch = allBettors.slice(i, i + batchSize);
    console.log(`[Leaderboard] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allBettors.length / batchSize)}`);

    const batchPromises = batch.map(address => calculateUserStats(address, scenarios));
    const batchResults = await Promise.all(batchPromises);
    entries.push(...batchResults);
  }

  // Filter out users with no bets
  const activeEntries = entries.filter(e => e.totalBets > 0);

  return activeEntries;
}

function getContract(): ethers.Contract {
  const contractAddress = getContractAddress();
  if (!contractAddress) {
    throw new Error('Contract address not set');
  }

  const normalizedAddress = normalizeAddress(contractAddress);
  const provider = getProvider();
  const address = ethers.getAddress(normalizedAddress);
  return new ethers.Contract(address, BETTING_PLATFORM_ABI, provider);
}

