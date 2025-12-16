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
  canUserSpin,
  getExtraSpinCost
} from '../../services/rouletteService';
import { getUSDCBalance, formatUSDC } from '../../lib/web3';
import { CONTRACT_ADDRESS, USDC_ADDRESS, ROULETTE_CONTRACT_ADDRESS } from '../../constants';

interface RoulettePanelProps {
  walletAddress: string | null;
  isAdmin?: boolean;
}

// Helper function to format time in seconds to readable format
const formatTime = (seconds: number): string => {
  if (seconds <= 0) return 'now';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

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
  const [extraSpinCost, setExtraSpinCost] = useState<number>(5);

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

        const [pool, cost, tiers, rouletteStats, ready, extraCost] = await Promise.all([
          getPrizePool(),
          getSpinCost(),
          getAllPrizeTiers(),
          getRouletteStats(),
          isRouletteReady(),
          getExtraSpinCost(),
        ]);

        setPrizePool(pool);
        setSpinCost(cost);
        setPrizeTiers(tiers);
        setStats(rouletteStats);
        setRouletteReady(ready);
        setExtraSpinCost(extraCost);

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
      alert('🔗 Please connect your wallet to play the roulette.');
      return;
    }

    if (isSpinning) return;
    
    // Calculate total cost (if needs extra spin, it's just 5 USDC, otherwise normal spin cost)
    const totalCost = canSpin.canSpin ? spinCost : extraSpinCost;
    
    if (balance < totalCost) {
      const costMessage = canSpin.canSpin 
        ? `💰 Insufficient balance. You need ${spinCost.toFixed(2)} USDC to spin.`
        : `💰 Insufficient balance. You need ${extraSpinCost.toFixed(2)} USDC to spin again.`;
      alert(costMessage);
      return;
    }

    setShowResult(false);
    setLastResult(null);

    try {
      // Execute spin transaction first (payment happens here)
      const result = await spin();
      
      // Only start animation after payment is confirmed
      setIsSpinning(true);
      
      // Wait for animation to complete (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Show result after animation
      setLastResult({ prize: result.prizeWon, name: result.prizeName });
      setShowResult(true);
      setIsSpinning(false);
      
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
      let errorMessage = 'Oops! Something went wrong while spinning the roulette.';
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        
        // User-friendly error messages
        if (msg.includes('cancelled') || msg.includes('user denied') || msg.includes('user rejected')) {
          // Don't show alert for user cancellation
          setIsSpinning(false);
          return;
        } else if (msg.includes('rate limit') || msg.includes('rate limited')) {
          errorMessage = '⏳ The network is busy right now. Please wait a few seconds and try again.';
        } else if (msg.includes('insufficient balance') || msg.includes('insufficient funds')) {
          errorMessage = `💰 Insufficient balance. You need ${totalCost.toFixed(2)} USDC to spin.`;
        } else if (msg.includes('prize pool is empty')) {
          errorMessage = '🎁 The prize pool is empty. Please wait for the admin to add funds.';
        } else if (msg.includes('spin cost not set')) {
          errorMessage = '⚙️ The roulette is not configured yet. Please contact support.';
        } else if (msg.includes('paused') || msg.includes('contract is paused')) {
          errorMessage = '⏸️ The roulette is temporarily paused. Please check back later.';
        } else if (msg.includes('wait 24 hours') || msg.includes('can only spin once per day')) {
          errorMessage = '⏰ You can spin again in 24 hours, or pay 5 USDC for an extra spin now.';
        } else if (msg.includes('transfer failed') || msg.includes('approval')) {
          errorMessage = '💳 Payment failed. Please check your USDC balance and try approving the transaction again.';
        } else if (msg.includes('network') || msg.includes('connection')) {
          errorMessage = '🌐 Network connection issue. Please check your internet connection and try again.';
        } else if (msg.includes('revert') || msg.includes('execution reverted')) {
          // Try to extract a more friendly message from revert reason
          const revertMatch = error.message.match(/revert(ed)?\s+"?([^"]+)"?/i) || 
                             error.message.match(/reason:\s*"?([^"]+)"?/i);
          if (revertMatch && (revertMatch[2] || revertMatch[1])) {
            const revertReason = (revertMatch[2] || revertMatch[1]).toLowerCase();
            if (revertReason.includes('prize pool')) {
              errorMessage = '🎁 The prize pool needs more funds. Please wait for the admin to add funds.';
            } else if (revertReason.includes('paused')) {
              errorMessage = '⏸️ The roulette is temporarily paused. Please check back later.';
            } else {
              errorMessage = `❌ Transaction failed: ${revertMatch[2] || revertMatch[1]}`;
            }
          } else {
            errorMessage = '❌ Transaction failed. Please try again or contact support if the problem persists.';
          }
        } else {
          // Use the original message but make it more friendly
          errorMessage = error.message;
        }
      } else if (error.reason) {
        errorMessage = error.reason;
      }
      
      // Make sure to reset spinning state if error occurs
      setIsSpinning(false);
      
      alert(errorMessage);
    }
  };

  const handleFund = async () => {
    if (!walletAddress || !isAdmin) {
      alert('🔒 Only admins can fund the prize pool.');
      return;
    }

    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('❌ Please enter a valid amount (greater than 0).');
      return;
    }

    if (balance < amount) {
      alert(`💰 Insufficient balance. You need ${amount.toFixed(2)} USDC to fund the prize pool.`);
      return;
    }

    setIsFunding(true);
    try {
      const tx = await fundPrizePool(amount);
      await tx.wait();
      alert(`✅ Successfully funded ${amount.toFixed(2)} USDC to the prize pool!`);
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
      let errorMessage = '❌ Failed to fund the prize pool.';
      
      if (error.message) {
        const msg = error.message.toLowerCase();
        
        if (msg.includes('cancelled') || msg.includes('user denied') || msg.includes('user rejected')) {
          // Don't show alert for user cancellation
          setIsFunding(false);
          return;
        } else if (msg.includes('rate limit') || msg.includes('rate limited')) {
          errorMessage = '⏳ The network is busy right now. Please wait a few seconds and try again.';
        } else if (msg.includes('insufficient balance') || msg.includes('insufficient funds')) {
          errorMessage = `💰 Insufficient balance. You need ${amount.toFixed(2)} USDC to fund the prize pool.`;
        } else if (msg.includes('approval') || msg.includes('transfer failed')) {
          errorMessage = '💳 Payment failed. Please check your USDC balance and try approving the transaction again.';
        } else if (msg.includes('network') || msg.includes('connection')) {
          errorMessage = '🌐 Network connection issue. Please check your internet connection and try again.';
        } else {
          errorMessage = `❌ ${error.message}`;
        }
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
              <div className="relative w-80 h-80 mb-8">
                <motion.div
                  animate={{
                    rotate: isSpinning ? 3600 : 0,
                  }}
                  transition={{
                    duration: isSpinning ? 3 : 0,
                    ease: "easeOut",
                  }}
                  className="w-full h-full rounded-full border-8 border-primary/30 relative overflow-hidden"
                >
                  {/* Prize Tiers on Wheel */}
                  <svg className="w-full h-full" viewBox="0 0 400 400">
                    {prizeTiers.map((tier, index) => {
                      const totalProbability = prizeTiers.reduce((sum, t) => sum + t.probability, 0);
                      const startAngle = prizeTiers.slice(0, index).reduce((sum, t) => sum + (t.probability / totalProbability) * 360, 0);
                      const angle = (tier.probability / totalProbability) * 360;
                      const endAngle = startAngle + angle;
                      
                      // Convert to radians (SVG starts at top, so subtract 90 degrees)
                      const startRad = (startAngle - 90) * (Math.PI / 180);
                      const endRad = (endAngle - 90) * (Math.PI / 180);
                      const centerX = 200;
                      const centerY = 200;
                      const radius = 180;
                      
                      const x1 = centerX + radius * Math.cos(startRad);
                      const y1 = centerY + radius * Math.sin(startRad);
                      const x2 = centerX + radius * Math.cos(endRad);
                      const y2 = centerY + radius * Math.sin(endRad);
                      
                      // Determine color based on tier
                      const isAvailable = tier.available !== false;
                      const bgColor = isAvailable 
                        ? (index % 2 === 0 ? '#ef4444' : '#1f2937')
                        : (index % 2 === 0 ? '#7f1d1d' : '#111827');
                      
                      // Text position (middle of the arc)
                      const midAngle = (startAngle + endAngle) / 2;
                      const midRad = (midAngle - 90) * (Math.PI / 180);
                      const textRadius = radius * 0.65;
                      const textX = centerX + textRadius * Math.cos(midRad);
                      const textY = centerY + textRadius * Math.sin(midRad);
                      
                      // Format prize text
                      const prizeText = tier.amount > 0 
                        ? `${tier.amount.toFixed(0)} USDC`
                        : 'Nothing';
                      
                      // Adjust text rotation to be readable (perpendicular to radius)
                      const textRotation = midAngle;
                      
                      return (
                        <g key={index}>
                          <path
                            d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
                            fill={bgColor}
                            stroke="#ffffff30"
                            strokeWidth="1"
                          />
                          {angle > 15 && (
                            <text
                              x={textX}
                              y={textY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize={angle > 40 ? "12" : angle > 25 ? "10" : "8"}
                              fontWeight="bold"
                              className="select-none"
                              transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                            >
                              {prizeText}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Center circle */}
                  <div className="absolute inset-12 rounded-full bg-dark border-4 border-white/20 flex items-center justify-center z-10">
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
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
                </div>
              </div>

              {/* Spin Button */}
              <Button
                size="lg"
                onClick={handleSpin}
                disabled={isSpinning || !walletAddress || balance < (canSpin.canSpin ? spinCost : extraSpinCost) || !rouletteReady.ready}
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
                    {canSpin.canSpin ? (
                      <>Spin ({spinCost.toFixed(2)} USDC)</>
                    ) : (
                      <>Spin Again ({extraSpinCost.toFixed(2)} USDC)</>
                    )}
                  </>
                )}
              </Button>

              {!walletAddress && (
                <p className="text-sm text-white/50 mt-4">Connect wallet to play</p>
              )}
              {walletAddress && balance < (canSpin.canSpin ? spinCost : extraSpinCost) && (
                <p className="text-sm text-red-400 mt-4">
                  Insufficient balance. Need {canSpin.canSpin ? spinCost.toFixed(2) : extraSpinCost.toFixed(2)} USDC
                </p>
              )}
              {walletAddress && balance >= (canSpin.canSpin ? spinCost : extraSpinCost) && !canSpin.canSpin && canSpin.message && (
                <div className="text-sm text-yellow-400 mt-4 max-w-md text-center space-y-1">
                  <p>{canSpin.message}</p>
                  <p className="text-xs text-white/60">
                    You can spin again for 1 USDC in {canSpin.timeRemaining > 0 ? formatTime(canSpin.timeRemaining) : 'now'}
                  </p>
                </div>
              )}
              {walletAddress && balance >= (canSpin.canSpin ? spinCost : extraSpinCost) && canSpin.canSpin && !rouletteReady.ready && rouletteReady.reason && (
                <p className="text-sm text-yellow-400 mt-4 max-w-md text-center">
                  {rouletteReady.reason}
                </p>
              )}
              {walletAddress && balance >= (canSpin.canSpin ? spinCost : extraSpinCost) && canSpin.canSpin && rouletteReady.ready && (
                <p className="text-sm text-green-400 mt-4">
                  ✓ Ready to spin! (1 free spin per day)
                </p>
              )}
              {walletAddress && balance >= (canSpin.canSpin ? spinCost : extraSpinCost) && !canSpin.canSpin && rouletteReady.ready && (
                <p className="text-sm text-blue-400 mt-4">
                  💎 Extra spin available for {extraSpinCost.toFixed(2)} USDC
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
              {prizeTiers.map((tier, index) => {
                const isAvailable = tier.available !== false; // Default to true if not set
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      isAvailable 
                        ? 'bg-white/5 hover:bg-white/10' 
                        : 'bg-red-500/10 opacity-50 border border-red-500/20'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`font-medium ${isAvailable ? 'text-white' : 'text-white/40 line-through'}`}>
                          {tier.name}
                        </div>
                        {!isAvailable && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <div className={`text-sm ${isAvailable ? 'text-white/50' : 'text-white/30'}`}>
                        {getProbabilityPercent(tier.probability)}% chance
                      </div>
                    </div>
                    <div className={`text-lg font-mono font-bold ${isAvailable ? 'text-secondary' : 'text-white/30'}`}>
                      {tier.amount > 0 ? `${tier.amount.toFixed(2)} USDC` : 'Nothing'}
                    </div>
                  </div>
                );
              })}
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

