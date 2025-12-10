import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';
import { Scenario } from '../../types';
import { Button, GlassCard, Badge } from '../ui/GlassComponents';

interface BettingInterfaceProps {
  scenario: Scenario;
  onClose: () => void;
  onBet: (amount: number, position: 'YES' | 'NO') => void;
}

export const BettingInterface: React.FC<BettingInterfaceProps> = ({ scenario, onClose, onBet }) => {
  const [amount, setAmount] = useState(10);
  const [position, setPosition] = useState<'YES' | 'NO' | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check if betting is still open
  // Use actual bettingDeadline timestamp from contract, or fallback to endDate
  const bettingDeadlineTimestamp = scenario.bettingDeadline 
    ? Number(scenario.bettingDeadline) 
    : Math.floor(new Date(scenario.endDate).getTime() / 1000);
  const now = Math.floor(Date.now() / 1000);
  const isDeadlinePassed = bettingDeadlineTimestamp <= now;
  const isBettingOpen = !(scenario.isClosed ?? false) && !(scenario.isResolved ?? false) && !isDeadlinePassed;
  const canBet = isBettingOpen;

  // Calculate potential return based on current odds
  // If yesPrice is 0 or 1, handle edge cases
  const calculatePotentialReturn = () => {
    if (!position) return 0;
    
    if (position === 'YES') {
      if (scenario.yesPrice > 0 && scenario.yesPrice < 1) {
        // Return = bet amount / probability (minus 1% fee)
        return amount * (1 / scenario.yesPrice) * 0.99;
      }
      // If yesPrice is 1, you get your bet back (minus fee)
      return amount * 0.99;
    } else {
      // NO position
      const noPrice = 1 - scenario.yesPrice;
      if (noPrice > 0 && noPrice < 1) {
        return amount * (1 / noPrice) * 0.99;
      }
      return amount * 0.99;
    }
  };

  const potentialReturn = calculatePotentialReturn();

  const handleBetClick = () => {
    if (position) {
      setShowConfirmation(true);
    }
  };

  const confirmBet = () => {
    if (position) {
      onBet(amount, position);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl rounded-2xl relative"
      >
        <GlassCard className="p-0 flex flex-col md:flex-row overflow-hidden border-2 border-white/10">
          
          {/* Left: Info */}
          <div className="flex-1 p-4 md:p-5 flex flex-col border-b md:border-b-0 md:border-r border-white/10">
            <div className="flex justify-between items-start mb-3">
              <Button variant="ghost" onClick={onClose} className="md:hidden -ml-2 -mt-1" size="sm">
                <X size={16} /> Close
              </Button>
              <div className="hidden md:block">
                <Badge type={scenario.isTrending ? "trend" : "neutral"}>{scenario.category}</Badge>
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-display font-bold mb-2">{scenario.title}</h2>
            
            {scenario.description && scenario.description !== scenario.title && (
              <p className="text-white/70 text-sm leading-relaxed">{scenario.description}</p>
                    )}
          </div>

          {/* Right: Betting Controls */}
          <div className="w-full md:w-[320px] bg-white/5 p-4 md:p-5 flex flex-col">
             <div className="flex justify-between items-center mb-4 hidden md:flex">
                <div className="flex items-center gap-2">
                    {canBet ? (
                        <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-mono text-green-500">LIVE MARKET</span>
                        </>
                    ) : scenario.isResolved ? (
                        <>
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-xs font-mono text-blue-500">RESOLVED</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            <span className="text-xs font-mono text-yellow-500">CLOSED</span>
                        </>
                    )}
                </div>
                <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                    <X size={20} />
                </button>
             </div>

             <div className="flex-grow">
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button 
                        onClick={() => canBet && setPosition('YES')}
                        disabled={!canBet}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-1 ${
                            !canBet ? 'opacity-50 cursor-not-allowed' : ''
                        } ${position === 'YES' ? 'bg-secondary/20 border-secondary shadow-[0_0_15px_rgba(76,201,240,0.3)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                    >
                        <span className="text-base font-bold text-secondary">YES</span>
                        <span className="text-xl font-mono">{Math.round(scenario.yesPrice * 100)}%</span>
                    </button>
                    <button 
                         onClick={() => canBet && setPosition('NO')}
                         disabled={!canBet}
                         className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-1 ${
                            !canBet ? 'opacity-50 cursor-not-allowed' : ''
                        } ${position === 'NO' ? 'bg-accent/20 border-accent shadow-[0_0_15px_rgba(247,37,133,0.3)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                    >
                        <span className="text-base font-bold text-accent">NO</span>
                        <span className="text-xl font-mono">{Math.round((1 - scenario.yesPrice) * 100)}%</span>
                    </button>
                </div>

                {canBet && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-white/60">Amount</span>
                        <span className="font-mono text-white">${amount} USDC</span>
                    </div>
                    <input 
                        type="range" 
                            min="1" 
                            max="200" 
                            step="1"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-blue-400"
                    />
                        <div className="flex justify-between mt-1 text-xs text-white/30 font-mono">
                            <span>$1</span>
                            <span>$200</span>
                        </div>
                    </div>
                )}

                {canBet && (
                    <GlassCard className="p-3 mb-4 bg-black/20 border-white/5">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-white/60">Potential Return</span>
                            <span className={`text-lg font-mono font-bold ${position === 'YES' ? 'text-secondary' : position === 'NO' ? 'text-accent' : 'text-white'}`}>
                            ${position ? potentialReturn.toFixed(2) : '0.00'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-white/40">
                         <span>Fee (1%)</span>
                         <span>${(amount * 0.01).toFixed(2)}</span>
                    </div>
                </GlassCard>
                )}
             </div>

             {canBet ? (
             <Button 
                variant={position === 'YES' ? 'secondary' : position === 'NO' ? 'accent' : 'primary'} 
                fullWidth 
                    size="md"
                disabled={!position}
                onClick={handleBetClick}
                className="mt-auto relative overflow-hidden"
             >
                {position ? `BET ${position} - $${amount}` : 'Select Position'}
             </Button>
             ) : (
                <div className="mt-auto p-3 bg-white/5 rounded-lg border border-white/10 text-center">
                    {scenario.isResolved ? (
                        <div>
                            <p className="text-white/80 font-bold text-sm mb-0.5">Scenario Resolved</p>
                            <p className="text-xs text-white/50">
                                Outcome: <span className={scenario.outcome ? 'text-secondary' : 'text-accent'}>
                                    {scenario.outcome ? 'YES' : 'NO'}
                                </span>
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-white/80 font-bold text-sm mb-0.5">Betting Closed</p>
                            <p className="text-xs text-white/50">This scenario is no longer accepting bets</p>
                        </div>
                    )}
                </div>
             )}
          </div>
        </GlassCard>

        {/* Confirmation Modal Overlay */}
        <AnimatePresence>
            {showConfirmation && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-sm"
                    >
                        <GlassCard className="p-5 border-primary/30 shadow-[0_0_50px_rgba(67,97,238,0.2)] bg-[#1A1A1A]">
                            <div className="text-center mb-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 text-primary">
                                    <CheckCircle size={20} />
                                </div>
                                <h3 className="text-lg font-display font-bold">Confirm Prediction</h3>
                                <p className="text-white/50 text-xs mt-1">Please review your bet details</p>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div className="p-3 bg-white/5 rounded-lg space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-white/60">Prediction</span>
                                        <span className={`font-bold ${position === 'YES' ? 'text-secondary' : 'text-accent'}`}>
                                            {position}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-white/60">Amount</span>
                                        <span className="font-mono text-white">${amount} USDC</span>
                                    </div>
                                    <div className="h-px bg-white/10 my-2" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-white/60">Fee (1%)</span>
                                        <span className="font-mono text-white/60">${(amount * 0.01).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-xs font-medium text-white">Total Payout</span>
                                        <span className="font-mono font-bold text-secondary text-base">
                                            ${potentialReturn.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="ghost" onClick={() => setShowConfirmation(false)}>
                                    Cancel
                                </Button>
                                <Button 
                                    variant="primary" 
                                    onClick={confirmBet}
                                    className="bg-gradient-to-r from-primary to-blue-600"
                                >
                                    Confirm
                                </Button>
                            </div>
                        </GlassCard>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};