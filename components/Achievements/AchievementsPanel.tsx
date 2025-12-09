import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, Zap, Target, TrendingUp, DollarSign, Flame, Crown, Medal, CheckCircle, Lock } from 'lucide-react';
import { GlassCard, Badge } from '../ui/GlassComponents';
import { Achievement, UserStats, UserBet, Scenario } from '../../types';

interface AchievementsPanelProps {
  walletAddress: string;
  userBets: UserBet[];
  scenarios: Scenario[];
  totalProfit: number;
  winRate: number;
}

const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'progress' | 'current'>[] = [
  // Betting Achievements
  {
    id: 'first_bet',
    title: 'First Steps',
    description: 'Place your first bet',
    icon: '🎯',
    category: 'betting',
    rarity: 'common',
    target: 1,
  },
  {
    id: 'ten_bets',
    title: 'Getting Started',
    description: 'Place 10 bets',
    icon: '📊',
    category: 'betting',
    rarity: 'common',
    target: 10,
  },
  {
    id: 'fifty_bets',
    title: 'Active Trader',
    description: 'Place 50 bets',
    icon: '🔥',
    category: 'betting',
    rarity: 'rare',
    target: 50,
  },
  {
    id: 'hundred_bets',
    title: 'Betting Master',
    description: 'Place 100 bets',
    icon: '💎',
    category: 'betting',
    rarity: 'epic',
    target: 100,
  },
  {
    id: 'five_hundred_bets',
    title: 'Betting Legend',
    description: 'Place 500 bets',
    icon: '👑',
    category: 'betting',
    rarity: 'legendary',
    target: 500,
  },
  
  // Winning Achievements
  {
    id: 'first_win',
    title: 'Winner',
    description: 'Win your first bet',
    icon: '🏆',
    category: 'winning',
    rarity: 'common',
    target: 1,
  },
  {
    id: 'ten_wins',
    title: 'Consistent Winner',
    description: 'Win 10 bets',
    icon: '⭐',
    category: 'winning',
    rarity: 'common',
    target: 10,
  },
  {
    id: 'fifty_wins',
    title: 'Victory Streak',
    description: 'Win 50 bets',
    icon: '🌟',
    category: 'winning',
    rarity: 'rare',
    target: 50,
  },
  {
    id: 'hundred_wins',
    title: 'Champion',
    description: 'Win 100 bets',
    icon: '💫',
    category: 'winning',
    rarity: 'epic',
    target: 100,
  },
  
  // Win Rate Achievements
  {
    id: 'sixty_winrate',
    title: 'Above Average',
    description: 'Achieve 60% win rate (min 10 bets)',
    icon: '📈',
    category: 'winning',
    rarity: 'rare',
    target: 60,
  },
  {
    id: 'seventy_winrate',
    title: 'Skilled Predictor',
    description: 'Achieve 70% win rate (min 20 bets)',
    icon: '🎖️',
    category: 'winning',
    rarity: 'epic',
    target: 70,
  },
  {
    id: 'eighty_winrate',
    title: 'Prediction Master',
    description: 'Achieve 80% win rate (min 30 bets)',
    icon: '🏅',
    category: 'winning',
    rarity: 'legendary',
    target: 80,
  },
  
  // Volume Achievements
  {
    id: 'thousand_volume',
    title: 'Big Spender',
    description: 'Bet a total of 1,000 USDC',
    icon: '💰',
    category: 'volume',
    rarity: 'common',
    target: 1000,
  },
  {
    id: 'ten_thousand_volume',
    title: 'High Roller',
    description: 'Bet a total of 10,000 USDC',
    icon: '💵',
    category: 'volume',
    rarity: 'rare',
    target: 10000,
  },
  {
    id: 'hundred_thousand_volume',
    title: 'Whale',
    description: 'Bet a total of 100,000 USDC',
    icon: '🐋',
    category: 'volume',
    rarity: 'epic',
    target: 100000,
  },
  
  // Profit Achievements
  {
    id: 'hundred_profit',
    title: 'Profitable',
    description: 'Earn 100 USDC in profit',
    icon: '💸',
    category: 'winning',
    rarity: 'common',
    target: 100,
  },
  {
    id: 'thousand_profit',
    title: 'Big Earner',
    description: 'Earn 1,000 USDC in profit',
    icon: '💎',
    category: 'winning',
    rarity: 'rare',
    target: 1000,
  },
  {
    id: 'ten_thousand_profit',
    title: 'Millionaire Mindset',
    description: 'Earn 10,000 USDC in profit',
    icon: '👑',
    category: 'winning',
    rarity: 'legendary',
    target: 10000,
  },
  
  // Streak Achievements
  {
    id: 'three_streak',
    title: 'Hot Streak',
    description: 'Win 3 bets in a row',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    target: 3,
  },
  {
    id: 'five_streak',
    title: 'On Fire',
    description: 'Win 5 bets in a row',
    icon: '🔥🔥',
    category: 'streak',
    rarity: 'rare',
    target: 5,
  },
  {
    id: 'ten_streak',
    title: 'Unstoppable',
    description: 'Win 10 bets in a row',
    icon: '🔥🔥🔥',
    category: 'streak',
    rarity: 'legendary',
    target: 10,
  },
  
  // Special Achievements
  {
    id: 'all_categories',
    title: 'Diversified',
    description: 'Bet on all categories',
    icon: '🌈',
    category: 'special',
    rarity: 'epic',
    target: 4, // Finance, Sports, Politics, Crypto
  },
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Win all bets in a week (min 5 bets)',
    icon: '✨',
    category: 'special',
    rarity: 'legendary',
    target: 1,
  },
];

