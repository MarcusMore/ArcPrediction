import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Coins, Trophy, Zap, Gift, X } from 'lucide-react';
import { Button, GlassCard, Badge } from '../ui/GlassComponents';
import { 
  getPrizePool, 
  getSpinCost, 
  getAllPrizeTiers, 
  spin, 
  fundPrizePool,
  getRouletteStats,
  PrizeTier,
  setRouletteContractAddress,
  getRouletteContractAddress,
  isRouletteReady,
  canUserSpin
} from '../../services/rouletteService';
import { getUSDCBalance, formatUSDC } from '../../lib/web3';
import { CONTRACT_ADDRESS, USDC_ADDRESS, ROULETTE_CONTRACT_ADDRESS } from '../../constants';

interface RoulettePanelProps {
  walletAddress: string | null;
  isAdmin?: boolean;
}

export const RoulettePanel: React.FC<RoulettePanelProps> = ({ walletAddress, isAdmin = false }) => {
  const [prizePool, setPrizePool] = useState<number>(0);
  const [spinCost, setSpinCost] = useState<number>(0);
  const [prizeTiers, setPrizeTiers] = useState<PrizeTier[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<{ prize: number; name: string } | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [fundAmount, setFundAmount] = useState<string>('100');
  const [isFunding, setIsFunding] = useState(false);
  const [stats, setStats] = useState({ totalSpins: 0, totalPrizesWon: 0, totalPrizeAmount: 0 });
  const [balance, setBalance] = useState<number>(0);
  const [contractNotSet, setContractNotSet] = useState<boolean>(false);
  const [rouletteReady, setRouletteReady] = useState<{ ready: boolean; reason?: string }>({ ready: false });
  const [canSpin, setCanSpin] = useState<{ canSpin: boolean; timeRemaining: number; message?: string }>({ canSpin: true, timeRemaining: 0 });

  // Initialize contract address
  useEffect(() => {
    const rouletteAddress = ROULETTE_CONTRACT_ADDRESS;
    if (rouletteAddress) {
      setRouletteContractAddress(rouletteAddress);
      setContractNotSet(false);
    } else {
      setContractNotSet(true);
    }
  }, []);

  // Load roulette data
  useEffect(() => {
    if (contractNotSet) return; // Don't try to load if contract not set

    const loadData = async () => {
      try {
        const contractAddress = getRouletteContractAddress();
        if (!contractAddress) {
          return;
        }

        const [pool, cost, tiers, rouletteStats, ready] = await Promise.all([
          getPrizePool(),
          getSpinCost(),
          getAllPrizeTiers(),
          getRouletteStats(),
          isRouletteReady(),
        ]);

        setPrizePool(pool);
        setSpinCost(cost);
        setPrizeTiers(tiers);
        setStats(rouletteStats);
        setRouletteReady(ready);

        // Check if user can spin
        if (walletAddress) {
          const spinStatus = await canUserSpin(walletAddress);
          setCanSpin(spinStatus);
        }
      } catch (error) {
        console.error('Error loading roulette data:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [contractNotSet, walletAddress]);

  // Load user balance
  useEffect(() => {
    const loadBalance = async () => {
      if (!walletAddress) return;
      try {
        const bal = await getUSDCBalance(walletAddress);
        setBalance(parseFloat(formatUSDC(bal)));
      } catch (error) {
        console.error('Error loading balance:', error);
      }
    };

    loadBalance();
    const interval = setInterval(loadBalance, 5000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  const handleSpin = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet');
      return;
    }

    if (isSpinning) return;
    if (balance < spinCost) {
      alert(`Insufficient balance. You need ${spinCost} USDC to spin.`);
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    setLastResult(null);

    try {
      const result = await spin();
      setLastResult({ prize: result.prizeWon, name: result.prizeName });
      setShowResult(true);
      
      // Refresh data
      const [pool, rouletteStats, spinStatus] = await Promise.all([
        getPrizePool(),
        getRouletteStats(),
        walletAddress ? canUserSpin(walletAddress) : Promise.resolve({ canSpin: true, timeRemaining: 0 }),
      ]);
      setPrizePool(pool);
      setStats(rouletteStats);
      if (walletAddress) {
        setCanSpin(spinStatus);
        const bal = await getUSDCBalance(walletAddress);
        setBalance(parseFloat(formatUSDC(bal)));
      }
    } catch (error: any) {
      console.error('Error spinning:', error);
      let errorMessage = 'Failed to spin roulette';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.reason) {
        errorMessage = error.reason;
      }
      
      // Don't show alert for user cancellation
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('Transaction was cancelled')) {
        alert(errorMessage);
      }
    } finally {
      setIsSpinning(false);
    }
  };

  const handleFund = async () => {
    if (!walletAddress || !isAdmin) {
      alert('Only admins can fund the prize pool');
      return;
    }

    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (balance < amount) {
      alert(`Insufficient balance. You need ${amount} USDC.`);
      return;
    }

    setIsFunding(true);
    try {
      const tx = await fundPrizePool(amount);
      await tx.wait();
      alert(`Successfully funded ${amount} USDC to prize pool!`);
      setFundAmount('100');
      
      // Refresh data
      const pool = await getPrizePool();
      setPrizePool(pool);
      
      if (walletAddress) {
        const bal = await getUSDCBalance(walletAddress);
        setBalance(parseFloat(formatUSDC(bal)));
      }
    } catch (error: any) {
      console.error('Error funding prize pool:', error);
      let errorMessage = 'Failed to fund prize pool';
      if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setIsFunding(false);
    }
  };

  // Calculate probability percentage
  const getProbabilityPercent = (probability: number): string => {
    return ((probability / 10000) * 100).toFixed(2);
  };

  // Show message if contract not set
  if (contractNotSet) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
              <Sparkles className="text-primary" size={32} />
              Premium Roulette
            </h2>
            <p className="text-white/60">Spin the wheel and win amazing prizes!</p>
          </div>
        </div>

        <GlassCard className="p-8 text-center">
          <Sparkles className="text-white/20 mx-auto mb-4" size={64} />
          <h3 className="text-2xl font-display font-bold mb-4">Roulette Contract Not Deployed</h3>
          <p className="text-white/60 mb-6 max-w-2xl mx-auto">
            The Roulette contract needs to be deployed before you can use this feature. 
            Please deploy the contract and add the address to your environment variables.
          </p>
          
          <div className="bg-white/5 rounded-xl p-6 text-left max-w-xl mx-auto">
            <h4 className="font-bold mb-3 text-white">Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-2 text-white/80 text-sm">
              <li>Deploy the Roulette contract:
                <code className="block mt-1 p-2 bg-black/30 rounded text-xs font-mono">
                  npm run deploy-roulette
                </code>
              </li>
              <li>Add the contract address to your <code className="bg-black/30 px-1 rounded">.env</code> file:
                <code className="block mt-1 p-2 bg-black/30 rounded text-xs font-mono">
                  VITE_ROULETTE_CONTRACT_ADDRESS=0x...your_contract_address
                </code>
              </li>
              <li>Restart your development server</li>
              <li>Fund the prize pool using the admin panel</li>
            </ol>
          </div>

          {isAdmin && (
            <div className="mt-6">
              <Badge type="trend">Admin: You can deploy the contract</Badge>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
            <Sparkles className="text-primary" size={32} />
            Premium Roulette
          </h2>
          <p className="text-white/60">Spin the wheel and win amazing prizes!</p>
        </div>
        {isAdmin && (
          <Badge type="trend">Admin</Badge>
        )}
      </div>

      {/* Prize Pool & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Prize Pool</span>
            <Coins className="text-secondary" size={20} />
          </div>
          <div className="text-3xl font-mono font-bold text-secondary">
            {prizePool.toFixed(2)} USDC
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Spin Cost</span>
            <Zap className="text-primary" size={20} />
          </div>
          <div className="text-3xl font-mono font-bold text-primary">
            {spinCost.toFixed(2)} USDC
          </div>
        </GlassCard>
        
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">Total Spins</span>
            <Trophy className="text-accent" size={20} />
          </div>
          <div className="text-3xl font-mono font-bold text-accent">
            {stats.totalSpins}
          </div>
        </GlassCard>
      </div>

      {/* Main Roulette Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roulette Wheel */}
        <div className="lg:col-span-2">
          <GlassCard className="p-8">
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              {/* Roulette Wheel Animation */}
              <div className="relative w-64 h-64 mb-8">
                <motion.div
                  animate={{
                    rotate: isSpinning ? 3600 : 0,
                  }}
                  transition={{
                    duration: isSpinning ? 3 : 0,
                    ease: "easeOut",
                  }}
                  className="w-full h-full rounded-full border-8 border-primary/30 relative overflow-hidden"
                  style={{
                    background: 'conic-gradient(from 0deg, #ff0000 0deg 40deg, #000000 40deg 80deg, #ff0000 80deg 120deg, #000000 120deg 160deg, #ff0000 160deg 200deg, #000000 200deg 240deg, #ff0000 240deg 280deg, #000000 280deg 320deg, #ff0000 320deg 360deg)',
                  }}
                >
                  {/* Center circle */}
                  <div className="absolute inset-8 rounded-full bg-dark border-4 border-white/20 flex items-center justify-center">
                    {isSpinning ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="text-primary" size={32} />
                      </motion.div>
                    ) : (
                      <Sparkles className="text-white/40" size={32} />
                    )}
                  </div>
                </motion.div>
                
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
                </div>
              </div>

              {/* Spin Button */}
              <Button
                size="lg"
                onClick={handleSpin}
                disabled={isSpinning || !walletAddress || balance < spinCost || !rouletteReady.ready || !canSpin.canSpin}
                className="min-w-[200px] h-14 text-lg font-bold"
              >
                {isSpinning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <Zap size={20} />
                    </motion.div>
                    Spinning...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2" size={20} />
                    Spin ({spinCost.toFixed(2)} USDC)
                  </>
                )}
              </Button>

              {!walletAddress && (
                <p className="text-sm text-white/50 mt-4">Connect wallet to play</p>
              )}
              {walletAddress && balance < spinCost && (
                <p className="text-sm text-red-400 mt-4">
                  Insufficient balance. Need {spinCost.toFixed(2)} USDC
                </p>
              )}
              {walletAddress && balance >= spinCost && !canSpin.canSpin && canSpin.message && (
                <p className="text-sm text-yellow-400 mt-4 max-w-md text-center">
                  {canSpin.message}
                </p>
              )}
              {walletAddress && balance >= spinCost && canSpin.canSpin && !rouletteReady.ready && rouletteReady.reason && (
                <p className="text-sm text-yellow-400 mt-4 max-w-md text-center">
                  {rouletteReady.reason}
                </p>
              )}
              {walletAddress && balance >= spinCost && canSpin.canSpin && rouletteReady.ready && (
                <p className="text-sm text-green-400 mt-4">
                  ✓ Ready to spin! (1 spin per day)
                </p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Prize Tiers */}
        <div>
          <GlassCard className="p-6">
            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Gift size={20} className="text-primary" />
              Prize Tiers
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {prizeTiers.map((tier, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-white">{tier.name}</div>
                    <div className="text-sm text-white/50">
                      {getProbabilityPercent(tier.probability)}% chance
                    </div>
                  </div>
                  <div className="text-lg font-mono font-bold text-secondary">
                    {tier.amount > 0 ? `${tier.amount.toFixed(2)} USDC` : 'Nothing'}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && lastResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative"
            >
              <GlassCard className="p-8 max-w-md w-full text-center">
                <button
                  onClick={() => setShowResult(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white"
                >
                  <X size={24} />
                </button>
                
                {lastResult.prize > 0 ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="mb-6"
                    >
                      <Trophy className="text-accent mx-auto" size={64} />
                    </motion.div>
                    <h3 className="text-3xl font-display font-bold mb-2 text-accent">
                      Congratulations!
                    </h3>
                    <p className="text-xl text-white/80 mb-4">You won:</p>
                    <div className="text-4xl font-mono font-bold text-secondary mb-2">
                      {lastResult.prize.toFixed(2)} USDC
                    </div>
                    <p className="text-white/60">{lastResult.name}</p>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="mb-6"
                    >
                      <Sparkles className="text-white/40 mx-auto" size={64} />
                    </motion.div>
                    <h3 className="text-3xl font-display font-bold mb-2">
                      Better Luck Next Time!
                    </h3>
                    <p className="text-white/60">You didn't win this time, but keep trying!</p>
                  </>
                )}
                
                <Button
                  onClick={() => setShowResult(false)}
                  className="mt-6"
                >
                  Close
                </Button>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Fund Panel */}
      {isAdmin && (
        <GlassCard className="p-6">
          <h3 className="text-xl font-display font-bold mb-4">Fund Prize Pool (Admin)</h3>
          <div className="flex gap-4">
            <input
              type="number"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              placeholder="Amount in USDC"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary/50"
              min="0"
              step="0.01"
            />
            <Button
              onClick={handleFund}
              disabled={isFunding}
              variant="outline"
            >
              {isFunding ? 'Funding...' : 'Fund Pool'}
            </Button>
          </div>
          <p className="text-sm text-white/50 mt-2">
            Your balance: {balance.toFixed(2)} USDC
          </p>
        </GlassCard>
      )}

      {/* Statistics */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-display font-bold mb-4">Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-white/50 mb-1">Total Spins</div>
            <div className="text-2xl font-mono font-bold">{stats.totalSpins}</div>
          </div>
          <div>
            <div className="text-sm text-white/50 mb-1">Prizes Won</div>
            <div className="text-2xl font-mono font-bold text-secondary">{stats.totalPrizesWon}</div>
          </div>
          <div>
            <div className="text-sm text-white/50 mb-1">Total Prizes Paid</div>
            <div className="text-2xl font-mono font-bold text-accent">
              {stats.totalPrizeAmount.toFixed(2)} USDC
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

