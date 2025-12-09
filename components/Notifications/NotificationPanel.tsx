
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trophy, TrendingDown, Info, X, Check } from 'lucide-react';
import { Notification } from '../../types';
import { GlassCard } from '../ui/GlassComponents';

interface NotificationPanelProps {
  isOpen: boolean;
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, notifications, onClose, onMarkRead }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute top-16 right-0 w-80 md:w-96 z-50"
    >
      <GlassCard className="max-h-[80vh] overflow-hidden flex flex-col p-0 bg-[#1A1A1A] border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-white/70" />
            <span className="font-bold text-sm">Notifications</span>
            <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              {notifications.filter(n => !n.read).length} NEW
            </span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-2 space-y-2">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">
              No new notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className={`
                  relative p-4 rounded-xl border transition-all cursor-pointer group
                  ${notif.read ? 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-white/5' : 'bg-white/5 border-white/10 hover:border-white/20'}
                `}
              >
                {!notif.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(67,97,238,0.8)]" />
                )}
                
                <div className="flex gap-4">
                  <div className={`
                    w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border
                    ${notif.type === 'WIN' ? 'bg-secondary/20 border-secondary/50 text-secondary' : 
                      notif.type === 'LOSS' ? 'bg-accent/20 border-accent/50 text-accent' : 
                      'bg-white/10 border-white/20 text-white/70'}
                  `}>
                    {notif.type === 'WIN' && <Trophy size={18} />}
                    {notif.type === 'LOSS' && <TrendingDown size={18} />}
                    {notif.type === 'INFO' && <Info size={18} />}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-bold ${notif.read ? 'text-white/70' : 'text-white'}`}>
                        {notif.title}
                      </h4>
                    </div>
                    
                    <p className="text-xs text-white/50 leading-relaxed mb-2">
                      {notif.message}
                    </p>

                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">
                            {notif.timestamp}
                        </span>
                        
                        {notif.amount !== undefined && (
                            <span className={`font-mono font-bold text-sm ${notif.amount >= 0 ? 'text-secondary' : 'text-accent'}`}>
                                {notif.amount >= 0 ? '+' : ''}{notif.amount.toFixed(2)} USDC
                            </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};
