import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, XCircle, Clock, DollarSign, ShieldCheck, AlertCircle, FileText, Users, UserPlus, Copy, X, Trash2 } from 'lucide-react';
import { Button, GlassCard, Badge } from '../ui/GlassComponents';
import { ResolutionModal } from './ResolutionModal';
import { 
  createScenario, 
  resolveScenario,
  emergencyResolve, 
  closeBetting, 
  claimAdminFee,
  getAllScenarios,
  getContractOwner,
  addAdmin,
  removeAdmin,
  getAllAdmins,
  isAdmin as checkIsAdmin
} from '../../services/contractService';
import { Scenario } from '../../types';
import { formatUSDC } from '@/lib/web3';

interface AdminPanelProps {
  walletAddress: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ walletAddress }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  
  // Admin management
  const [contractOwner, setContractOwner] = useState<string>('');
  const [showAdminSection, setShowAdminSection] = useState(false);
  const [adminList, setAdminList] = useState<string[]>([]);
  const [newAdminAddress, setNewAdminAddress] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isRemovingAdmin, setIsRemovingAdmin] = useState<string | null>(null);
  
  // Create scenario form
  const [newDescription, setNewDescription] = useState('');
  const [bettingDeadline, setBettingDeadline] = useState('');
  const [resolutionDeadline, setResolutionDeadline] = useState('');

  useEffect(() => {
    loadScenarios();
    loadContractOwner();
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const admins = await getAllAdmins();
      setAdminList(admins);
    } catch (error) {
      console.error('Error loading admins:', error);
      // If getAllAdmins doesn't exist (old contract), just show owner
      if (contractOwner) {
        setAdminList([contractOwner]);
      }
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminAddress || !newAdminAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert('Please enter a valid Ethereum address (0x...)');
      return;
    }

    if (newAdminAddress.toLowerCase() === walletAddress.toLowerCase()) {
      alert('You are already the owner/admin');
      return;
    }

    if (adminList.some(addr => addr.toLowerCase() === newAdminAddress.toLowerCase())) {
      alert('This address is already an admin');
      return;
    }

    if (!confirm(`Add ${newAdminAddress} as an admin?\n\nThis will grant them permission to:\n- Create scenarios\n- Close betting\n- Resolve scenarios\n- Claim admin fees`)) {
      return;
    }

    setIsAddingAdmin(true);
    try {
      console.log('🔵 Attempting to add admin:', newAdminAddress);
      const tx = await addAdmin(newAdminAddress);
      console.log('🔵 Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('🔵 Transaction confirmed:', receipt);
      alert('✅ Admin added successfully!');
      setNewAdminAddress('');
      await loadAdmins();
    } catch (error: any) {
      console.error('❌ Full error object:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error reason:', error.reason);
      console.error('❌ Error data:', error.data);
      console.error('❌ Error info:', error.info);
      console.error('❌ Error args:', error.args);
      
      let errorMessage = 'Failed to add admin.';
      
      // Handle user rejection
      if (error.code === 4001 || error.message?.includes('user rejected') || error.message?.includes('User denied') || error.message?.includes('rejected')) {
        setIsAddingAdmin(false);
        return;
      }
      
      // Try to extract error message from various error formats
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.data?.data) {
        // Try to decode revert reason from error data
        try {
          const revertReason = error.data.data;
          if (typeof revertReason === 'string') {
            errorMessage = revertReason;
          } else if (revertReason?.message) {
            errorMessage = revertReason.message;
          } else if (typeof revertReason === 'object') {
            // Try to stringify the object
            errorMessage = JSON.stringify(revertReason).substring(0, 200);
          }
        } catch (e) {
          console.error('Error parsing error data:', e);
        }
      } else if (error.info?.error?.data) {
        // Handle ethers v6 error format
        const errorData = error.info.error.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        const msg = error.message;
        if (msg.includes('user rejected') || msg.includes('User denied') || msg.includes('rejected')) {
          setIsAddingAdmin(false);
          return;
        }
        // Try to extract revert reason from message
        const revertMatch = msg.match(/revert(ed)?\s+"?([^"]+)"?/i);
        if (revertMatch && revertMatch[2]) {
          errorMessage = revertMatch[2];
        } else if (msg.includes('execution reverted')) {
          // Try to extract custom error
          const customErrorMatch = msg.match(/execution reverted:\s*"?([^"]+)"?/i);
          if (customErrorMatch && customErrorMatch[1]) {
            errorMessage = customErrorMatch[1];
          } else {
            errorMessage = 'Transaction reverted. Check console for details.';
          }
        } else if (msg.includes('data (action=')) {
          // Handle the specific truncated error format
          errorMessage = 'Contract call failed. Please check: 1) You are the contract owner, 2) The address is valid, 3) The contract supports addAdmin. Check browser console for full error.';
        } else {
          errorMessage = msg;
        }
      } else if (error.toString) {
        errorMessage = error.toString();
      }
      
      // Truncate very long error messages
      if (errorMessage.length > 300) {
        errorMessage = errorMessage.substring(0, 300) + '...';
      }
      
      alert(`❌ ${errorMessage}\n\nCheck browser console (F12) for full error details.`);
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (adminAddress: string) => {
    if (adminAddress.toLowerCase() === contractOwner.toLowerCase()) {
      alert('Cannot remove the contract owner. The owner is permanent and cannot be removed.');
      return;
    }

    if (!confirm(`Remove ${adminAddress} as an admin?\n\nThis will revoke their admin permissions.`)) {
      return;
    }

    setIsRemovingAdmin(adminAddress);
    try {
      const tx = await removeAdmin(adminAddress);
      await tx.wait();
      alert('✅ Admin removed successfully!');
      await loadAdmins();
    } catch (error: any) {
      console.error('Error removing admin:', error);
      let errorMessage = 'Failed to remove admin.';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        const msg = error.message;
        if (msg.includes('user rejected') || msg.includes('User denied')) {
          return;
        }
        const revertMatch = msg.match(/revert(ed)?\s+"?([^"]+)"?/i);
        if (revertMatch && revertMatch[2]) {
          errorMessage = revertMatch[2];
        }
      }
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsRemovingAdmin(null);
    }
  };

  const loadContractOwner = async () => {
    try {
      const owner = await getContractOwner();
      setContractOwner(owner);
    } catch (error) {
      console.error('Error loading contract owner:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Address copied to clipboard!');
  };

  const loadScenarios = async () => {
    setIsLoading(true);
    try {
      const allScenarios = await getAllScenarios();
      setScenarios(allScenarios);
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateScenario = async () => {
    if (!newDescription || !bettingDeadline || !resolutionDeadline) {
      alert('Please fill in all fields');
      return;
    }

    // Convert datetime-local input to Unix timestamp
    // datetime-local gives us a date string in format "YYYY-MM-DDTHH:mm"
    // This is interpreted as local time by the browser
    // We convert it to UTC timestamp (Unix seconds)
    const bettingDate = new Date(bettingDeadline);
    const resolutionDate = new Date(resolutionDeadline);
    
    const bettingTimestamp = Math.floor(bettingDate.getTime() / 1000);
    const resolutionTimestamp = Math.floor(resolutionDate.getTime() / 1000);

    if (resolutionTimestamp <= bettingTimestamp) {
      alert('Resolution deadline must be after betting deadline');
      return;
    }

    if (bettingTimestamp <= Math.floor(Date.now() / 1000)) {
      alert('Betting deadline must be in the future');
      return;
    }

    try {
      setIsLoading(true);
      const tx = await createScenario(newDescription, bettingTimestamp, resolutionTimestamp);
      await tx.wait();
      
      alert('Scenario created successfully!');
      setNewDescription('');
      setBettingDeadline('');
      setResolutionDeadline('');
      setShowCreateModal(false);
      await loadScenarios();
    } catch (error: any) {
      console.error('Error creating scenario:', error);
      alert(error.message || 'Failed to create scenario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveClick = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setSelectedOutcome(null);
    setShowResolutionModal(true);
  };

  const handleEmergencyResolveClick = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setSelectedOutcome(null);
    setShowResolutionModal(true);
  };

  const handleConfirmResolution = async () => {
    if (!selectedScenario || selectedOutcome === null) return;

    setIsResolving(true);
    try {
      let tx;
      const bettingDeadlineTimestamp = selectedScenario.bettingDeadline 
        ? Number(selectedScenario.bettingDeadline) 
        : Math.floor(new Date(selectedScenario.endDate).getTime() / 1000);
      const resolutionDeadlineTimestamp = selectedScenario.resolutionDeadline 
        ? Number(selectedScenario.resolutionDeadline) 
        : bettingDeadlineTimestamp + 86400;
      const now = Math.floor(Date.now() / 1000);
      const resolutionDeadlinePassed = resolutionDeadlineTimestamp < now;

      if (resolutionDeadlinePassed) {
        tx = await emergencyResolve(parseInt(selectedScenario.id), selectedOutcome);
      } else {
        tx = await resolveScenario(parseInt(selectedScenario.id), selectedOutcome);
      }

      await tx.wait();
      setShowResolutionModal(false);
      setSelectedScenario(null);
      setSelectedOutcome(null);
      await loadScenarios();
      
      // Show success message
      alert(`✅ Scenario ${selectedScenario.id} resolved as ${selectedOutcome ? 'YES' : 'NO'}!`);
    } catch (error: any) {
      console.error('Error resolving scenario:', error);
      let errorMessage = 'Failed to resolve scenario.';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        const msg = error.message;
        if (msg.includes('user rejected') || msg.includes('User denied') || msg.includes('ACTION_REJECTED')) {
          return; // User cancelled, don't show error
        }
        const revertMatch = msg.match(/revert(ed)?\s+"?([^"]+)"?/i);
        if (revertMatch && revertMatch[2]) {
          errorMessage = revertMatch[2];
        } else {
          errorMessage = msg.length > 200 ? msg.substring(0, 200) + '...' : msg;
        }
      }
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsResolving(false);
    }
  };

  const handleResolveScenario = async (scenarioId: number, outcome: boolean) => {
    // Find the scenario to check its deadlines
    const scenario = scenarios.find(s => s.id === scenarioId.toString());
    if (scenario) {
      // Use actual timestamps from contract
      const bettingDeadlineTimestamp = scenario.bettingDeadline 
        ? Number(scenario.bettingDeadline) 
        : Math.floor(new Date(scenario.endDate).getTime() / 1000);
      const resolutionDeadlineTimestamp = scenario.resolutionDeadline 
        ? Number(scenario.resolutionDeadline) 
        : bettingDeadlineTimestamp + 86400;
      const bettingDeadlineDate = new Date(bettingDeadlineTimestamp * 1000);
      const resolutionDeadlineDate = new Date(resolutionDeadlineTimestamp * 1000);
      const now = Math.floor(Date.now() / 1000);
      const nowDate = new Date();
      
      if (bettingDeadlineTimestamp > now) {
        alert(
          `Cannot resolve scenario yet.\n\n` +
          `Betting deadline: ${bettingDeadlineDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n` +
          `Current time: ${nowDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\n` +
          `Please wait until the betting deadline has passed.\n\n` +
          `The contract requires the betting deadline to pass before resolution.`
        );
        return;
      }
      
      if (resolutionDeadlineTimestamp < now) {
        alert(
          `❌ Cannot resolve: Resolution deadline has passed!\n\n` +
          `Resolution deadline: ${resolutionDeadlineDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n` +
          `Current time: ${nowDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\n` +
          `The contract requires resolution before the resolution deadline.\n` +
          `Unfortunately, this scenario cannot be resolved through the contract.\n\n` +
          `⚠️ Users cannot claim rewards until the scenario is resolved.\n\n` +
          `💡 For future scenarios, set the resolution deadline further in the future.`
        );
        return;
      }
    }

    if (!confirm(`Are you sure you want to resolve scenario ${scenarioId} as ${outcome ? 'YES' : 'NO'}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const tx = await resolveScenario(scenarioId, outcome);
      await tx.wait();
      alert('Scenario resolved successfully!');
      await loadScenarios();
    } catch (error: any) {
      console.error('Error resolving scenario:', error);
      
      // Parse error message for user-friendly display
      let errorMessage = 'Failed to resolve scenario';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        if (error.message.includes('Betting period not ended')) {
          errorMessage = 'Cannot resolve: Betting deadline has not passed yet.';
        } else if (error.message.includes('Resolution deadline passed')) {
          errorMessage = 'Cannot resolve: Resolution deadline has already passed.';
        } else {
          const revertMatch = error.message.match(/revert(ed)?\s+"?([^"]+)"?/i);
          if (revertMatch && revertMatch[2]) {
            errorMessage = revertMatch[2];
          } else {
            errorMessage = error.message;
          }
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseBetting = async (scenarioId: number) => {
    if (!confirm(`Are you sure you want to close betting for scenario ${scenarioId}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const tx = await closeBetting(scenarioId);
      await tx.wait();
      alert('Betting closed successfully!');
      await loadScenarios();
    } catch (error: any) {
      console.error('Error closing betting:', error);
      alert(error.message || 'Failed to close betting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyResolve = async (scenarioId: number, outcome: boolean) => {
    // Get current contract address for debugging
    const { getContractAddress } = await import('../../services/contractService');
    const currentContractAddress = getContractAddress();
    
    if (!confirm(
      `⚠️ EMERGENCY RESOLVE\n\n` +
      `This will resolve scenario ${scenarioId} as ${outcome ? 'YES' : 'NO'} even though the resolution deadline has passed.\n\n` +
      `Contract: ${currentContractAddress || 'Not set'}\n\n` +
      `This requires the contract to have the emergencyResolve function.\n\n` +
      `Are you sure you want to proceed?`
    )) {
      return;
    }

    try {
      setIsLoading(true);
      const tx = await emergencyResolve(scenarioId, outcome);
      await tx.wait();
      alert(`Scenario ${scenarioId} resolved as ${outcome ? 'YES' : 'NO'}!`);
      await loadScenarios();
    } catch (error: any) {
      console.error('Error emergency resolving scenario:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to emergency resolve scenario.';
      
      // Try to extract error from various error object structures
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.data?.data) {
        // Sometimes error.data.data contains the actual error
        try {
          const decodedError = typeof error.data.data === 'string' 
            ? error.data.data 
            : JSON.stringify(error.data.data);
          errorMessage = decodedError;
        } catch (e) {
          errorMessage = 'Contract error (check console for details)';
        }
      } else if (error.message) {
        const msg = error.message;
        
        // Check for function not found
        if (msg.includes('function does not exist') || 
            msg.includes('emergencyResolve') ||
            (msg.includes('execution reverted') && msg.includes('emergencyResolve')) ||
            msg.includes('data (action=')) {
          const { getContractAddress } = await import('../../services/contractService');
          const contractAddr = getContractAddress();
          errorMessage = 'The emergencyResolve function is not available on this contract.\n\n' +
                        `Current contract: ${contractAddr || 'Not set'}\n` +
                        `Expected: 0xd6f466086f949A4db7908CbFc6fbb8606Ff335e1\n\n` +
                        'Please make sure:\n' +
                        '1. Update .env with: CONTRACT_ADDRESS=0xd6f466086f949A4db7908CbFc6fbb8606Ff335e1\n' +
                        '2. Update .env with: VITE_CONTRACT_ADDRESS=0xd6f466086f949A4db7908CbFc6fbb8606Ff335e1\n' +
                        '3. Restart your dev server (npm run dev)\n' +
                        '4. Refresh your browser';
        } 
        // Check for revert reasons
        else if (msg.includes('execution reverted')) {
          const revertMatch = msg.match(/execution reverted:?\s*"?([^"]+)"?/i) ||
                             msg.match(/revert(ed)?\s+"?([^"]+)"?/i);
          if (revertMatch && (revertMatch[1] || revertMatch[2])) {
            errorMessage = revertMatch[1] || revertMatch[2];
          } else {
            errorMessage = 'Transaction reverted. Check console for details.';
          }
        }
        // Check for user rejection
        else if (msg.includes('user rejected') || msg.includes('User denied') || msg.includes('ACTION_REJECTED')) {
          errorMessage = 'Transaction was cancelled.';
          return; // Don't show alert for cancellation
        }
        // For incomplete errors like "data (action="
        else if (msg.includes('data (action=') || msg.length < 20) {
          errorMessage = 'Contract call failed. The emergencyResolve function may not exist on this contract.\n\n' +
                        'Please verify:\n' +
                        '1. Contract address: ' + (import.meta.env.VITE_CONTRACT_ADDRESS || 'Not set') + '\n' +
                        '2. The contract was deployed with emergencyResolve function\n' +
                        '3. Check browser console for full error details';
        }
        else {
          errorMessage = msg.length > 300 ? msg.substring(0, 300) + '...' : msg;
        }
      } else if (error.error) {
        // Nested error object
        errorMessage = error.error.message || JSON.stringify(error.error);
      }
      
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('Transaction was cancelled')) {
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimFee = async (scenarioId: number) => {
    try {
      setIsLoading(true);
      const tx = await claimAdminFee(scenarioId);
      await tx.wait();
      alert('Admin fee claimed successfully!');
      await loadScenarios();
    } catch (error: any) {
      console.error('Error claiming fee:', error);
      alert(error.message || 'Failed to claim admin fee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Management Section */}
      <GlassCard className="p-6 border-primary/30 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary" size={24} />
            <h2 className="text-2xl font-display font-bold">Admin Management</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdminSection(!showAdminSection)}
          >
            {showAdminSection ? 'Hide' : 'Show'} Admin Tools
          </Button>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-white/60">Current Contract Owner:</span>
            {contractOwner && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-white">{contractOwner}</span>
                <button
                  onClick={() => copyToClipboard(contractOwner)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Copy address"
                >
                  <Copy size={14} className="text-white/50" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Your Wallet:</span>
            <span className="font-mono text-sm text-white">{walletAddress}</span>
            {contractOwner.toLowerCase() === walletAddress.toLowerCase() && (
              <Badge type="trend" className="ml-2">You are the owner</Badge>
            )}
          </div>
        </div>

        {showAdminSection && contractOwner.toLowerCase() === walletAddress.toLowerCase() && (
          <div className="space-y-4">
            {/* Admin List */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Users size={18} />
                Admin List ({adminList.length})
              </h3>
              {adminList.length === 0 ? (
                <p className="text-sm text-white/50">No admins found. Loading...</p>
              ) : (
                <div className="space-y-2">
                  {adminList.map((admin, index) => {
                    const isOwner = admin.toLowerCase() === contractOwner.toLowerCase();
                    const isCurrentUser = admin.toLowerCase() === walletAddress.toLowerCase();
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-white">{admin}</span>
                          <button
                            onClick={() => copyToClipboard(admin)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Copy address"
                          >
                            <Copy size={12} className="text-white/50" />
                          </button>
                          {isOwner && (
                            <Badge type="trend" className="text-xs">Owner</Badge>
                          )}
                          {isCurrentUser && !isOwner && (
                            <Badge type="neutral" className="text-xs">You</Badge>
                          )}
                        </div>
                        {!isOwner && (
                          <button
                            onClick={() => handleRemoveAdmin(admin)}
                            disabled={isRemovingAdmin === admin}
                            className="p-2 hover:bg-red-500/20 rounded transition-colors text-red-400 disabled:opacity-50"
                            title="Remove admin"
                          >
                            {isRemovingAdmin === admin ? (
                              <X className="animate-spin" size={16} />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Admin */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <UserPlus size={18} />
                Add Admin
              </h3>
              <p className="text-sm text-white/60 mb-4">
                Grant admin permissions to another address. Admins can create scenarios, resolve outcomes, and claim fees.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Admin Address
                  </label>
                  <input
                    type="text"
                    value={newAdminAddress}
                    onChange={(e) => setNewAdminAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddAdmin}
                  disabled={isAddingAdmin || !newAdminAddress}
                  className="w-full"
                >
                  {isAddingAdmin ? 'Adding...' : 'Add Admin'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showAdminSection && contractOwner.toLowerCase() !== walletAddress.toLowerCase() && (
          <div className="mt-4 space-y-4">
            {/* Admin List (read-only for non-owners) */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Users size={18} />
                Admin List ({adminList.length})
              </h3>
              {adminList.length === 0 ? (
                <p className="text-sm text-white/50">No admins found. Loading...</p>
              ) : (
                <div className="space-y-2">
                  {adminList.map((admin, index) => {
                    const isOwner = admin.toLowerCase() === contractOwner.toLowerCase();
                    const isCurrentUser = admin.toLowerCase() === walletAddress.toLowerCase();
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-white">{admin}</span>
                          <button
                            onClick={() => copyToClipboard(admin)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Copy address"
                          >
                            <Copy size={12} className="text-white/50" />
                          </button>
                          {isOwner && (
                            <Badge type="trend" className="text-xs">Owner</Badge>
                          )}
                          {isCurrentUser && !isOwner && (
                            <Badge type="neutral" className="text-xs">You</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-500">
                ⚠️ Only the contract owner can add/remove admins.
              </p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Admin Panel</h2>
          <p className="text-white/60">Manage scenarios and platform settings</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2" size={18} /> Create Scenario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <GlassCard className="p-4">
          <div className="text-sm text-white/50">Total Scenarios</div>
          <div className="text-2xl font-mono font-bold mt-1">{scenarios.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-white/50">Active</div>
          <div className="text-2xl font-mono font-bold mt-1 text-secondary">
            {scenarios.filter(s => !(s.isResolved ?? false) && !(s.isClosed ?? false)).length}
          </div>
        </GlassCard>
        <GlassCard className="p-4 border-primary/30">
          <div className="text-sm text-white/50 flex items-center gap-1">
            <FileText size={14} />
            Awaiting Resolution
          </div>
          <div className="text-2xl font-mono font-bold mt-1 text-primary">
            {scenarios.filter(s => {
              const bettingDeadlineTimestamp = s.bettingDeadline 
                ? Number(s.bettingDeadline) 
                : Math.floor(new Date(s.endDate).getTime() / 1000);
              const resolutionDeadlineTimestamp = s.resolutionDeadline 
                ? Number(s.resolutionDeadline) 
                : bettingDeadlineTimestamp + 86400;
              const now = Math.floor(Date.now() / 1000);
              const bettingDeadlinePassed = bettingDeadlineTimestamp <= now;
              const resolutionDeadlinePassed = resolutionDeadlineTimestamp < now;
              return bettingDeadlinePassed && !(s.isResolved ?? false) && (!resolutionDeadlinePassed || true); // Include emergency resolve cases
            }).length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-white/50">Resolved</div>
          <div className="text-2xl font-mono font-bold mt-1 text-green-400">
            {scenarios.filter(s => s.isResolved ?? false).length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-white/50">Total Volume</div>
          <div className="text-2xl font-mono font-bold mt-1">
            ${scenarios.reduce((sum, s) => sum + s.totalVolume, 0).toLocaleString()}
          </div>
        </GlassCard>
      </div>

      {/* Resolution Panel - Scenarios Awaiting Resolution */}
      {scenarios.filter(s => {
        const bettingDeadlineTimestamp = s.bettingDeadline 
          ? Number(s.bettingDeadline) 
          : Math.floor(new Date(s.endDate).getTime() / 1000);
        const now = Math.floor(Date.now() / 1000);
        const bettingDeadlinePassed = bettingDeadlineTimestamp <= now;
        return bettingDeadlinePassed && !(s.isResolved ?? false);
      }).length > 0 && (
        <GlassCard className="p-6 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-primary" size={24} />
            <h3 className="text-xl font-display font-bold">Resolution Panel</h3>
            <Badge type="trend" className="ml-auto">
              {scenarios.filter(s => {
                const bettingDeadlineTimestamp = s.bettingDeadline 
                  ? Number(s.bettingDeadline) 
                  : Math.floor(new Date(s.endDate).getTime() / 1000);
                const now = Math.floor(Date.now() / 1000);
                const bettingDeadlinePassed = bettingDeadlineTimestamp <= now;
                return bettingDeadlinePassed && !(s.isResolved ?? false);
              }).length} Pending
            </Badge>
          </div>
          <p className="text-white/60 text-sm mb-4">
            Scenarios requiring manual resolution. Review details and declare the correct outcome.
          </p>
        </GlassCard>
      )}

      {/* Scenarios List */}
      {isLoading && scenarios.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-white/60">Loading scenarios...</p>
        </div>
      ) : scenarios.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <ShieldCheck size={48} className="text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Scenarios Yet</h3>
          <p className="text-white/60 mb-6">Create your first scenario to get started</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2" size={18} /> Create Scenario
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {scenarios.map((scenario) => {
            // Use actual bettingDeadline and resolutionDeadline timestamps from contract
            const bettingDeadlineTimestamp = scenario.bettingDeadline 
              ? Number(scenario.bettingDeadline) 
              : new Date(scenario.endDate).getTime() / 1000;
            const resolutionDeadlineTimestamp = scenario.resolutionDeadline 
              ? Number(scenario.resolutionDeadline) 
              : bettingDeadlineTimestamp + 86400; // Default to 1 day after betting deadline
            const bettingDeadlineDate = new Date(bettingDeadlineTimestamp * 1000);
            const resolutionDeadlineDate = new Date(resolutionDeadlineTimestamp * 1000);
            const now = Math.floor(Date.now() / 1000);
            const bettingDeadlinePassed = bettingDeadlineTimestamp <= now;
            const resolutionDeadlinePassed = resolutionDeadlineTimestamp < now;
            
            const isBettingOpen = !(scenario.isClosed ?? false) && !bettingDeadlinePassed;
            // Can resolve normally if: betting deadline has passed AND resolution deadline has NOT passed AND not already resolved
            const canResolve = bettingDeadlinePassed && !resolutionDeadlinePassed && !(scenario.isResolved ?? false);
            // Can emergency resolve if: betting deadline passed BUT resolution deadline also passed (requires contract update)
            const canEmergencyResolve = bettingDeadlinePassed && resolutionDeadlinePassed && !(scenario.isResolved ?? false);
            const canClaimFee = (scenario.isResolved ?? false) && (scenario.adminFee ?? 0) > 0 && !(scenario.feeClaimed ?? false);
            
            // Show warning if trying to resolve before betting deadline
            const showDeadlineWarning = (scenario.isClosed ?? false) && !bettingDeadlinePassed && !(scenario.isResolved ?? false);
            // Show error if resolution deadline has passed
            const showResolutionDeadlineError = bettingDeadlinePassed && resolutionDeadlinePassed && !(scenario.isResolved ?? false);

            return (
              <GlassCard key={scenario.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge type="neutral">#{scenario.id}</Badge>
                      {(scenario.isResolved ?? false) && (
                        <Badge type={scenario.outcome ? "trend" : "neutral"}>
                          {scenario.outcome ? "YES" : "NO"}
                        </Badge>
                      )}
                      {(scenario.isClosed ?? false) && !(scenario.isResolved ?? false) && (
                        <Badge type="neutral">CLOSED</Badge>
                      )}
                      {bettingDeadlinePassed && !(scenario.isResolved ?? false) && (
                        <Badge type="trend">AWAITING RESOLUTION</Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{scenario.title}</h3>
                    <p className="text-white/60 text-sm mb-4">{scenario.description}</p>
                    
                    {showDeadlineWarning && (
                      <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                          <AlertCircle size={16} />
                          <span>Betting deadline: {bettingDeadlineDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}. Wait until deadline passes to resolve.</span>
                        </div>
                      </div>
                    )}
                    {showResolutionDeadlineError && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <AlertCircle size={16} />
                          <span>
                            ⚠️ Resolution deadline has passed ({resolutionDeadlineDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}). 
                            The contract cannot resolve this scenario. Users cannot claim rewards until resolved.
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-sm">
                      <div>
                        <div className="text-white/50">Total Pool</div>
                        <div className="font-mono font-bold">${scenario.totalVolume.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-white/50">YES Pool</div>
                        <div className="font-mono font-bold text-secondary">${scenario.yesPool.toLocaleString()}</div>
                        <div className="text-xs text-white/50">
                          {scenario.totalVolume > 0 
                            ? `${((scenario.yesPool / scenario.totalVolume) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-white/50">NO Pool</div>
                        <div className="font-mono font-bold text-accent">${scenario.noPool.toLocaleString()}</div>
                        <div className="text-xs text-white/50">
                          {scenario.totalVolume > 0 
                            ? `${((scenario.noPool / scenario.totalVolume) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-white/50 flex items-center gap-1">
                          <Users size={12} />
                          Bettors
                        </div>
                        <div className="font-mono font-bold">
                          {scenario.totalBettors ?? 0}
                        </div>
                        <div className="text-xs text-white/50">
                          YES: {scenario.yesBettors ?? 0} | NO: {scenario.noBettors ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/50">Betting Deadline</div>
                        <div className={`font-mono font-bold text-xs ${bettingDeadlinePassed ? 'text-green-400' : 'text-yellow-400'}`}>
                          {bettingDeadlineDate.toLocaleString('pt-BR', { 
                            timeZone: 'America/Sao_Paulo',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/50">Time Since Closure</div>
                        <div className="font-mono font-bold text-xs">
                          {(() => {
                            const closedAt = scenario.closedAt 
                              ? new Date(Number(scenario.closedAt) * 1000)
                              : bettingDeadlineDate;
                            const timeSince = Math.floor((Date.now() - closedAt.getTime()) / 1000);
                            const hours = Math.floor(timeSince / 3600);
                            const minutes = Math.floor((timeSince % 3600) / 60);
                            return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                          })()}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/50">Admin Fee</div>
                        <div className="font-mono font-bold">
                          ${(scenario.adminFee ?? 0) > 0 ? formatUSDC(BigInt(Math.floor((scenario.adminFee ?? 0) * 1000000))) : '0.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                  {isBettingOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloseBetting(parseInt(scenario.id))}
                    >
                      <XCircle className="mr-2" size={14} /> Close Betting
                    </Button>
                  )}
                  {(canResolve || canEmergencyResolve) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => canEmergencyResolve 
                        ? handleEmergencyResolveClick(scenario)
                        : handleResolveClick(scenario)
                      }
                      className={canEmergencyResolve ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                    >
                      <FileText className="mr-2" size={14} />
                      {canEmergencyResolve ? 'Emergency Resolve' : 'Resolve Scenario'}
                    </Button>
                  )}
                  {showDeadlineWarning && (
                    <div className="text-xs text-white/40 flex items-center gap-1">
                      <Clock size={12} />
                      <span>Deadline: {bettingDeadlineDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
                    </div>
                  )}
                  {canClaimFee && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleClaimFee(parseInt(scenario.id))}
                    >
                      <DollarSign className="mr-2" size={14} /> Claim Fee
                    </Button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Create Scenario Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl"
          >
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Create New Scenario</h3>
                <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                  <XCircle size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Will Bitcoin reach $100k by Q4 2024?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary/50"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Betting Deadline</label>
                    <input
                      type="datetime-local"
                      value={bettingDeadline}
                      onChange={(e) => setBettingDeadline(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary/50"
                      step="60"
                    />
                    {bettingDeadline && (
                      <p className="text-xs text-white/40 mt-1">
                        {new Date(bettingDeadline).toLocaleString('pt-BR', { 
                          timeZone: 'America/Sao_Paulo',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Resolution Deadline</label>
                    <input
                      type="datetime-local"
                      value={resolutionDeadline}
                      onChange={(e) => setResolutionDeadline(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary/50"
                      step="60"
                    />
                    {resolutionDeadline && (
                      <p className="text-xs text-white/40 mt-1">
                        {new Date(resolutionDeadline).toLocaleString('pt-BR', { 
                          timeZone: 'America/Sao_Paulo',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setShowCreateModal(false)} fullWidth>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateScenario} fullWidth disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Scenario'}
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}

      {/* Resolution Confirmation Modal */}
      {showResolutionModal && selectedScenario && (
        <ResolutionModal
          scenario={selectedScenario}
          outcome={selectedOutcome}
          onOutcomeChange={setSelectedOutcome}
          onConfirm={handleConfirmResolution}
          onCancel={() => {
            setShowResolutionModal(false);
            setSelectedScenario(null);
            setSelectedOutcome(null);
          }}
          isProcessing={isResolving}
        />
      )}
    </div>
  );
};

