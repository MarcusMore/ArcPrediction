import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Calculator, DollarSign, Shield, TrendingUp, Clock, Users, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassComponents';

export const Whitepaper: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-5xl mx-auto p-6"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-primary" size={32} />
          <h1 className="text-4xl font-display font-bold">ArcPrediction Whitepaper</h1>
        </div>
        <p className="text-white/60 text-lg">Comprehensive documentation of the decentralized prediction market platform</p>
      </div>

      <div className="space-y-6">
        {/* Executive Summary */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary" size={24} />
            Executive Summary
          </h2>
          <p className="text-white/80 leading-relaxed">
            ArcPrediction is a decentralized prediction market platform built on the Arc Testnet, enabling users to bet USDC on yes/no scenarios. 
            The platform leverages smart contracts for transparent, trustless betting with automatic settlement and fee distribution.
          </p>
        </GlassCard>

        {/* Product Overview */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-display font-bold mb-4">1. Product Overview</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2">1.1 What is ArcPrediction?</h3>
              <p className="text-white/80 leading-relaxed">
                ArcPrediction is a decentralized betting platform where users can participate in prediction markets by betting on binary outcomes (Yes/No) 
                for various scenarios across categories including Finance, Crypto, Sports, and Politics.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">1.2 Key Features</h3>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li><strong>Decentralized:</strong> Built on Arc Testnet with smart contract-based settlement</li>
                <li><strong>Transparent:</strong> All bets, outcomes, and payouts are recorded on-chain</li>
                <li><strong>Zero Gas Fees:</strong> Uses USDC as the native gas token on Arc Testnet</li>
                <li><strong>Real-time Odds:</strong> Dynamic pricing based on pool distribution</li>
                <li><strong>Multi-Scenario Betting:</strong> Users can participate in multiple concurrent scenarios</li>
                <li><strong>Automatic Settlement:</strong> Smart contracts handle resolution and distribution</li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* Financial Calculations */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
            <Calculator className="text-secondary" size={24} />
            4. Financial Calculations
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-3">4.1 Pool Structure</h3>
              <p className="text-white/80 mb-3">Each scenario maintains three pools:</p>
              <ul className="list-disc list-inside space-y-2 text-white/80 mb-4">
                <li><strong>Total Pool:</strong> Sum of all bets on the scenario</li>
                <li><strong>Yes Pool:</strong> Sum of all "Yes" bets</li>
                <li><strong>No Pool:</strong> Sum of all "No" bets</li>
              </ul>
              <div className="bg-white/5 p-4 rounded-lg font-mono text-sm">
                Total Pool = Yes Pool + No Pool
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">4.2 Price Calculation</h3>
              <p className="text-white/80 mb-3">The probability/price for each outcome:</p>
              <div className="bg-white/5 p-4 rounded-lg font-mono text-sm space-y-2">
                <div>Yes Price = Yes Pool / Total Pool</div>
                <div>No Price = No Pool / Total Pool</div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">4.3 Admin Fee</h3>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li><strong>Fee Rate:</strong> 1% of total pool</li>
                <li><strong>Calculation:</strong> Admin Fee = Total Pool × 0.01</li>
                <li><strong>Deduction:</strong> Fee is deducted before winnings distribution</li>
                <li><strong>Claiming:</strong> Admin can claim fee after scenario resolution</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">4.4 Winnings Calculation</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold mb-2 text-white/90">Adjusted Pool</h4>
                  <div className="bg-white/5 p-4 rounded-lg font-mono text-sm">
                    Adjusted Pool = Total Pool - Admin Fee
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-white/90">Individual Winnings</h4>
                  <div className="bg-white/5 p-4 rounded-lg font-mono text-sm">
                    Winnings = (User Bet Amount / Winning Pool Total) × Adjusted Pool
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-white/90">Profit</h4>
                  <div className="bg-white/5 p-4 rounded-lg font-mono text-sm">
                    Profit = Winnings - Original Bet Amount
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">4.5 Example Calculation</h3>
              <div className="bg-white/5 p-4 rounded-lg space-y-3">
                <div>
                  <strong className="text-white/90">Scenario Setup:</strong>
                  <ul className="list-disc list-inside ml-4 mt-2 text-white/80 text-sm">
                    <li>Total Pool: 1000 USDC</li>
                    <li>Yes Pool: 600 USDC</li>
                    <li>No Pool: 400 USDC</li>
                    <li>Outcome: Yes</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-white/90">Admin Fee:</strong>
                  <div className="font-mono text-sm mt-2 text-white/80">
                    Admin Fee = 1000 × 0.01 = 10 USDC<br/>
                    Adjusted Pool = 1000 - 10 = 990 USDC
                  </div>
                </div>
                <div>
                  <strong className="text-white/90">User Bet:</strong>
                  <ul className="list-disc list-inside ml-4 mt-2 text-white/80 text-sm">
                    <li>User bet: 100 USDC on Yes</li>
                    <li>Winning Pool: 600 USDC</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-white/90">Calculation:</strong>
                  <div className="font-mono text-sm mt-2 text-white/80">
                    Winnings = (100 / 600) × 990 = 165 USDC<br/>
                    Profit = 165 - 100 = 65 USDC
                  </div>
                </div>
                <div>
                  <strong className="text-white/90">Result:</strong>
                  <ul className="list-disc list-inside ml-4 mt-2 text-white/80 text-sm">
                    <li>User receives: 165 USDC</li>
                    <li>User profit: +65 USDC</li>
                    <li>Admin receives: 10 USDC</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Fee Structure */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
            <DollarSign className="text-accent" size={24} />
            8. Fee Structure
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2">8.1 User Fees</h3>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li><strong>Betting Fee:</strong> None (0%)</li>
                <li><strong>Claiming Fee:</strong> None (0%)</li>
                <li><strong>Gas Fees:</strong> Paid in USDC (Arc Testnet native)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">8.2 Platform Fees</h3>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li><strong>Admin Fee:</strong> 1% of total pool per scenario</li>
                <li><strong>Fee Collection:</strong> After scenario resolution</li>
                <li><strong>Fee Distribution:</strong> Claimed by contract owner</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">8.3 Fee Calculation Example</h3>
              <div className="bg-white/5 p-4 rounded-lg space-y-2 text-white/80">
                <div><strong>Scenario:</strong></div>
                <ul className="list-disc list-inside ml-4 text-sm">
                  <li>Total bets: 10,000 USDC</li>
                  <li>Admin fee: 100 USDC (1%)</li>
                  <li>Adjusted pool: 9,900 USDC</li>
                </ul>
                <div className="mt-3"><strong>Distribution:</strong></div>
                <ul className="list-disc list-inside ml-4 text-sm">
                  <li>Winners share: 9,900 USDC</li>
                  <li>Admin receives: 100 USDC</li>
                </ul>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Betting Mechanics */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
            <Clock className="text-primary" size={24} />
            3. Betting Mechanics
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2">3.1 Scenario Lifecycle</h3>
              <div className="space-y-3">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold mb-2 text-white/90">Creation</h4>
                  <p className="text-white/80 text-sm">Admin creates scenario with description, betting deadline, and resolution deadline</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold mb-2 text-white/90">Betting Period</h4>
                  <p className="text-white/80 text-sm">Users place bets. Real-time odds update based on pool distribution</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold mb-2 text-white/90">Closure</h4>
                  <p className="text-white/80 text-sm">Betting closes automatically at deadline or manually by admin</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold mb-2 text-white/90">Resolution</h4>
                  <p className="text-white/80 text-sm">Admin declares outcome. Winnings calculated automatically</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold mb-2 text-white/90">Distribution</h4>
                  <p className="text-white/80 text-sm">Winners claim winnings. Admin claims fee</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">3.2 Betting Limits</h3>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li><strong>Minimum Bet:</strong> 1 USDC</li>
                <li><strong>Maximum Bet:</strong> 200 USDC</li>
                <li><strong>Per Scenario:</strong> One bet per user per scenario</li>
                <li><strong>Concurrent Scenarios:</strong> Unlimited participation</li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* Security */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
            <Shield className="text-secondary" size={24} />
            6. Security Features
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2">6.1 Smart Contract Security</h3>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li><strong>Reentrancy Protection:</strong> Uses OpenZeppelin's ReentrancyGuard</li>
                <li><strong>Access Control:</strong> Ownable pattern for admin functions</li>
                <li><strong>Pausable:</strong> Emergency pause functionality</li>
                <li><strong>Input Validation:</strong> All inputs validated before execution</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">6.2 Betting Security</h3>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li><strong>Deadline Enforcement:</strong> Timestamps validated on-chain</li>
                <li><strong>Amount Limits:</strong> Min/max bet enforced by contract</li>
                <li><strong>Single Bet Per User:</strong> Prevents duplicate bets</li>
                <li><strong>Fund Isolation:</strong> Each scenario's funds are isolated</li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* Gamification & Social */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
            <Users className="text-primary" size={24} />
            10. Gamification & Social Features
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2">10.1 Achievement System</h3>
              <p className="text-white/80 mb-3">30+ achievements across multiple categories:</p>
              <ul className="list-disc list-inside space-y-2 text-white/80 text-sm">
                <li><strong>Betting:</strong> First bet, 10/50/100/500 bets milestones</li>
                <li><strong>Winning:</strong> First win, 10/50/100 wins milestones</li>
                <li><strong>Win Rate:</strong> 60%/70%/80% win rate achievements</li>
                <li><strong>Volume:</strong> 1K/10K/100K USDC total betting volume</li>
                <li><strong>Profit:</strong> 100/1K/10K USDC profit milestones</li>
                <li><strong>Streaks:</strong> 3/5/10 consecutive wins</li>
                <li><strong>Special:</strong> All categories, perfect week</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">10.2 Leaderboard</h3>
              <ul className="list-disc list-inside space-y-2 text-white/80 text-sm">
                <li><strong>Privacy-Protected:</strong> Other users' addresses partially hidden</li>
                <li><strong>User Status Card:</strong> Prominent display of user's position</li>
                <li><strong>Multiple Sort Options:</strong> By profit, win rate, volume, wins, streak</li>
                <li><strong>Top 3 Podium:</strong> Special display for top performers</li>
                <li><strong>Real-time Updates:</strong> Rankings update as scenarios resolve</li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* Technical Specs */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-display font-bold mb-4">12. Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold mb-2 text-white/90">Smart Contract</h3>
              <ul className="text-sm text-white/80 space-y-1">
                <li>Language: Solidity 0.8.20</li>
                <li>Compiler: Hardhat</li>
                <li>Libraries: OpenZeppelin v5.0.0</li>
                <li>Standards: ERC-20 interface</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-white/90">Frontend</h3>
              <ul className="text-sm text-white/80 space-y-1">
                <li>Framework: React 19.2.1</li>
                <li>Build Tool: Vite 6.2.0</li>
                <li>Web3: Ethers.js 6.13.0</li>
                <li>Styling: Tailwind CSS</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-white/90">Network</h3>
              <ul className="text-sm text-white/80 space-y-1">
                <li>Network: Arc Testnet</li>
                <li>Chain ID: 5042002</li>
                <li>Explorer: testnet.arcscan.app</li>
                <li>Faucet: faucet.circle.com</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2 text-white/90">Contract</h3>
              <ul className="text-sm text-white/80 space-y-1">
                <li>Address: 0xDE4544a8bB8e764A66E5659dcbb5b1f60327b13f</li>
                <li>USDC: 0x3600...0000</li>
              </ul>
            </div>
          </div>
        </GlassCard>

        {/* Disclaimer */}
        <GlassCard className="p-6 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-500 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-xl font-bold mb-2 text-yellow-500">12. Legal and Compliance</h3>
              <div className="space-y-3 text-white/80">
                <div>
                  <strong className="text-white/90">Testnet Disclaimer:</strong>
                  <p className="text-sm mt-1">ArcPrediction is currently deployed on Arc Testnet for testing purposes only. All tokens and transactions are on a test network and have no real-world value.</p>
                </div>
                <div>
                  <strong className="text-white/90">Regulatory Notice:</strong>
                  <p className="text-sm mt-1">Prediction markets may be subject to regulatory restrictions in certain jurisdictions. Users are responsible for compliance with local laws and regulations.</p>
                </div>
                <div>
                  <strong className="text-white/90">No Warranty:</strong>
                  <p className="text-sm mt-1">The platform is provided "as is" without warranties. Users participate at their own risk.</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Changelog */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-display font-bold mb-4">Changelog</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold mb-2 text-white/90">Version 1.1 (December 2025)</h3>
              <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
                <li>✅ Added Achievement System (30+ achievements)</li>
                <li>✅ Added Leaderboard with privacy protection</li>
                <li>✅ Added Multi-Admin Management</li>
                <li>✅ Added Permanent Owner Protection</li>
                <li>✅ Added Emergency Resolve functionality</li>
                <li>✅ Added Bettor Analytics</li>
                <li>✅ Enhanced Portfolio Management</li>
                <li>✅ Improved User Experience</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 text-white/90">Version 1.0 (Initial Release)</h3>
              <ul className="list-disc list-inside space-y-1 text-white/80 text-sm">
                <li>✅ Basic betting functionality</li>
                <li>✅ Scenario management</li>
                <li>✅ Admin panel</li>
                <li>✅ Portfolio tracking</li>
                <li>✅ Notification system</li>
              </ul>
            </div>
          </div>
        </GlassCard>

        <div className="text-center text-white/50 text-sm py-6">
          <p>Version 1.1 • Last Updated: December 2025 • Network: Arc Testnet</p>
        </div>
      </div>
    </motion.div>
  );
};