const RARITY_COLORS = {
  common: 'text-white/60 border-white/20',
  rare: 'text-blue-400 border-blue-500/50 bg-blue-500/10',
  epic: 'text-purple-400 border-purple-500/50 bg-purple-500/10',
  legendary: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10',
};

const RARITY_GRADIENTS = {
  common: 'from-white/10 to-white/5',
  rare: 'from-blue-500/20 to-blue-500/10',
  epic: 'from-purple-500/20 to-purple-500/10',
  legendary: 'from-yellow-500/30 to-yellow-500/15',
};

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({
  walletAddress,
  userBets,
  scenarios,
  totalProfit,
  winRate,
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalBets: 0,
    totalWins: 0,
    totalLosses: 0,
    winRate: 0,
    totalVolume: 0,
    totalProfit: 0,
    currentStreak: 0,
    longestStreak: 0,
    biggestWin: 0,
    categoriesPlayed: [],
    scenariosWon: 0,
    scenariosLost: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    calculateStats();
  }, [userBets, scenarios]);

  useEffect(() => {
    calculateAchievements();
  }, [stats]);

  const calculateStats = () => {
    if (userBets.length === 0) {
      setStats({
        totalBets: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        totalVolume: 0,
        totalProfit: 0,
        currentStreak: 0,
        longestStreak: 0,
        biggestWin: 0,
        categoriesPlayed: [],
        scenariosWon: 0,
        scenariosLost: 0,
      });
      return;
    }

    const resolvedBets = userBets.filter(bet => {
      const scenario = scenarios.find(s => s.id === bet.scenarioId);
      return scenario?.isResolved;
    });

    const wins = resolvedBets.filter(bet => {
      const scenario = scenarios.find(s => s.id === bet.scenarioId);
      if (!scenario?.isResolved) return false;
      return (bet.position === 'YES' && scenario.outcome) || (bet.position === 'NO' && !scenario.outcome);
    });

    const losses = resolvedBets.filter(bet => {
      const scenario = scenarios.find(s => s.id === bet.scenarioId);
      if (!scenario?.isResolved) return false;
      return !((bet.position === 'YES' && scenario.outcome) || (bet.position === 'NO' && !scenario.outcome));
    });

    const totalVolume = userBets.reduce((sum, bet) => sum + bet.amount, 0);
    
    const categories = new Set<string>();
    userBets.forEach(bet => {
      const scenario = scenarios.find(s => s.id === bet.scenarioId);
      if (scenario?.category) {
        categories.add(scenario.category);
      }
    });

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Sort bets by timestamp (oldest first)
    const sortedBets = [...resolvedBets].sort((a, b) => a.timestamp - b.timestamp);
    
    for (const bet of sortedBets) {
      const scenario = scenarios.find(s => s.id === bet.scenarioId);
      if (!scenario?.isResolved) continue;
      
      const won = (bet.position === 'YES' && scenario.outcome) || (bet.position === 'NO' && !scenario.outcome);
      
      if (won) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    // Current streak (from most recent bets)
    const recentBets = [...resolvedBets].sort((a, b) => b.timestamp - a.timestamp);
    for (const bet of recentBets) {
      const scenario = scenarios.find(s => s.id === bet.scenarioId);
      if (!scenario?.isResolved) continue;
      
      const won = (bet.position === 'YES' && scenario.outcome) || (bet.position === 'NO' && !scenario.outcome);
      
      if (won) {
        currentStreak++;
      } else {
        break;
      }
    }

    const biggestWin = Math.max(...wins.map(bet => {
      const scenario = scenarios.find(s => s.id === bet.scenarioId);
      if (!scenario) return 0;
      const winningPool = scenario.outcome ? (scenario.yesPool || 0) : (scenario.noPool || 0);
      const totalPool = scenario.totalVolume || scenario.totalPool || 0;
      if (winningPool === 0 || totalPool === 0) return 0;
      const userShare = bet.amount / winningPool;
      const adjustedPool = totalPool * 0.99; // Minus 1% admin fee
      return (userShare * adjustedPool) - bet.amount;
    }), 0);

    setStats({
      totalBets: userBets.length,
      totalWins: wins.length,
      totalLosses: losses.length,
      winRate: resolvedBets.length > 0 ? (wins.length / resolvedBets.length) * 100 : 0,
      totalVolume,
      totalProfit,
      currentStreak,
      longestStreak,
      biggestWin,
      categoriesPlayed: Array.from(categories),
      scenariosWon: wins.length,
      scenariosLost: losses.length,
    });
  };

  const calculateAchievements = () => {
    const calculatedAchievements: Achievement[] = ALL_ACHIEVEMENTS.map(achievement => {
      let unlocked = false;
      let progress = 0;
      let current = 0;

      switch (achievement.id) {
        case 'first_bet':
          current = stats.totalBets;
          unlocked = stats.totalBets >= 1;
          progress = Math.min((stats.totalBets / 1) * 100, 100);
          break;
        case 'ten_bets':
          current = stats.totalBets;
          unlocked = stats.totalBets >= 10;
          progress = Math.min((stats.totalBets / 10) * 100, 100);
          break;
        case 'fifty_bets':
          current = stats.totalBets;
          unlocked = stats.totalBets >= 50;
          progress = Math.min((stats.totalBets / 50) * 100, 100);
          break;
        case 'hundred_bets':
          current = stats.totalBets;
          unlocked = stats.totalBets >= 100;
          progress = Math.min((stats.totalBets / 100) * 100, 100);
          break;
        case 'five_hundred_bets':
          current = stats.totalBets;
          unlocked = stats.totalBets >= 500;
          progress = Math.min((stats.totalBets / 500) * 100, 100);
          break;
        case 'first_win':
          current = stats.totalWins;
          unlocked = stats.totalWins >= 1;
          progress = Math.min((stats.totalWins / 1) * 100, 100);
          break;
        case 'ten_wins':
          current = stats.totalWins;
          unlocked = stats.totalWins >= 10;
          progress = Math.min((stats.totalWins / 10) * 100, 100);
          break;
        case 'fifty_wins':
          current = stats.totalWins;
          unlocked = stats.totalWins >= 50;
          progress = Math.min((stats.totalWins / 50) * 100, 100);
          break;
        case 'hundred_wins':
          current = stats.totalWins;
          unlocked = stats.totalWins >= 100;
          progress = Math.min((stats.totalWins / 100) * 100, 100);
          break;
        case 'sixty_winrate':
          current = stats.winRate;
          unlocked = stats.winRate >= 60 && stats.totalBets >= 10;
          progress = stats.totalBets >= 10 ? Math.min((stats.winRate / 60) * 100, 100) : 0;
          break;
        case 'seventy_winrate':
          current = stats.winRate;
          unlocked = stats.winRate >= 70 && stats.totalBets >= 20;
          progress = stats.totalBets >= 20 ? Math.min((stats.winRate / 70) * 100, 100) : 0;
          break;
        case 'eighty_winrate':
          current = stats.winRate;
          unlocked = stats.winRate >= 80 && stats.totalBets >= 30;
          progress = stats.totalBets >= 30 ? Math.min((stats.winRate / 80) * 100, 100) : 0;
          break;
        case 'thousand_volume':
          current = stats.totalVolume;
          unlocked = stats.totalVolume >= 1000;
          progress = Math.min((stats.totalVolume / 1000) * 100, 100);
          break;
        case 'ten_thousand_volume':
          current = stats.totalVolume;
          unlocked = stats.totalVolume >= 10000;
          progress = Math.min((stats.totalVolume / 10000) * 100, 100);
          break;
        case 'hundred_thousand_volume':
          current = stats.totalVolume;
          unlocked = stats.totalVolume >= 100000;
          progress = Math.min((stats.totalVolume / 100000) * 100, 100);
          break;
        case 'hundred_profit':
          current = totalProfit;
          unlocked = totalProfit >= 100;
          progress = Math.min((totalProfit / 100) * 100, 100);
          break;
        case 'thousand_profit':
          current = totalProfit;
          unlocked = totalProfit >= 1000;
          progress = Math.min((totalProfit / 1000) * 100, 100);
          break;
        case 'ten_thousand_profit':
          current = totalProfit;
          unlocked = totalProfit >= 10000;
          progress = Math.min((totalProfit / 10000) * 100, 100);
          break;
        case 'three_streak':
          current = stats.longestStreak;
          unlocked = stats.longestStreak >= 3;
          progress = Math.min((stats.longestStreak / 3) * 100, 100);
          break;
        case 'five_streak':
          current = stats.longestStreak;
          unlocked = stats.longestStreak >= 5;
          progress = Math.min((stats.longestStreak / 5) * 100, 100);
          break;
        case 'ten_streak':
          current = stats.longestStreak;
          unlocked = stats.longestStreak >= 10;
          progress = Math.min((stats.longestStreak / 10) * 100, 100);
          break;
        case 'all_categories':
          current = stats.categoriesPlayed.length;
          unlocked = stats.categoriesPlayed.length >= 4;
          progress = Math.min((stats.categoriesPlayed.length / 4) * 100, 100);
          break;
        case 'perfect_week':
          // This would require tracking weekly wins - simplified for now
          unlocked = false;
          progress = 0;
          break;
      }

      return {
        ...achievement,
        unlocked,
        progress: Math.round(progress),
        current: Math.round(current * 100) / 100,
      };
    });

    setAchievements(calculatedAchievements);
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionRate = Math.round((unlockedCount / totalCount) * 100);

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown size={16} className="text-yellow-400" />;
      case 'epic': return <Star size={16} className="text-purple-400" />;
      case 'rare': return <Award size={16} className="text-blue-400" />;
      default: return <Medal size={16} className="text-white/60" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Trophy className="text-primary" size={24} />
            </div>
            <div>
              <div className="text-sm text-white/50">Achievements</div>
              <div className="text-2xl font-bold">{unlockedCount}/{totalCount}</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <Target className="text-secondary" size={24} />
            </div>
            <div>
              <div className="text-sm text-white/50">Completion</div>
              <div className="text-2xl font-bold">{completionRate}%</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Flame className="text-accent" size={24} />
            </div>
            <div>
              <div className="text-sm text-white/50">Current Streak</div>
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <TrendingUp className="text-yellow-400" size={24} />
            </div>
            <div>
              <div className="text-sm text-white/50">Win Rate</div>
              <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'betting', 'winning', 'volume', 'streak', 'special'].map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-primary text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard
              className={`p-5 border-2 ${
                achievement.unlocked
                  ? RARITY_COLORS[achievement.rarity]
                  : 'border-white/10 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`text-4xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{achievement.title}</h3>
                    {getRarityIcon(achievement.rarity)}
                    {achievement.unlocked && (
                      <CheckCircle size={16} className="text-green-400" />
                    )}
                  </div>
                  <p className="text-sm text-white/60 mb-3">{achievement.description}</p>
                  
                  {!achievement.unlocked && achievement.target && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-white/50 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${achievement.progress}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full rounded-full ${
                            achievement.rarity === 'legendary' ? 'bg-yellow-500' :
                            achievement.rarity === 'epic' ? 'bg-purple-500' :
                            achievement.rarity === 'rare' ? 'bg-blue-500' :
                            'bg-white/30'
                          }`}
                        />
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        {achievement.current} / {achievement.target}
                      </div>
                    </div>
                  )}

                  {achievement.unlocked && (
                    <Badge type="trend" className="mt-2">
                      Unlocked
                    </Badge>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 text-white/50">
          <Trophy size={48} className="mx-auto mb-4 opacity-50" />
          <p>No achievements in this category yet.</p>
        </div>
      )}
    </div>
  );
};

