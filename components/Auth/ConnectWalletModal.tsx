import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ShieldCheck, ArrowRight, Loader2, CheckCircle, X } from 'lucide-react';
import { GlassCard, Button } from '../ui/GlassComponents';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (address: string) => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [step, setStep] = useState<'CONNECT' | 'SIGN'>('CONNECT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsProcessing(true);
    try {
      // Import web3 utilities dynamically to avoid SSR issues
      const { connectWallet } = await import('../../lib/web3');
      const address = await connectWallet();
      setConnectedAddress(address);
      setIsProcessing(false);
      setStep('SIGN');
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      alert(error.message || 'Failed to connect wallet');
      setIsProcessing(false);
    }
  };

  const handleLogin = async () => {
    setIsProcessing(true);
    try {
      // For now, just login with the connected address
      // In production, you might want to add signature verification
      if (connectedAddress) {
        onLogin(connectedAddress);
      }
      setIsProcessing(false);
      // Reset state after closing is handled by parent or useEffect
      setTimeout(() => {
          setStep('CONNECT');
          setConnectedAddress(null);
      }, 500);
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.message || 'Failed to login');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md relative"
      >
        <GlassCard className="p-8 border-primary/20 shadow-[0_0_50px_rgba(67,97,238,0.15)] bg-[#1A1A1A]">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4 border border-white/10">
              {step === 'CONNECT' ? (
                <Wallet className="text-primary" size={32} />
              ) : (
                <ShieldCheck className="text-secondary" size={32} />
              )}
            </div>
            <h2 className="text-2xl font-display font-bold">
              {step === 'CONNECT' ? 'Connect Wallet' : 'Verify Ownership'}
            </h2>
            <p className="text-white/50 text-sm mt-2">
              {step === 'CONNECT' 
                ? 'Select your preferred wallet to continue' 
                : 'Please sign the message to verify your identity'}
            </p>
          </div>

          <div className="space-y-4">
            {step === 'CONNECT' ? (
              <div className="space-y-3">
                <button
                  onClick={handleConnect}
                  disabled={isProcessing}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <span className="text-orange-500 font-bold text-xs">M</span>
                    </div>
                    <span className="font-medium">MetaMask</span>
                  </div>
                  {isProcessing ? (
                    <Loader2 className="animate-spin text-white/50" size={18} />
                  ) : (
                    <ArrowRight className="text-white/20 group-hover:text-white transition-colors" size={18} />
                  )}
                </button>
                <button
                  onClick={handleConnect}
                  disabled={isProcessing}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/50 transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-500 font-bold text-xs">W</span>
                    </div>
                    <span className="font-medium">WalletConnect</span>
                  </div>
                   {isProcessing ? (
                    <Loader2 className="animate-spin text-white/50" size={18} />
                  ) : (
                    <ArrowRight className="text-white/20 group-hover:text-white transition-colors" size={18} />
                  )}
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/20 flex items-center gap-3">
                  <CheckCircle className="text-secondary" size={20} />
                  <div>
                    <div className="text-xs text-secondary font-bold uppercase tracking-wider">Wallet Connected</div>
                    <div className="font-mono text-sm text-white/80">{connectedAddress}</div>
                  </div>
                </div>

                <div className="text-xs text-white/40 text-center px-4">
                  By signing this message, you agree to ArcPrediction's Terms of Service and Privacy Policy. This will not trigger a blockchain transaction or cost gas.
                </div>

                <Button 
                  fullWidth 
                  onClick={handleLogin}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-secondary to-blue-500 hover:opacity-90"
                >
                  {isProcessing ? (
                     <span className="flex items-center gap-2">
                       <Loader2 className="animate-spin" size={18} /> Signing...
                     </span>
                  ) : (
                    "Sign & Login"
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};