import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp, DollarSign, Target, Zap, Users, Award, ChevronUp, ChevronDown } from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassComponents';
import { Scenario } from '../../types';
import { getLeaderboard, LeaderboardEntry } from '../../services/leaderboardService';
import { formatUSDC } from '../../lib/web3';

interface LeaderboardPanelProps {
  walletAddress: string | null;
  scenarios: Scenario[];
}

type SortMetric = 'profit' | 'winRate' | 'volume' | 'wins' | 'streak';

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  walletAddress,
  scenarios,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortMetric, setSortMetric] = useState<SortMetric>('profit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    if (scenarios.length > 0) {
      loadLeaderboard();
    }
  }, [scenarios]);

  useEffect(() => {
    if (walletAddress && leaderboard.length > 0) {
      const sorted = sortLeaderboard([...leaderboard], sortMetric, sortDirection);
      const rank = sorted.findIndex(entry => 
        entry.address.toLowerCase() === walletAddress.toLowerCase()
      );
      setUserRank(rank >= 0 ? rank + 1 : null);
      
      // Get user's entry
      const entry = sorted.find(entry => 
        entry.address.toLowerCase() === walletAddress.toLowerCase()
      );
      setUserEntry(entry || null);
    } else {
      setUserEntry(null);
      setUserRank(null);
    }
  }, [walletAddress, leaderboard, sortMetric, sortDirection]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const entries = await getLeaderboard(scenarios, 100);
      setLeaderboard(entries);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortLeaderboard = (
    entries: LeaderboardEntry[],
    metric: SortMetric,
    direction: 'asc' | 'desc'
  ): LeaderboardEntry[] => {
    const sorted = [...entries].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (metric) {
        case 'profit':
          aValue = a.totalProfit;
          bValue = b.totalProfit;
          break;
        case 'winRate':
          aValue = a.winRate;
          bValue = b.winRate;
          break;
        case 'volume':
          aValue = a.totalVolume;
          bValue = b.totalVolume;
          break;
        case 'wins':
          aValue = a.totalWins;
          bValue = b.totalWins;
          break;
        case 'streak':
          aValue = a.longestStreak;
          bValue = b.longestStreak;
          break;
        default:
          return 0;
      }

      if (direction === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    return sorted;
  };

  const handleSort = (metric: SortMetric) => {
    if (sortMetric === metric) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortMetric(metric);
      setSortDirection('desc');
    }
  };

  const sortedLeaderboard = sortLeaderboard(leaderboard, sortMetric, sortDirection);
  const topThree = sortedLeaderboard.slice(0, 3);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-400" size={24} />;
      case 2:
        return <Medal className="text-gray-300" size={24} />;
      case 3:
        return <Medal className="text-orange-400" size={24} />;
      default:
        return <span className="text-white/60 font-bold">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 2:
        return 'bg-gray-400/20 border-gray-400/50 text-gray-300';
      case 3:
        return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      default:
        return 'bg-white/5 border-white/10 text-white/60';
    }
  };

  const formatAddress = (address: string, isCurrentUser: boolean = false) => {
    if (isCurrentUser) {
      // Show full address for current user
      return `${address.substring(0, 6)}...${address.substring(38)}`;
    } else {
      // Hide middle part with ***** for other users
      return `${address.substring(0, 6)}*****${address.substring(38)}`;
    }
  };

  const SortButton: React.FC<{ metric: SortMetric; label: string; icon: React.ReactNode }> = ({
    metric,
    label,
    icon,
  }) => {
    const isActive = sortMetric === metric;
    return (
      <button
        onClick={() => handleSort(metric)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary text-white'
            : 'bg-white/5 text-white/60 hover:bg-white/10'
        }`}
      >
        {icon}
        {label}
        {isActive && (
          sortDirection === 'desc' ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronUp size={16} />
          )
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Leaderboard</h2>
          <p className="text-white/60">Compete with other traders and climb the ranks</p>
        </div>
      </div>

      {/* User Status Card */}
      {userEntry && userRank !== null && (
        <GlassCard className="p-6 mb-6 border-2 border-primary/50 bg-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Trophy className="text-primary" size={32} />
              </div>
              <div>
                <div className="text-sm text-white/50 mb-1">Your Position</div>
                <div className="text-3xl font-bold mb-2">
                  #{userRank}
                  {userRank === 1 && <Crown className="inline-block ml-2 text-yellow-400" size={24} />}
                  {userRank === 2 && <Medal className="inline-block ml-2 text-gray-300" size={24} />}
                  {userRank === 3 && <Medal className="inline-block ml-2 text-orange-400" size={24} />}
                </div>
                <div className="font-mono text-sm text-white/60">
                  {formatAddress(userEntry.address, true)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xs text-white/50 mb-1">Total Profit</div>
                <div className={`text-lg font-bold ${userEntry.totalProfit >= 0 ? 'text-secondary' : 'text-red-400'}`}>
                  {userEntry.totalProfit >= 0 ? '+' : ''}{userEntry.totalProfit.toFixed(2)} USDC
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Win Rate</div>
                <div className="text-lg font-bold">{userEntry.winRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Total Wins</div>
                <div className="text-lg font-bold">{userEntry.totalWins}</div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">Longest Streak</div>
                <div className="text-lg font-bold flex items-center justify-center gap-1">
                  <Zap size={16} className="text-accent" />
                  {userEntry.longestStreak}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {!userEntry && walletAddress && (
        <GlassCard className="p-6 mb-6 border-2 border-white/10 bg-white/5">
          <div className="text-center">
            <Users className="mx-auto mb-2 text-white/40" size={32} />
            <p className="text-white/60">Place your first bet to appear on the leaderboard!</p>
          </div>
        </GlassCard>
      )}

      {/* Top 3 Podium */}
      {!isLoading && topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {topThree.map((entry, index) => {
            const rank = index + 1;
            const isUser = walletAddress?.toLowerCase() === entry.address.toLowerCase();
            
            return (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`${rank === 1 ? 'md:order-2' : rank === 2 ? 'md:order-1' : 'md:order-3'}`}
              >
                <GlassCard
                  className={`p-6 text-center border-2 ${
                    rank === 1
                      ? 'border-yellow-500/50 bg-yellow-500/10'
                      : rank === 2
                      ? 'border-gray-400/50 bg-gray-400/10'
                      : 'border-orange-500/50 bg-orange-500/10'
                  } ${isUser ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex justify-center mb-4">
                    {getRankIcon(rank)}
                  </div>
                  <div className="font-mono text-sm text-white/60 mb-2">
                    {formatAddress(entry.address, isUser)}
                  </div>
                  {isUser && (
                    <Badge type="trend" className="mb-3">You</Badge>
                  )}
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-white/50">Total Profit</div>
                      <div className={`text-xl font-bold ${entry.totalProfit >= 0 ? 'text-secondary' : 'text-red-400'}`}>
                        {entry.totalProfit >= 0 ? '+' : ''}{entry.totalProfit.toFixed(2)} USDC
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <div>
                        <div className="text-white/50">Win Rate</div>
                        <div className="font-bold">{entry.winRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-white/50">Wins</div>
                        <div className="font-bold">{entry.totalWins}</div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Sort Options */}
      <div className="flex gap-2 flex-wrap">
        <SortButton metric="profit" label="Total Profit" icon={<DollarSign size={16} />} />
        <SortButton metric="winRate" label="Win Rate" icon={<Target size={16} />} />
        <SortButton metric="volume" label="Volume" icon={<TrendingUp size={16} />} />
        <SortButton metric="wins" label="Total Wins" icon={<Award size={16} />} />
        <SortButton metric="streak" label="Longest Streak" icon={<Zap size={16} />} />
      </div>

      {/* Leaderboard Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-white/60">Loading leaderboard...</p>
        </div>
      ) : sortedLeaderboard.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Users size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/60">No users found. Be the first to place a bet!</p>
        </GlassCard>
      ) : (
        <GlassCard className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 px-4 font-medium text-white/60">Rank</th>
                  <th className="py-3 px-4 font-medium text-white/60">Address</th>
                  <th className="py-3 px-4 font-medium text-white/60">Total Profit</th>
                  <th className="py-3 px-4 font-medium text-white/60">Win Rate</th>
                  <th className="py-3 px-4 font-medium text-white/60">Total Volume</th>
                  <th className="py-3 px-4 font-medium text-white/60">Wins</th>
                  <th className="py-3 px-4 font-medium text-white/60">Bets</th>
                  <th className="py-3 px-4 font-medium text-white/60">Streak</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((entry, index) => {
                  const rank = index + 1;
                  const isUser = walletAddress?.toLowerCase() === entry.address.toLowerCase();

                  return (
                    <motion.tr
                      key={entry.address}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className={`border-b border-white/5 last:border-b-0 hover:bg-white/5 ${
                        isUser ? 'bg-primary/10' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getRankIcon(rank)}
                          {isUser && <Badge type="trend" className="text-xs">You</Badge>}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-white/80">{formatAddress(entry.address, isUser)}</span>
                      </td>
                      <td className={`py-4 px-4 font-mono ${
                        entry.totalProfit >= 0 ? 'text-secondary' : 'text-red-400'
                      }`}>
                        {entry.totalProfit >= 0 ? '+' : ''}{entry.totalProfit.toFixed(2)} USDC
                      </td>
                      <td className="py-4 px-4 text-white/80">{entry.winRate.toFixed(1)}%</td>
                      <td className="py-4 px-4 font-mono text-white/80">{entry.totalVolume.toFixed(2)} USDC</td>
                      <td className="py-4 px-4 text-white/80">{entry.totalWins}</td>
                      <td className="py-4 px-4 text-white/80">{entry.totalBets}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <Zap size={14} className="text-accent" />
                          <span className="text-white/80">{entry.longestStreak}</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

