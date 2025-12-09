import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, DollarSign, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { GlassCard, Button, Badge } from '../ui/GlassComponents';
import { UserBet, Scenario } from '../../types';
import { claimWinnings } from '../../services/contractService';
import { formatUSDC } from '@/lib/web3';

interface ClaimableBetsProps {
  bets: UserBet[];
  scenarios: Scenario[];
  onClaimSuccess: () => void;
}

export const ClaimableBets: React.FC<ClaimableBetsProps> = ({ bets, scenarios, onClaimSuccess }) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const claimableBets = bets.filter(bet => bet.canClaim && !bet.claimed);

  const handleClaim = async (bet: UserBet) => {
    if (!bet.canClaim || bet.claimed) return;
    
    setClaimingId(bet.id);
    try {
      const tx = await claimWinnings(parseInt(bet.scenarioId));
      await tx.wait();
      alert(`Successfully claimed ${bet.winnings?.toFixed(2)} USDC!`);
      onClaimSuccess();
    } catch (error: any) {
      console.error('Error claiming winnings:', error);
      let errorMessage = 'Failed to claim winnings';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        const revertMatch = error.message.match(/revert(ed)?\s+"?([^"]+)"?/i);
        if (revertMatch) {
          errorMessage = revertMatch[2] || revertMatch[0];
        } else if (error.message.includes('Scenario not resolved')) {
          errorMessage = 'This scenario has not been resolved yet.';
        } else if (error.message.includes('No bet found')) {
          errorMessage = 'No bet found for this scenario.';
        } else if (error.message.includes('Winnings already claimed')) {
          errorMessage = 'You have already claimed your winnings for this bet.';
        } else if (error.message.includes('Bet was not winning')) {
          errorMessage = 'You did not win this bet.';
        } else if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
          console.log('Transaction cancelled by user.');
          return;
        } else {
          errorMessage = error.message;
        }
      }
      alert(errorMessage);
    } finally {
      setClaimingId(null);
    }
  };

  if (claimableBets.length === 0) {
    return null;
  }

  return (
    <GlassCard className="p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="text-primary" size={24} />
        <h3 className="text-xl font-display font-bold">Claimable Winnings</h3>
        <Badge type="trend">{claimableBets.length}</Badge>
      </div>
      
      <div className="space-y-3">
        {claimableBets.map((bet) => {
          const scenario = scenarios.find(s => s.id === bet.scenarioId);
          const isClaiming = claimingId === bet.id;
          
          return (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-white/50">Scenario #{bet.scenarioId}</span>
                  {scenario && (
                    <span className="text-sm font-medium text-white/80 truncate max-w-md">
                      {scenario.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-white/50">Your Bet:</span>
                    <span className="font-mono font-bold text-white">{bet.amount.toFixed(2)} USDC</span>
                    <Badge type={bet.position === 'YES' ? 'trend' : 'accent'} className="ml-2">
                      {bet.position}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} className="text-secondary" />
                    <span className="text-white/50">Winnings:</span>
                    <span className="font-mono font-bold text-secondary">
                      {bet.winnings?.toFixed(2) || '0.00'} USDC
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => handleClaim(bet)}
                disabled={isClaiming}
                className="ml-4"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={16} />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Trophy className="mr-2" size={16} />
                    Claim
                  </>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
};



