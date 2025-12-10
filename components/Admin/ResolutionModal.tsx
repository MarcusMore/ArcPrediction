import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Clock, Users, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Button, GlassCard } from '../ui/GlassComponents';
import { Scenario } from '../../types';
import { formatUSDC } from '../../lib/web3';

interface ResolutionModalProps {
  scenario: Scenario;
  outcome: boolean | null; // null = not selected, true = YES, false = NO
  onOutcomeChange: (outcome: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  scenario,
  outcome,
  onOutcomeChange,
  onConfirm,
  onCancel,
  isProcessing,
}) => {
  const bettingDeadline = scenario.bettingDeadline 
    ? new Date(Number(scenario.bettingDeadline) * 1000)
    : new Date(scenario.endDate);
  
  const closedAt = scenario.closedAt 
    ? new Date(Number(scenario.closedAt) * 1000)
    : bettingDeadline;
  
  const timeSinceClosure = Math.floor((Date.now() - closedAt.getTime()) / 1000);
  const hoursSinceClosure = Math.floor(timeSinceClosure / 3600);
  const minutesSinceClosure = Math.floor((timeSinceClosure % 3600) / 60);
  
  const yesPercent = scenario.totalVolume > 0 
    ? (scenario.yesPool / scenario.totalVolume) * 100 
    : 0;
  const noPercent = scenario.totalVolume > 0 
    ? (scenario.noPool / scenario.totalVolume) * 100 
    : 0;

  const adminFee = scenario.totalVolume * 0.01; // 1% admin fee
  const adjustedPool = scenario.totalVolume - adminFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl"
      >
        <GlassCard className="p-6 border-2 border-primary/30">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-display font-bold mb-2">Confirm Resolution</h3>
              <p className="text-white/60 text-sm">Review scenario details before declaring outcome</p>
            </div>
            <Button variant="ghost" onClick={onCancel} disabled={isProcessing}>
              <XCircle size={20} />
            </Button>
          </div>

          {/* Scenario Details */}
          <div className="space-y-6">
            {/* Scenario Description */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <h4 className="font-bold text-lg mb-2">{scenario.title}</h4>
              <p className="text-white/70 text-sm">{scenario.description}</p>
            </div>

            {/* Betting Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-xs text-white/50 mb-1">Total Pool</div>
                <div className="text-2xl font-mono font-bold">${scenario.totalVolume.toLocaleString()}</div>
              </div>
              <div className="bg-secondary/10 p-4 rounded-xl border border-secondary/30">
                <div className="text-xs text-secondary mb-1">YES Pool</div>
                <div className="text-2xl font-mono font-bold text-secondary">${scenario.yesPool.toLocaleString()}</div>
                <div className="text-xs text-white/60 mt-1">{yesPercent.toFixed(1)}%</div>
              </div>
              <div className="bg-accent/10 p-4 rounded-xl border border-accent/30">
                <div className="text-xs text-accent mb-1">NO Pool</div>
                <div className="text-2xl font-mono font-bold text-accent">${scenario.noPool.toLocaleString()}</div>
                <div className="text-xs text-white/60 mt-1">{noPercent.toFixed(1)}%</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-xs text-white/50 mb-1">Admin Fee</div>
                <div className="text-2xl font-mono font-bold">${adminFee.toFixed(2)}</div>
                <div className="text-xs text-white/60 mt-1">1%</div>
              </div>
            </div>

            {/* Bettor Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-secondary" />
                  <div className="text-xs text-white/50">YES Bettors</div>
                </div>
                <div className="text-xl font-mono font-bold text-secondary">
                  {scenario.yesBettors ?? 0}
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-accent" />
                  <div className="text-xs text-white/50">NO Bettors</div>
                </div>
                <div className="text-xl font-mono font-bold text-accent">
                  {scenario.noBettors ?? 0}
                </div>
              </div>
            </div>

            {/* Timeline Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-white/50" />
                  <div className="text-xs text-white/50">Betting Deadline</div>
                </div>
                <div className="text-sm font-mono">
                  {bettingDeadline.toLocaleString('pt-BR', { 
                    timeZone: 'America/Sao_Paulo',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-white/50" />
                  <div className="text-xs text-white/50">Time Since Closure</div>
                </div>
                <div className="text-sm font-mono">
                  {hoursSinceClosure > 0 
                    ? `${hoursSinceClosure}h ${minutesSinceClosure}m ago`
                    : `${minutesSinceClosure}m ago`
                  }
                </div>
              </div>
            </div>

            {/* Outcome Selection */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-sm font-medium mb-4">Select Outcome:</div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => onOutcomeChange(true)}
                  disabled={isProcessing}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    outcome === true
                      ? 'bg-secondary/20 border-secondary shadow-[0_0_20px_rgba(76,201,240,0.3)]'
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle size={32} className={outcome === true ? 'text-secondary' : 'text-white/30'} />
                    <div className={`text-xl font-bold ${outcome === true ? 'text-secondary' : 'text-white/70'}`}>
                      YES
                    </div>
                    <div className="text-sm text-white/50">
                      {yesPercent.toFixed(1)}% of pool
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => onOutcomeChange(false)}
                  disabled={isProcessing}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    outcome === false
                      ? 'bg-accent/20 border-accent shadow-[0_0_20px_rgba(247,37,133,0.3)]'
                      : 'bg-white/5 border-transparent hover:bg-white/10'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <XCircle size={32} className={outcome === false ? 'text-accent' : 'text-white/30'} />
                    <div className={`text-xl font-bold ${outcome === false ? 'text-accent' : 'text-white/70'}`}>
                      NO
                    </div>
                    <div className="text-sm text-white/50">
                      {noPercent.toFixed(1)}% of pool
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-400">
                  <strong>Important:</strong> Once confirmed, this outcome cannot be changed. 
                  The resolution will be recorded on-chain and trigger automatic payout calculations.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
            <Button variant="ghost" onClick={onCancel} fullWidth disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant={outcome === true ? 'secondary' : outcome === false ? 'accent' : 'primary'}
              onClick={onConfirm}
              fullWidth
              disabled={outcome === null || isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  Confirm {outcome === true ? 'YES' : outcome === false ? 'NO' : 'Resolution'}
                </>
              )}
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

