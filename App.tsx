
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PieChart, ShieldCheck, Wallet, Menu, Bell, Search, Filter, LogOut, ArrowRight, Zap, Trophy, Activity, FileText, BarChart3, Sparkles } from 'lucide-react';
import { LeaderboardPanel } from './components/Leaderboard/LeaderboardPanel';
import { AchievementsPanel } from './components/Achievements/AchievementsPanel';
import { ScenarioCard } from './components/Dashboard/ScenarioCard';
import { BettingInterface } from './components/Betting/BettingInterface';
import { OrbViz } from './components/Portfolio/OrbViz';
import { ClaimableBets } from './components/Portfolio/ClaimableBets';
import { ConnectWalletModal } from './components/Auth/ConnectWalletModal';
import { NotificationPanel } from './components/Notifications/NotificationPanel';
import { Button, GlassCard, Badge } from './components/ui/GlassComponents';
import { MOCK_SCENARIOS, MOCK_USER, CATEGORIES, MOCK_NOTIFICATIONS, CONTRACT_ADDRESS } from './constants';
import { Scenario, UserProfile, UserBet, ViewState, Notification } from './types';
import { getAllScenarios, getAllUserBets, setContractAddress, isOwner, isAdmin as checkIsAdmin, claimWinnings, getMinBet, getCurrentContractAddress } from './services/contractService';
import { getUSDCBalance, formatUSDC } from './lib/web3';
import { AdminPanel } from './components/Admin/AdminPanel';
import { Whitepaper } from './components/Whitepaper/Whitepaper';
import { Footer } from './components/Footer/Footer';
import { RoulettePanel } from './components/Roulette/RoulettePanel';

// Simple mock for User Bets
const INITIAL_BETS: UserBet[] = [
    { id: 'b1', scenarioId: '1', amount: 500, position: 'YES', timestamp: Date.now(), entryPrice: 0.55, currentValue: 580 },
    { id: 'b2', scenarioId: '3', amount: 200, position: 'YES', timestamp: Date.now(), entryPrice: 0.70, currentValue: 220 },
];

