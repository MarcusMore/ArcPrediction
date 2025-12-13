import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Users, ArrowRight } from 'lucide-react';
import { Scenario } from '../../types';
import { GlassCard, Button, Badge } from '../ui/GlassComponents';

interface ScenarioCardProps {
  scenario: Scenario;
  onSelect: (scenario: Scenario) => void;
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Bet finished';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onSelect }) => {
  const yesPercent = Math.round(scenario.yesPrice * 100);
  const noPercent = 100 - yesPercent;
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (scenario.isClosed || scenario.isResolved) {
        setTimeRemaining('Bet finished');
        return;
      }
      
      if (scenario.bettingDeadline) {
        const now = Math.floor(Date.now() / 1000);
        const deadline = scenario.bettingDeadline;
        const remaining = deadline - now;
        setTimeRemaining(formatTimeRemaining(remaining));
      } else {
        setTimeRemaining('');
      }
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [scenario.bettingDeadline, scenario.isClosed, scenario.isResolved]);

  return (
    <GlassCard 
      hoverEffect 
      className="p-5 flex flex-col h-full relative overflow-hidden group cursor-pointer"
      onClick={() => onSelect(scenario)}
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-500" />

      {/* Header */}
      <div className="flex justify-between items-start mb-4 z-10">
        <div className="flex gap-2">
          {scenario.isTrending && <Badge type="trend">TRENDING</Badge>}
          <Badge type="neutral">{scenario.category}</Badge>
          {scenario.isResolved && (
            <Badge type={scenario.outcome ? "trend" : "accent"}>
              {scenario.outcome ? "YES" : "NO"}
            </Badge>
          )}
          {scenario.isClosed && !scenario.isResolved && (
            <Badge type="neutral">CLOSED</Badge>
          )}
        </div>
        <div className="flex items-center text-white/50 text-xs font-mono">
          <Clock size={12} className="mr-1" />
          {timeRemaining || scenario.endDate}
        </div>
      </div>

      {/* Title */}
      <h3 className={`text-xl font-display font-bold text-white leading-tight group-hover:text-secondary transition-colors ${scenario.description && scenario.description !== scenario.title ? 'mb-2' : 'mb-6'}`}>
        {scenario.title}
      </h3>
      
      {/* Only show description if it's different from title */}
      {scenario.description && scenario.description !== scenario.title && (
        <p className="text-white/60 text-sm line-clamp-2 mb-6 flex-grow">
          {scenario.description}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col">
          <span className="text-xs text-secondary font-bold mb-1">YES</span>
          <div className="flex items-end items-baseline">
            <span className="text-2xl font-mono text-white">{yesPercent}%</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-accent font-bold mb-1">NO</span>
          <div className="flex items-end items-baseline">
            <span className="text-2xl font-mono text-white">{noPercent}%</span>
          </div>
        </div>
      </div>

      {/* Visual Bar */}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden flex mb-6">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${yesPercent}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className="h-full bg-secondary shadow-[0_0_10px_rgba(76,201,240,0.5)]"
        />
        <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${noPercent}%` }}
           transition={{ duration: 1, delay: 0.2 }}
           className="h-full bg-accent shadow-[0_0_10px_rgba(247,37,133,0.5)]"
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-auto border-t border-white/10 pt-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center text-white/40 text-xs">
            <Users size={14} className="mr-1" />
            <span className="font-mono">${scenario.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {timeRemaining && !scenario.isClosed && !scenario.isResolved && (
            <div className="flex items-center text-white/30 text-xs">
              <Clock size={12} className="mr-1" />
              <span className="font-mono">{timeRemaining}</span>
            </div>
          )}
        </div>
        {!(scenario.isClosed ?? false) && !(scenario.isResolved ?? false) ? (
          <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
            Trade <ArrowRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Badge type="neutral" className="text-xs">
            {scenario.isResolved ? 'Resolved' : 'Closed'}
          </Badge>
        )}
      </div>
    </GlassCard>
  );
};