const LandingView: React.FC<{ onConnect: () => void; onViewDemo: () => void }> = ({ onConnect, onViewDemo }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
       {/* Ambient Background for Landing */}
       <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[150px] animate-pulse-slow" />
       <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[120px] animate-pulse-slow" />
       
       {/* Hero Content */}
       <div className="relative z-10 max-w-4xl w-full text-center">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="mb-6 flex justify-center">
               <div className="w-20 h-20 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(67,97,238,0.4)]">
                  <span className="font-display font-bold text-4xl text-white">A</span>
               </div>
            </div>
            
            <Badge type="trend" >LIVE ON ARC TESTNET</Badge>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold mt-6 mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
               Predict the Future.<br />
               Win in <span className="text-primary">USDC</span>.
            </h1>
            
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
               Decentralized prediction markets on Arc Testnet. 
               Bet on real-world events, compete on leaderboards, and earn USDC rewards. 
               Zero gas fees, instant settlement, and transparent outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
               <Button 
                  size="lg" 
                  className="h-16 px-10 text-lg shadow-[0_0_30px_rgba(67,97,238,0.4)] hover:shadow-[0_0_50px_rgba(67,97,238,0.6)]"
                  onClick={onConnect}
               >
                  <Wallet className="mr-3" /> Connect Wallet
               </Button>
               <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-16 px-10 text-lg"
                  onClick={onViewDemo}
               >
                  View Demo <ArrowRight className="ml-2" />
               </Button>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
               <GlassCard className="p-6 bg-white/5 hover:bg-white/10 transition-colors">
                  <Zap className="text-secondary mb-4" size={32} />
                  <h3 className="text-lg font-bold mb-2">Instant Settlement</h3>
                  <p className="text-sm text-white/50">Smart contracts settle markets immediately upon resolution.</p>
               </GlassCard>
               <GlassCard className="p-6 bg-white/5 hover:bg-white/10 transition-colors">
                  <BarChart3 className="text-primary mb-4" size={32} />
                  <h3 className="text-lg font-bold mb-2">Live Markets</h3>
                  <p className="text-sm text-white/50">Bet on diverse scenarios with real-time odds and market dynamics.</p>
               </GlassCard>
               <GlassCard className="p-6 bg-white/5 hover:bg-white/10 transition-colors">
                  <Trophy className="text-accent mb-4" size={32} />
                  <h3 className="text-lg font-bold mb-2">Social Leaderboards</h3>
                  <p className="text-sm text-white/50">Compete with friends and earn badges for accuracy.</p>
               </GlassCard>
            </div>
          </motion.div>
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [user, setUser] = useState<UserProfile>({ balance: 0, activeBets: 0, totalEarnings: 0, winRate: 0 });
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Auth State
  const [isConnectModalOpen, setConnectModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load read notification IDs from localStorage
  const getReadNotificationIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem(`notifications_read_${walletAddress}`);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading read notifications:', error);
    }
    return new Set<string>();
  };

  // Save read notification IDs to localStorage
  const saveReadNotificationIds = (readIds: Set<string>) => {
    try {
      if (walletAddress) {
        localStorage.setItem(`notifications_read_${walletAddress}`, JSON.stringify(Array.from(readIds)));
      }
    } catch (error) {
      console.error('Error saving read notifications:', error);
    }
  };

  // Auto-reconnect wallet on page load
  useEffect(() => {
    const reconnectWallet = async () => {
      try {
        // Check if there's a stored wallet address
        const storedAddress = localStorage.getItem('walletAddress');
        if (!storedAddress) {
          return; // No stored wallet, user needs to connect manually
        }

        // Check if MetaMask is available
        if (typeof window.ethereum === 'undefined') {
          // MetaMask not available, clear stored address
          localStorage.removeItem('walletAddress');
          return;
        }

        // Check if the stored address is still connected
        const { getProvider } = await import('./lib/web3');
        const provider = getProvider();
        const accounts = await provider.send('eth_accounts', []);
        
        if (accounts.length > 0 && accounts[0].toLowerCase() === storedAddress.toLowerCase()) {
          // Wallet is still connected, restore session
          console.log('🔄 Auto-reconnecting wallet:', storedAddress);
          setWalletAddress(storedAddress);
          setIsLoggedIn(true);
        } else {
          // Stored address is not connected, clear it
          localStorage.removeItem('walletAddress');
        }
      } catch (error) {
        console.error('Error auto-reconnecting wallet:', error);
        // Clear stored address on error
        localStorage.removeItem('walletAddress');
      }
    };

    reconnectWallet();
  }, []);

  // Listen for MetaMask account changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') {
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        console.log('🔌 Wallet disconnected');
        handleLogout();
      } else if (accounts[0].toLowerCase() !== walletAddress?.toLowerCase()) {
        // User switched accounts
        console.log('🔄 Account changed:', accounts[0]);
        handleLogin(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Reload page on chain change to ensure proper network state
      window.location.reload();
    };

    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [walletAddress]);

  // Set contract address on mount
  useEffect(() => {
    if (CONTRACT_ADDRESS) {
      setContractAddress(CONTRACT_ADDRESS);
      // Debug: Log contract address and MIN_BET
      console.log('📋 Contract Address:', CONTRACT_ADDRESS);
      getMinBet().then(minBet => {
        console.log('💰 Contract MIN_BET:', minBet, 'USDC');
        if (minBet !== 1) {
          console.warn('⚠️ WARNING: Contract MIN_BET is', minBet, 'USDC, but expected 1 USDC. Make sure you are using the new contract address!');
        }
      }).catch(err => console.error('Error checking MIN_BET:', err));
    } else {
      console.warn('⚠️ CONTRACT_ADDRESS not set in environment variables');
    }
  }, []);

  // Load scenarios from contract (or use mock data in demo mode)
  useEffect(() => {
    const loadScenarios = async () => {
      // In demo mode, use mock scenarios
      if (isDemoMode && !isLoggedIn) {
        console.log('🎮 Demo mode: Using mock scenarios');
        setScenarios(MOCK_SCENARIOS);
        return;
      }

      if (!CONTRACT_ADDRESS) {
        // No contract address - show empty state
        console.warn('⚠️ CONTRACT_ADDRESS not set. Please update .env file with VITE_CONTRACT_ADDRESS');
        setScenarios([]);
        return;
      }

      setIsLoadingScenarios(true);
      try {
        const contractScenarios = await getAllScenarios();
        // Always use contract scenarios, even if empty (no fallback to mock)
        setScenarios(contractScenarios);
        console.log(`✅ Loaded ${contractScenarios.length} scenarios from contract ${CONTRACT_ADDRESS}`);
      } catch (error) {
        console.error('Error loading scenarios:', error);
        // On error, show empty instead of mock data
        setScenarios([]);
      } finally {
        setIsLoadingScenarios(false);
      }
    };

    loadScenarios();
    // Refresh scenarios every 30 seconds (only if not in demo mode)
    if (!isDemoMode || isLoggedIn) {
      const interval = setInterval(loadScenarios, 30000);
      return () => clearInterval(interval);
    }
  }, [CONTRACT_ADDRESS, isDemoMode, isLoggedIn]); // Re-run when contract address, demo mode, or login status changes

  // Check admin status when wallet connects
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isLoggedIn || !walletAddress) {
        setIsAdmin(false);
        return;
      }

      setIsCheckingAdmin(true);
      try {
        // Check if user is owner or admin
        console.log('[App] Checking admin status for wallet:', walletAddress);
        const adminStatus = await checkIsAdmin(walletAddress);
        console.log('[App] Admin status result:', adminStatus);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('[App] Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isLoggedIn, walletAddress]);

  // Load user balance and bets when logged in
  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoggedIn || !walletAddress) return;

      try {
        // Load USDC balance
        const balance = await getUSDCBalance(walletAddress);
        const balanceNum = parseFloat(formatUSDC(balance));

        // Load user bets
        const bets = await getAllUserBets(walletAddress);
        setUserBets(bets);

        // Calculate portfolio statistics from actual bets
        const activeBets = bets.filter(b => !b.claimed);
        const resolvedBets = bets.filter(b => {
          // Find the scenario for this bet
          const scenario = scenarios.find(s => s.id === b.scenarioId);
          return scenario?.isResolved ?? false;
        });

        // Calculate total profit (sum of claimed winnings - sum of bet amounts for resolved scenarios)
        let totalProfit = 0;
        let totalWon = 0;
        let totalLost = 0;
        let wins = 0;
        let losses = 0;

        resolvedBets.forEach(bet => {
          const scenario = scenarios.find(s => s.id === bet.scenarioId);
          if (scenario?.isResolved) {
            const userWon = (bet.position === 'YES' && scenario.outcome) || 
                          (bet.position === 'NO' && !scenario.outcome);
            
            if (userWon) {
              wins++;
              // Calculate winnings from scenario pools: (betAmount / winningPool) * (totalPool - adminFee)
              const winningPool = scenario.outcome ? (scenario.yesPool || 0) : (scenario.noPool || 0);
              const totalPool = scenario.totalVolume || 0; // Note: stored as totalVolume in Scenario
              const adminFee = scenario.adminFee || 0;
              let winnings = 0;
              
              if (winningPool > 0 && totalPool > 0) {
                const adjustedPool = totalPool - adminFee;
                if (adjustedPool > 0) {
                  winnings = (bet.amount / winningPool) * adjustedPool;
                } else {
                  // If adjusted pool is 0 or negative, user gets nothing
                  winnings = 0;
                }
              } else {
                // Fallback: if pools are 0, user gets their bet back (minus fee)
                const fee = totalPool * 0.01;
                winnings = Math.max(0, bet.amount - fee);
              }
              
              // Profit = winnings - original bet amount
              const profit = winnings - bet.amount;
              if (!isNaN(profit) && isFinite(profit)) {
                totalProfit += profit;
                totalWon += winnings;
              }
            } else {
              losses++;
              // Loss = -bet amount
              if (!isNaN(bet.amount) && isFinite(bet.amount)) {
                totalProfit -= bet.amount;
                totalLost += bet.amount;
              }
            }
          }
        });

        // Calculate win rate
        const totalResolved = wins + losses;
        const winRate = totalResolved > 0 ? Math.round((wins / totalResolved) * 100) : 0;

        // Calculate active capital (sum of unclaimed bet amounts)
        const activeCapital = activeBets.reduce((sum, bet) => sum + bet.amount, 0);

        // Update user profile with calculated values
        // Ensure totalProfit is a valid number
        const validTotalProfit = isNaN(totalProfit) || !isFinite(totalProfit) ? 0 : totalProfit;
        
        setUser({
          balance: balanceNum,
          activeBets: activeBets.length,
          totalEarnings: validTotalProfit,
          winRate: winRate,
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
    // Refresh user data every 10 seconds
    const interval = setInterval(loadUserData, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn, walletAddress, scenarios]); // Add scenarios dependency to recalculate when scenarios update

  // Generate notifications from resolved scenarios and user bets
  useEffect(() => {
    if (!isLoggedIn || !walletAddress) {
      return;
    }

    // Load previously read notification IDs
    const readIds = getReadNotificationIds();

    if (scenarios.length === 0 || userBets.length === 0) {
      // Initialize with welcome notification if logged in
      if (notifications.length === 0) {
        const welcomeRead = readIds.has('welcome');
        setNotifications([{
          id: 'welcome',
          type: 'INFO',
          title: 'Welcome to Forsightt',
          message: 'Your wallet has been successfully connected. Start trading now!',
          timestamp: 'Just now',
          read: welcomeRead
        }]);
      }
      return;
    }

    const generateNotifications = () => {
      const newNotifications: Notification[] = [];
      const now = Date.now();

      // Helper to format time ago
      const formatTimeAgo = (timestamp: number): string => {
        const seconds = Math.floor((now - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        const days = Math.floor(hours / 24);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      };

      // Check each resolved scenario
      scenarios.forEach(scenario => {
        if (!scenario.isResolved) return;

        const userBet = userBets.find(b => b.scenarioId === scenario.id);
        if (!userBet || userBet.amount === 0) return;

        const userWon = (userBet.position === 'YES' && scenario.outcome) || 
                        (userBet.position === 'NO' && !scenario.outcome);
        
        // Create notification ID based on scenario
        const notifId = `scenario-${scenario.id}`;
        
        // Check if notification already exists and if it was previously read
        const existingNotif = notifications.find(n => n.id === notifId);
        const wasRead = readIds.has(notifId);
        
        if (userWon) {
          // User won - create WIN notification
          if (!existingNotif || existingNotif.type !== 'WIN') {
            // Use calculated winnings from userBet if available (more accurate)
            // Otherwise calculate from pools
            let winnings = userBet.winnings || 0;
            let profit = 0;
            
            if (winnings === 0 || !userBet.winnings) {
              // Calculate winnings: (betAmount / winningPool) * (totalPool - adminFee)
              const winningPool = scenario.outcome ? (scenario.yesPool || 0) : (scenario.noPool || 0);
              const totalPool = scenario.totalVolume || 0; // Note: stored as totalVolume in Scenario
              const adminFee = scenario.adminFee || 0;
              
              if (winningPool > 0 && totalPool > 0) {
                const adjustedPool = totalPool - adminFee;
                if (adjustedPool > 0) {
                  winnings = (userBet.amount / winningPool) * adjustedPool;
                } else {
                  winnings = 0;
                }
              } else if (totalPool > 0) {
                // Fallback: if winning pool is 0 but total pool exists, calculate fee
                const fee = totalPool * 0.01;
                winnings = Math.max(0, userBet.amount - fee);
              } else {
                // If everything is 0, user gets nothing
                winnings = 0;
              }
            }
            
            profit = winnings - userBet.amount;
            
            // Debug log to help diagnose issues
            if (profit === 0 && userBet.amount > 0) {
              console.log('⚠️ Zero profit calculation:', {
                scenarioId: scenario.id,
                betAmount: userBet.amount,
                winnings: winnings,
                winningPool: scenario.outcome ? scenario.yesPool : scenario.noPool,
                totalPool: scenario.totalVolume,
                adminFee: scenario.adminFee,
                calculatedWinnings: userBet.winnings
              });
            }
            
            newNotifications.push({
              id: notifId,
              type: 'WIN',
              title: `Bet Won: ${scenario.title}`,
              message: `Scenario resolved ${scenario.outcome ? 'YES' : 'NO'}. You successfully predicted the outcome!`,
              amount: profit, // Show actual profit (can be negative if fee is high, but should be positive for wins)
              timestamp: formatTimeAgo((scenario.bettingDeadline || Date.now() / 1000) * 1000),
              read: existingNotif?.read ?? wasRead
            });
          }
        } else {
          // User lost - create LOSS notification
          if (!existingNotif || existingNotif.type !== 'LOSS') {
            newNotifications.push({
              id: notifId,
              type: 'LOSS',
              title: `Bet Lost: ${scenario.title}`,
              message: `Scenario resolved ${scenario.outcome ? 'YES' : 'NO'}. Better luck next time.`,
              amount: -userBet.amount,
              timestamp: formatTimeAgo((scenario.bettingDeadline || Date.now() / 1000) * 1000),
              read: existingNotif?.read ?? wasRead
            });
          }
        }

        // If winnings were claimed, update or create a claim notification
        if (userBet.claimed && userWon && userBet.winnings) {
          const claimNotifId = `claim-${scenario.id}`;
          const existingClaimNotif = notifications.find(n => n.id === claimNotifId);
          if (!existingClaimNotif) {
            newNotifications.push({
              id: claimNotifId,
              type: 'WIN',
              title: `Winnings Claimed: ${scenario.title}`,
              message: `You've successfully claimed your winnings!`,
              amount: userBet.winnings - userBet.amount,
              timestamp: 'Just now',
              read: readIds.has(claimNotifId)
            });
          }
        }
      });

      // Merge with existing notifications, avoiding duplicates
      setNotifications(prev => {
        const merged: Notification[] = [...prev];
        
        newNotifications.forEach(newNotif => {
          const existingIndex = merged.findIndex(n => n.id === newNotif.id);
          const wasRead = readIds.has(newNotif.id);
          
          if (existingIndex >= 0) {
            // Update existing notification if it changed type or amount
            // But preserve read status from localStorage
            if (merged[existingIndex].type !== newNotif.type || 
                merged[existingIndex].amount !== newNotif.amount) {
              merged[existingIndex] = {
                ...newNotif,
                read: merged[existingIndex].read || wasRead // Preserve if already read
              };
            } else {
              // Preserve read status even if notification hasn't changed
              merged[existingIndex] = {
                ...merged[existingIndex],
                read: merged[existingIndex].read || wasRead
              };
            }
          } else {
            // Add new notification at the beginning, check if it was previously read
            merged.unshift({
              ...newNotif,
              read: wasRead
            });
          }
        });

        // Keep only the 20 most recent notifications
        return merged.slice(0, 20);
      });
    };

    generateNotifications();
  }, [scenarios, userBets, isLoggedIn, walletAddress]);

  const handleLogin = (address: string) => {
    setWalletAddress(address);
    setIsLoggedIn(true);
    setConnectModalOpen(false);
    // Store wallet address in localStorage for persistence
    localStorage.setItem('walletAddress', address);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setWalletAddress(null);
    setView('DASHBOARD'); // Reset view on logout
    // Clear stored wallet address
    localStorage.removeItem('walletAddress');
  };

  const handleBet = async (amount: number, position: 'YES' | 'NO') => {
    if (!selectedScenario || !walletAddress) return;

    try {
      const { approveUSDC, getUSDCAllowance, parseUSDC } = await import('./lib/web3');
      const { getContractAddress, getScenario, placeBet } = await import('./services/contractService');
      
      const contractAddress = getContractAddress();
      if (!contractAddress) {
        alert('Contract not deployed. Please deploy the contract first.');
        return;
      }

      // Validate that the scenario exists on the contract
      const scenarioId = parseInt(selectedScenario.id);
      const contractScenario = await getScenario(scenarioId);
      
      if (!contractScenario) {
        alert(
          `Scenario ${scenarioId} does not exist on the contract.\n\n` +
          `This appears to be a mock scenario. Please:\n` +
          `1. Create scenarios on the contract first (admin panel)\n` +
          `2. Or wait for scenarios to be created by the admin`
        );
        return;
      }

      // Debug: Check contract MIN_BET
      const { getMinBet } = await import('./services/contractService');
      const { formatUSDC } = await import('./lib/web3');
      const minBet = await getMinBet();
      console.log('🔍 Debug Bet Info:');
      console.log('  Contract Address:', contractAddress);
      console.log('  Contract MIN_BET:', minBet, 'USDC');
      console.log('  Bet Amount:', amount, 'USDC');
      console.log('  Position:', position);

      // Check and approve USDC if needed
      const amountWei = parseUSDC(amount.toString());
      console.log('  Amount in Wei (6 decimals):', amountWei.toString());
      console.log('  Amount formatted back:', formatUSDC(amountWei), 'USDC');
      
      // Check if amount meets minimum
      const minBetWei = parseUSDC(minBet.toString());
      console.log('  MIN_BET in Wei:', minBetWei.toString());
      console.log('  Amount >= MIN_BET?', amountWei >= minBetWei);
      
      if (amountWei < minBetWei) {
        alert(`Bet amount (${amount} USDC) is below the contract minimum (${minBet} USDC). Please increase your bet amount.`);
        return;
      }

      const allowance = await getUSDCAllowance(walletAddress, contractAddress);
      console.log('  Current Allowance:', formatUSDC(allowance), 'USDC');
      
      if (allowance < amountWei) {
        console.log('  Approving USDC...');
        // Request approval for a larger amount (e.g., 10x the bet amount)
        const approveTx = await approveUSDC(contractAddress, amountWei * 10n);
        await approveTx.wait();
        console.log('  Approval confirmed');
      }

      // Place the bet
      console.log('  Placing bet on contract...');
      const { placeBet: placeBetContract } = await import('./services/contractService');
      const tx = await placeBetContract(
        scenarioId,
        amount,
        position === 'YES'
      );
      console.log('  Transaction sent, waiting for confirmation...');
      
      // Wait for transaction confirmation
      await tx.wait();

      // Refresh scenarios and user data
      const { getAllScenarios, getAllUserBets } = await import('./services/contractService');
      const updatedScenarios = await getAllScenarios();
      setScenarios(updatedScenarios);
      
      const updatedBets = await getAllUserBets(walletAddress);
      setUserBets(updatedBets);

      // Update user balance
      const balance = await getUSDCBalance(walletAddress);
      setUser(prev => ({
        ...prev,
        balance: parseFloat(formatUSDC(balance)),
        activeBets: updatedBets.filter(b => !b.claimed).length,
      }));

      // Add notification for successful bet placement
      const scenario = updatedScenarios.find(s => s.id === selectedScenario.id);
      if (scenario) {
        setNotifications(prev => [{
          id: `bet-${scenario.id}-${Date.now()}`,
          type: 'INFO',
          title: `Bet Placed: ${scenario.title}`,
          message: `You've placed a ${position} bet of ${amount} USDC.`,
          timestamp: 'Just now',
          read: false
        }, ...prev].slice(0, 20));
      }

      setSelectedScenario(null);
      alert('Bet placed successfully!');
    } catch (error: any) {
      console.error('Error placing bet:', error);
      
      // Parse contract revert errors for user-friendly messages
      let errorMessage = 'Failed to place bet';
      
      try {
        // Check for contract revert reason
        if (error.reason) {
          errorMessage = error.reason;
        } 
        // Check for error data
        else if (error.data?.message) {
          errorMessage = error.data.message;
        }
        // Check for revert object
        else if (error.revert?.args?.[0]) {
          errorMessage = error.revert.args[0];
        }
        // Parse error message string
        else if (error.message) {
          const msg = error.message;
          
          // Extract revert reason from various formats
          const revertMatch = msg.match(/revert(ed)?\s+"?([^"]+)"?/i) || 
                            msg.match(/reason:\s*"?([^"]+)"?/i) ||
                            msg.match(/Error:\s*"?([^"]+)"?/i);
          
          if (revertMatch && revertMatch[2]) {
            errorMessage = revertMatch[2];
          }
          // Check for specific error patterns
          else if (msg.includes('Invalid scenario')) {
            errorMessage = 'This scenario does not exist on the contract. Please create scenarios first.';
          } 
          else if (msg.includes('User already has a bet') || msg.includes('already has a bet')) {
            errorMessage = 'You already have a bet on this scenario.';
          } 
          else if (msg.includes('Betting deadline') || msg.includes('deadline has passed')) {
            errorMessage = 'The betting deadline for this scenario has passed.';
          } 
          else if (msg.includes('Bet amount below minimum')) {
            errorMessage = 'Bet amount is too low. Minimum bet is 1 USDC.';
          }
          else if (msg.includes('Bet amount exceeds maximum')) {
            errorMessage = 'Bet amount is too high. Maximum bet is 200 USDC.';
          }
          else if (msg.includes('USDC transfer failed') || msg.includes('transfer failed')) {
            errorMessage = 'USDC transfer failed. Please check your balance and approval.';
          }
          else if (msg.includes('insufficient funds') || msg.includes('insufficient balance')) {
            errorMessage = 'Insufficient USDC balance. Please add more USDC to your wallet.';
          }
          else if (msg.includes('user rejected') || msg.includes('User denied')) {
            errorMessage = 'Transaction was cancelled.';
            return; // Don't show alert for user cancellation
          }
          // For incomplete or malformed errors, show a generic message
          else if (msg.length < 10 || msg.includes('(action=')) {
            errorMessage = 'An error occurred while placing the bet. Please check the console for details.';
          }
          else {
            // Use the error message but truncate if too long
            errorMessage = msg.length > 200 ? msg.substring(0, 200) + '...' : msg;
          }
        }
      } catch (parseError) {
        // If error parsing fails, use a generic message
        errorMessage = 'An unexpected error occurred. Please check the console for details.';
      }
      
      // Only show alert if it's not a user cancellation
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('Transaction was cancelled')) {
        alert(errorMessage);
      }
    }
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    // Save to localStorage
    if (walletAddress) {
      const readIds = getReadNotificationIds();
      readIds.add(id);
      saveReadNotificationIds(readIds);
    }
  };

  const filteredScenarios = scenarios.filter(s => {
      const matchesCategory = filterCategory === 'All' || s.category === filterCategory;
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-dark text-white font-sans selection:bg-primary/30">
        
        {/* If Not Logged In, Show Landing View */}
        {!isLoggedIn && !isDemoMode ? (
          <>
            <LandingView 
              onConnect={() => setConnectModalOpen(true)} 
              onViewDemo={() => {
                setIsDemoMode(true);
                setUser(MOCK_USER);
                setUserBets(INITIAL_BETS);
                setView('DASHBOARD');
              }}
            />
            {/* Background Ambient Mesh (Persistent) */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[100px]" />
            </div>
          </>
        ) : (
          /* Authenticated App Layout or Demo Mode */
          <>
            {/* Demo Mode Banner */}
            {isDemoMode && !isLoggedIn && (
              <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-md border-b border-white/20 px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge type="trend">DEMO MODE</Badge>
                    <span className="text-sm text-white/80">Explore the platform without connecting your wallet</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setIsDemoMode(false);
                      setView('DASHBOARD');
                    }}
                  >
                    Exit Demo
                  </Button>
                </div>
              </div>
            )}

            {/* Background Ambient Mesh */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[100px] animate-pulse-slow" />
            </div>

            {/* Sidebar / Navigation (Desktop) */}
            <nav className="fixed left-0 top-0 h-full w-20 hidden lg:flex flex-col items-center py-8 border-r border-white/5 bg-black/20 backdrop-blur-md z-40">
                <div className="mb-12 relative group">
                    <div 
                        className="w-10 h-10 bg-gradient-to-tr from-primary to-secondary rounded-lg flex items-center justify-center font-display font-bold text-xl cursor-pointer hover:scale-110 transition-transform" 
                        onClick={() => setView('DASHBOARD')}
                        aria-label="Home"
                    >
                        A
                    </div>
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black/90 backdrop-blur-sm text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/10 shadow-lg">
                        Home
                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-black/90"></div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-8 w-full items-center">
                    <NavIcon icon={<LayoutDashboard />} active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} tooltip="Dashboard" />
                    <NavIcon icon={<PieChart />} active={view === 'PORTFOLIO'} onClick={() => setView('PORTFOLIO')} tooltip="Portfolio" />
                    <NavIcon icon={<Sparkles />} active={view === 'ROULETTE'} onClick={() => setView('ROULETTE')} tooltip="Roulette" />
                    <NavIcon icon={<Trophy />} active={view === 'ACHIEVEMENTS'} onClick={() => setView('ACHIEVEMENTS')} tooltip="Achievements" />
                    <NavIcon icon={<BarChart3 />} active={view === 'LEADERBOARD'} onClick={() => setView('LEADERBOARD')} tooltip="Leaderboard" />
                    <NavIcon icon={<ShieldCheck />} active={view === 'ADMIN'} onClick={() => setView('ADMIN')} tooltip="Admin" />
                    <NavIcon icon={<FileText />} active={view === 'WHITEPAPER'} onClick={() => setView('WHITEPAPER')} tooltip="Whitepaper" />
                </div>

                <div className="mt-auto">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-white/20" />
                </div>
            </nav>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full h-16 lg:hidden bg-black/80 backdrop-blur-xl border-t border-white/10 z-40 flex justify-around items-center px-4">
                 <NavIcon icon={<LayoutDashboard />} active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} mobile tooltip="Dashboard" />
                 <NavIcon icon={<PieChart />} active={view === 'PORTFOLIO'} onClick={() => setView('PORTFOLIO')} mobile tooltip="Portfolio" />
                 <NavIcon icon={<Sparkles />} active={view === 'ROULETTE'} onClick={() => setView('ROULETTE')} mobile tooltip="Roulette" />
                 <NavIcon icon={<Trophy />} active={view === 'ACHIEVEMENTS'} onClick={() => setView('ACHIEVEMENTS')} mobile tooltip="Achievements" />
                 <NavIcon icon={<BarChart3 />} active={view === 'LEADERBOARD'} onClick={() => setView('LEADERBOARD')} mobile tooltip="Leaderboard" />
                 <NavIcon icon={<ShieldCheck />} active={view === 'ADMIN'} onClick={() => setView('ADMIN')} mobile tooltip="Admin" />
                 <NavIcon icon={<FileText />} active={view === 'WHITEPAPER'} onClick={() => setView('WHITEPAPER')} mobile tooltip="Whitepaper" />
            </nav>

            {/* Main Content Area */}
            <main className={`lg:pl-20 min-h-screen ${isDemoMode && !isLoggedIn ? 'pt-16' : ''}`}>
                {/* Header */}
                <header className="sticky top-0 z-30 px-6 py-4 flex justify-between items-center bg-dark/80 backdrop-blur-md border-b border-white/5">
                    <h1 className="text-xl font-display font-bold lg:hidden">Forsightt</h1>
                    
                    {/* Search Bar (Desktop) */}
                    <div className="hidden md:flex items-center gap-4 flex-1 max-w-xl ml-8">
                         <div className="relative w-full group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search markets..." 
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                         </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs text-white/40 font-mono">USDC BALANCE</span>
                            <span className="text-lg font-mono font-bold text-secondary">${user.balance.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="hidden md:flex font-mono text-xs">
                                <Wallet size={14} className="mr-2 text-secondary" /> 
                                {walletAddress}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleLogout} title="Disconnect">
                                <LogOut size={16} />
                            </Button>
                        </div>

                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70'}`}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-[#0A0A0A]" />
                                )}
                            </button>
                            <AnimatePresence>
                                {showNotifications && (
                                    <NotificationPanel 
                                        isOpen={showNotifications}
                                        notifications={notifications}
                                        onClose={() => setShowNotifications(false)}
                                        onMarkRead={handleMarkRead}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <div className="p-6 pb-24 lg:pb-6 max-w-7xl mx-auto">
                    {view === 'DASHBOARD' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            {/* Hero Section */}
                            <div className="mb-10">
                                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 to-purple-900/20 border border-white/10 p-8 flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[80px]" />
                                    <Badge type="new" >NEW ON ARC</Badge>
                                    <h1 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-2 leading-tight">
                                        Live Markets
                                    </h1>
                                    <p className="text-white/60 mb-6 max-w-md">Explore trending scenarios and place your bets with zero gas fees.</p>
                                    <div className="flex gap-4">
                                        <Button onClick={() => {
                                            setFilterCategory('All');
                                            setSearchQuery('');
                                            // Scroll to scenarios section
                                            setTimeout(() => {
                                                const scenariosSection = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
                                                if (scenariosSection) {
                                                    scenariosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }, 100);
                                        }}>View All</Button>
                                    </div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                                {CATEGORIES.map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filterCategory === cat ? 'bg-white text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Grid */}
                            {isLoadingScenarios ? (
                                <div className="text-center py-12">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <p className="mt-4 text-white/60">Loading scenarios...</p>
                                </div>
                            ) : filteredScenarios.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-white/60">No scenarios found. Create one in the admin panel!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredScenarios.map(scenario => (
                                        <ScenarioCard 
                                            key={scenario.id} 
                                            scenario={scenario} 
                                            onSelect={setSelectedScenario} 
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {view === 'PORTFOLIO' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2 className="text-3xl font-display font-bold mb-6">Your Performance</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <GlassCard className="p-6">
                                    <span className="text-sm text-white/50">Total Profit</span>
                                    <div className={`text-3xl font-mono mt-1 ${user.totalEarnings >= 0 ? 'text-secondary' : 'text-red-400'}`}>
                                      {user.totalEarnings >= 0 ? '+' : ''}{user.totalEarnings.toFixed(2)} USDC
                                    </div>
                                </GlassCard>
                                <GlassCard className="p-6">
                                    <span className="text-sm text-white/50">Win Rate</span>
                                    <div className="text-3xl font-mono text-primary mt-1">{user.winRate}%</div>
                                </GlassCard>
                                <GlassCard className="p-6">
                                    <span className="text-sm text-white/50">Active Capital</span>
                                    <div className="text-3xl font-mono text-white mt-1">
                                      ${userBets
                                        .filter(b => !b.claimed && !scenarios.find(s => s.id === b.scenarioId)?.isResolved)
                                        .reduce((sum, bet) => sum + bet.amount, 0)
                                        .toFixed(2)}
                                    </div>
                                </GlassCard>
                            </div>
                            <ClaimableBets 
                                bets={userBets} 
                                scenarios={scenarios}
                                onClaimSuccess={async () => {
                                    // Refresh data after claiming
                                    if (walletAddress) {
                                        const updatedBets = await getAllUserBets(walletAddress);
                                        setUserBets(updatedBets);
                                        const balance = await getUSDCBalance(walletAddress);
                                        setUser(prev => ({
                                            ...prev,
                                            balance: parseFloat(formatUSDC(balance)),
                                        }));
                                    }
                                }}
                            />
                            
                            {/* User Betting History Table */}
                            <GlassCard className="p-6 mt-6">
                                <h3 className="text-xl font-display font-bold mb-4">Your Bets</h3>
                                {userBets.length === 0 ? (
                                    <div className="text-center py-12 text-white/50">
                                        <p>No bets placed yet. Start betting on scenarios to see them here!</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Scenario</th>
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Position</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">Bet Amount</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">Status</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">Winnings</th>
                                                    <th className="text-center py-3 px-4 text-sm font-medium text-white/60">Claimed</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userBets.map((bet) => {
                                                    const scenario = scenarios.find(s => s.id === bet.scenarioId);
                                                    const isResolved = scenario?.isResolved ?? false;
                                                    const userWon = isResolved && scenario && (
                                                        (bet.position === 'YES' && scenario.outcome) ||
                                                        (bet.position === 'NO' && !scenario.outcome)
                                                    );
                                                    
                                                    // Calculate winnings if resolved and won
                                                    let winnings = 0;
                                                    if (isResolved && userWon && scenario) {
                                                        const winningPool = scenario.outcome ? (scenario.yesPool || 0) : (scenario.noPool || 0);
                                                        const totalPool = scenario.totalVolume || 0;
                                                        const adminFee = scenario.adminFee || 0;
                                                        
                                                        if (winningPool > 0 && totalPool > 0) {
                                                            const adjustedPool = totalPool - adminFee;
                                                            if (adjustedPool > 0) {
                                                                winnings = (bet.amount / winningPool) * adjustedPool;
                                                            }
                                                        }
                                                    }
                                                    
                                                    const profit = winnings - bet.amount;
                                                    
                                                    return (
                                                        <tr key={bet.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                            <td className="py-3 px-4">
                                                                <div className="font-medium text-white">{scenario?.title || `Scenario #${bet.scenarioId}`}</div>
                                                                <div className="text-xs text-white/50 mt-1">{scenario?.category || 'Unknown'}</div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                    bet.position === 'YES' 
                                                                        ? 'bg-secondary/20 text-secondary' 
                                                                        : 'bg-accent/20 text-accent'
                                                                }`}>
                                                                    {bet.position}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-mono text-white">
                                                                ${bet.amount.toFixed(2)} USDC
                                                            </td>
                                                            <td className="py-3 px-4 text-right">
                                                                {!isResolved ? (
                                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500">
                                                                        Active
                                                                    </span>
                                                                ) : userWon ? (
                                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary">
                                                                        Won
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
                                                                        Lost
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-mono">
                                                                {isResolved && userWon ? (
                                                                    <span className={profit >= 0 ? 'text-secondary' : 'text-red-400'}>
                                                                        {profit >= 0 ? '+' : ''}{profit.toFixed(2)} USDC
                                                                    </span>
                                                                ) : isResolved ? (
                                                                    <span className="text-white/30">-</span>
                                                                ) : (
                                                                    <span className="text-white/30">Pending</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                {bet.claimed ? (
                                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
                                                                        ✓ Claimed
                                                                    </span>
                                                                ) : isResolved && userWon ? (
                                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                                                                        Claimable
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-white/30">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </GlassCard>
                        </motion.div>
                    )}

                    {view === 'WHITEPAPER' && (
                        <Whitepaper />
                    )}

                    {view === 'ACHIEVEMENTS' && (
                        <>
                            {!isLoggedIn ? (
                                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                                    <Trophy size={48} className="text-white/20 mb-4" />
                                    <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
                                    <p className="text-white/50 mt-2">
                                        Connect your wallet to view your achievements and conquers.
                                    </p>
                                </div>
                            ) : (
                                <AchievementsPanel
                                    walletAddress={walletAddress!}
                                    userBets={userBets}
                                    scenarios={scenarios}
                                    totalProfit={user.totalEarnings}
                                    winRate={user.winRate}
                                />
                            )}
                        </>
                    )}

                    {view === 'LEADERBOARD' && (
                        <LeaderboardPanel
                            walletAddress={walletAddress}
                            scenarios={scenarios}
                        />
                    )}
                    
                    {view === 'ROULETTE' && (
                        <RoulettePanel 
                            walletAddress={walletAddress}
                            isAdmin={isAdmin}
                        />
                    )}
                    
                    {view === 'ADMIN' && (
                        <>
                            {isCheckingAdmin ? (
                                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                                    <p className="text-white/60">Checking admin access...</p>
                                </div>
                            ) : isAdmin ? (
                                <AdminPanel walletAddress={walletAddress!} />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                                    <ShieldCheck size={48} className="text-white/20 mb-4" />
                                    <h2 className="text-2xl font-bold">Admin Panel Restricted</h2>
                                    <p className="text-white/50 mt-2">
                                        Your wallet ({walletAddress?.substring(0, 6)}...{walletAddress?.substring(38)}) is not the contract owner.
                                    </p>
                                    <p className="text-white/40 mt-1 text-sm">
                                        Only the contract owner can access the admin panel.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Footer */}
            <Footer />

            {/* Modal */}
            <AnimatePresence>
                {selectedScenario && (
                    <BettingInterface 
                        scenario={selectedScenario} 
                        onClose={() => setSelectedScenario(null)} 
                        onBet={handleBet}
                    />
                )}
            </AnimatePresence>
          </>
        )}

        {/* Wallet Connect Modal (Global) */}
        <AnimatePresence>
            {isConnectModalOpen && (
                <ConnectWalletModal 
                    isOpen={isConnectModalOpen} 
                    onClose={() => setConnectModalOpen(false)}
                    onLogin={handleLogin}
                />
            )}
        </AnimatePresence>
    </div>
  );
};

const NavIcon = ({ icon, active, onClick, mobile, tooltip }: { icon: React.ReactNode, active: boolean, onClick: () => void, mobile?: boolean, tooltip?: string }) => (
    <div className="relative group">
        <button 
            onClick={onClick}
            className={`
                relative p-3 rounded-xl transition-all duration-300
                ${active ? 'text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}
            `}
            aria-label={tooltip}
        >
            {active && (
                <motion.div 
                    layoutId={mobile ? "navIndicatorMobile" : "navIndicator"}
                    className={`absolute inset-0 bg-primary/20 rounded-xl border border-primary/50 shadow-[0_0_15px_rgba(67,97,238,0.3)]`} 
                />
            )}
            <div className="relative z-10">{icon}</div>
        </button>
        
        {/* Tooltip */}
        {tooltip && (
            <>
                {/* Desktop tooltip (left side) */}
                {!mobile && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black/90 backdrop-blur-sm text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/10 shadow-lg">
                        {tooltip}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-black/90"></div>
                    </div>
                )}
                
                {/* Mobile tooltip (above) */}
                {mobile && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 backdrop-blur-sm text-white text-xs font-medium rounded whitespace-nowrap opacity-0 group-active:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/10 shadow-lg">
                        {tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black/90"></div>
                    </div>
                )}
            </>
        )}
    </div>
);

export default App;
