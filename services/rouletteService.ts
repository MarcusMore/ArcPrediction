import { ethers } from 'ethers';
import { getProvider, getSigner, formatUSDC, parseUSDC, USDC_ADDRESS, USDC_ABI, approveUSDC, getUSDCAllowance } from '../lib/web3';

// Roulette contract ABI
export const ROULETTE_ABI = [
  'function spin() external',
  'function fundPrizePool(uint256 _amount) external',
  'function getPrizePool() external view returns (uint256)',
  'function getSpinCost() external view returns (uint256)',
  'function getAllPrizeTiers() external view returns (tuple(uint256 amount, uint256 probability, string name)[])',
  'function getPrizeTierCount() external view returns (uint256)',
  'function totalSpins() external view returns (uint256)',
  'function totalPrizesWon() external view returns (uint256)',
  'function totalPrizeAmount() external view returns (uint256)',
  'function prizeToken() external view returns (address)',
  'function paused() external view returns (bool)',
  'function getTimeUntilNextSpin(address _user) external view returns (uint256)',
  'function canUserSpin(address _user) external view returns (bool canSpin, uint256 timeRemaining)',
  'function lastSpinTime(address) external view returns (uint256)',
  'function getAvailablePrizeTiers() external view returns (tuple(uint256 amount, uint256 probability, string name)[] availableTiers, uint256[] availableProbabilities)',
  'function isPrizeTierAvailable(uint256 _tierIndex) external view returns (bool isAvailable)',
  'event SpinExecuted(address indexed player, uint256 spinResult, uint256 prizeWon, string prizeName)',
  'event PrizePoolFunded(address indexed funder, uint256 amount)',
  'event ExtraSpinUsed(address indexed player, uint256 extraCost, uint256 adminFee, uint256 prizePoolAmount)',
];

/**
 * Get extra spin cost
 * EXTRA_SPIN_COST is a constant (5 USDC) defined in the contract
 * If the contract function is not available (old deployment), return the constant value
 */
export async function getExtraSpinCost(): Promise<number> {
  // EXTRA_SPIN_COST is always 5 USDC (constant in contract)
  // Return directly without calling contract to avoid errors with old deployments
  return 5;
}

/**
 * Check if roulette contract is ready (has prize pool and is not paused)
 */
export async function isRouletteReady(): Promise<{ ready: boolean; reason?: string }> {
  try {
    const contractAddress = getRouletteContractAddress();
    if (!contractAddress) {
      return { ready: false, reason: 'Contract address not set' };
    }

    const contract = getRouletteContract();
    const [prizePool, spinCost, paused] = await Promise.all([
      contract.getPrizePool(),
      contract.getSpinCost(),
      contract.paused(),
    ]);

    if (paused) {
      return { ready: false, reason: 'Roulette is currently paused' };
    }

    if (spinCost === 0n) {
      return { ready: false, reason: 'Spin cost is not set' };
    }

    if (prizePool === 0n) {
      return { ready: false, reason: 'Prize pool is empty. Please wait for admin to fund it.' };
    }

    return { ready: true };
  } catch (error) {
    console.error('Error checking roulette readiness:', error);
    return { ready: false, reason: 'Unable to check contract status' };
  }
}

/**
 * Check if user can spin and get time until next spin
 */
export async function canUserSpin(userAddress: string): Promise<{ canSpin: boolean; timeRemaining: number; message?: string }> {
  try {
    const contract = getRouletteContract();
    const [canSpin, timeRemaining] = await contract.canUserSpin(userAddress);
    
    if (canSpin) {
      return { canSpin: true, timeRemaining: 0 };
    }
    
    // Format time remaining
    const hours = Math.floor(Number(timeRemaining) / 3600);
    const minutes = Math.floor((Number(timeRemaining) % 3600) / 60);
    const seconds = Number(timeRemaining) % 60;
    
    let message = 'You can spin again in ';
    if (hours > 0) {
      message += `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      message += `${minutes}m ${seconds}s`;
    } else {
      message += `${seconds}s`;
    }
    
    return { canSpin: false, timeRemaining: Number(timeRemaining), message };
  } catch (error) {
    console.error('Error checking if user can spin:', error);
    return { canSpin: false, timeRemaining: 0, message: 'Unable to check spin status' };
  }
}

let rouletteContractAddress: string | null = null;

/**
 * Set the roulette contract address
 */
export function setRouletteContractAddress(address: string) {
  rouletteContractAddress = address;
}

/**
 * Get the current roulette contract address
 */
export function getRouletteContractAddress(): string | null {
  return rouletteContractAddress;
}

/**
 * Get roulette contract instance
 */
function getRouletteContract(): ethers.Contract {
  if (!rouletteContractAddress) {
    throw new Error('Roulette contract address not set');
  }
  const provider = getProvider();
  return new ethers.Contract(rouletteContractAddress, ROULETTE_ABI, provider);
}

/**
 * Get roulette contract instance with signer
 */
async function getRouletteContractWithSigner(): Promise<ethers.Contract> {
  if (!rouletteContractAddress) {
    throw new Error('Roulette contract address not set');
  }
  const signer = await getSigner();
  return new ethers.Contract(rouletteContractAddress, ROULETTE_ABI, signer);
}

/**
 * Get prize pool balance
 */
export async function getPrizePool(): Promise<number> {
  const contract = getRouletteContract();
  const balance = await contract.getPrizePool();
  return parseFloat(formatUSDC(balance));
}

/**
 * Get spin cost
 */
export async function getSpinCost(): Promise<number> {
  const contract = getRouletteContract();
  const cost = await contract.getSpinCost();
  return parseFloat(formatUSDC(cost));
}

/**
 * Get all prize tiers
 */
export interface PrizeTier {
  amount: number;
  probability: number;
  name: string;
  available?: boolean; // Whether this tier can be paid with current prize pool
}

export async function getAllPrizeTiers(): Promise<PrizeTier[]> {
  const contract = getRouletteContract();
  const [tiers, prizePool] = await Promise.all([
    contract.getAllPrizeTiers(),
    contract.getPrizePool(),
  ]);
  
  const poolAmount = parseFloat(formatUSDC(prizePool));
  
  return tiers.map((tier: any) => {
    const amount = parseFloat(formatUSDC(tier.amount));
    return {
      amount: amount,
      probability: Number(tier.probability),
      name: tier.name,
      available: amount === 0 || poolAmount >= amount, // "Nothing" tier is always available
    };
  });
}

/**
 * Get available prize tiers (tiers that can be paid)
 */
export async function getAvailablePrizeTiers(): Promise<{ tiers: PrizeTier[]; probabilities: number[] }> {
  const contract = getRouletteContract();
  const [availableTiers, availableProbabilities] = await contract.getAvailablePrizeTiers();
  
  return {
    tiers: availableTiers.map((tier: any) => ({
      amount: parseFloat(formatUSDC(tier.amount)),
      probability: Number(tier.probability),
      name: tier.name,
      available: true, // All returned tiers are available
    })),
    probabilities: availableProbabilities.map((prob: any) => Number(prob)),
  };
}

/**
 * Check if a prize tier is available
 */
export async function isPrizeTierAvailable(tierIndex: number): Promise<boolean> {
  const contract = getRouletteContract();
  return await contract.isPrizeTierAvailable(tierIndex);
}

/**
 * Spin the roulette
 */
export async function spin(): Promise<{ prizeWon: number; prizeName: string }> {
  if (!rouletteContractAddress) {
    throw new Error('Roulette contract address not set');
  }

  const signer = await getSigner();
  const userAddress = await signer.getAddress();
  
  // Get spin cost and check if user needs extra spin
  const contract = getRouletteContract();
  const [spinCost, canSpin, prizePool, contractPaused] = await Promise.all([
    getSpinCost(),
    canUserSpin(userAddress),
    getPrizePool(),
    isPaused(),
  ]);
  
  // Pre-flight checks
  if (prizePool <= 0) {
    throw new Error('Prize pool is empty. Please wait for the admin to fund it.');
  }
  
  if (contractPaused) {
    throw new Error('Roulette is currently paused. Please try again later.');
  }
  
  if (spinCost <= 0) {
    throw new Error('Spin cost is not configured. Please contact admin.');
  }
  
  const spinCostWei = parseUSDC(spinCost.toString());
  const extraSpinCost = 5; // 5 USDC
  const extraSpinCostWei = parseUSDC(extraSpinCost.toString());
  
  // If user needs extra spin, total cost is just the extra spin cost (5 USDC)
  // Otherwise, it's the normal spin cost
  const totalCost = canSpin.canSpin ? spinCost : extraSpinCost;
  const totalCostWei = canSpin.canSpin ? spinCostWei : extraSpinCostWei;
  
  console.log('🎰 Spin Debug:', {
    canSpin: canSpin.canSpin,
    timeRemaining: canSpin.timeRemaining,
    spinCost: spinCost,
    extraSpinCost: extraSpinCost,
    totalCost: totalCost,
    totalCostWei: totalCostWei.toString(),
    needsExtraSpin: !canSpin.canSpin,
  });
  
  // Check and approve USDC if needed
  // For extra spin, we need to approve 5 USDC
  // For normal spin, we need to approve spinCost
  const allowance = await getUSDCAllowance(userAddress, rouletteContractAddress);
  
  console.log('💰 Allowance Debug:', {
    currentAllowance: formatUSDC(allowance),
    needed: formatUSDC(totalCostWei),
    needsApproval: allowance < totalCostWei,
  });
  
  // Approve the exact amount needed
  // For extra spin: 5 USDC, for normal spin: spinCost
  if (allowance < totalCostWei) {
    console.log('✅ Approving', formatUSDC(totalCostWei), 'USDC');
    const approveTx = await approveUSDC(rouletteContractAddress, totalCostWei);
    await approveTx.wait();
    console.log('✅ Approval confirmed');
  }
  
  // Important: The contract should handle extra spin payment automatically
  // If the contract doesn't support extra spin (old version), it will revert
  // with an error that we'll catch and display to the user

  // Execute spin
  const contractWithSigner = await getRouletteContractWithSigner();
  
  // Try to estimate gas first to catch revert reasons
  let tx;
  try {
    console.log('🎲 Attempting to spin...');
    
    // First, try to call the function statically to get revert reason
    // Note: staticCall might not be available in all versions, so we'll skip if it fails
    try {
      if (contractWithSigner.spin.staticCall) {
        await contractWithSigner.spin.staticCall();
      }
    } catch (staticError: any) {
      console.error('❌ Static call failed:', staticError);
      // Extract revert reason from static call error
      if (staticError.reason) {
        throw new Error(staticError.reason);
      } else if (staticError.data) {
        // Try to decode error data
        try {
          const contract = getRouletteContract();
          const iface = contract.interface;
          const decoded = iface.parseError(staticError.data);
          throw new Error(decoded?.name || 'Contract revert');
        } catch {
          // If we can't decode, continue to gas estimation
          console.warn('⚠️ Could not decode static call error, continuing to gas estimation');
        }
      }
    }
    
    // Estimate gas to catch revert reasons before sending
    try {
      const gasEstimate = await contractWithSigner.spin.estimateGas();
      console.log('⛽ Gas estimate:', gasEstimate.toString());
    } catch (estimateError: any) {
      // If gas estimation fails, try to extract the revert reason
      console.error('❌ Gas estimation failed:', estimateError);
      let revertReason = 'Unknown error';
      
      // Try to decode the revert reason
      if (estimateError.reason) {
        revertReason = estimateError.reason;
      } else if (estimateError.data) {
        // Try to decode error data using the contract interface
        try {
          const contract = getRouletteContract();
          const iface = contract.interface;
          // Try to parse as error
          try {
            const decoded = iface.parseError(estimateError.data);
            revertReason = decoded?.name || 'Contract revert';
          } catch {
            // If parseError fails, try to extract from error message
            if (estimateError.message) {
              const msg = estimateError.message;
              if (msg.includes('Prize pool is empty')) {
                revertReason = 'Prize pool is empty';
              } else if (msg.includes('Extra spin cost transfer failed') || msg.includes('extra spin cost transfer failed')) {
                revertReason = 'Extra spin payment failed. Check balance and approval (need 5 USDC)';
              } else if (msg.includes('Spin cost transfer failed')) {
                revertReason = 'Spin cost transfer failed. Check balance and approval';
              } else if (msg.includes('Spin cost not set')) {
                revertReason = 'Spin cost is not configured';
              } else if (msg.includes('Insufficient prize pool')) {
                revertReason = 'Insufficient prize pool';
              } else {
                revertReason = msg;
              }
            }
          }
        } catch {
          // If we can't decode, use the error message
          revertReason = estimateError.message || 'Contract revert';
        }
      } else if (estimateError.message) {
        revertReason = estimateError.message;
      }
      
      throw new Error(revertReason);
    }
    
    tx = await contractWithSigner.spin();
    console.log('📝 Transaction sent:', tx.hash);
  } catch (error: any) {
    // Parse error to get revert reason
    let errorMessage = 'Failed to spin roulette';
    
    // Check for rate limiting first
    if (error.code === -32005 || error.message?.includes('rate limited') || error.message?.includes('rate limit')) {
      errorMessage = 'RPC rate limit exceeded. Please wait a few seconds and try again.';
      console.error('⚠️ Rate limit error:', error);
      throw new Error(errorMessage);
    }
    
    if (error.reason) {
      errorMessage = error.reason;
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    } else if (error.message) {
      const msg = error.message;
      
      // Check for specific error patterns
      if (msg.includes('Prize pool is empty') || msg.includes('prize pool is empty')) {
        errorMessage = 'Prize pool is empty. Please wait for the admin to fund it.';
      } else if (msg.includes('Extra spin cost transfer failed') || msg.includes('extra spin cost transfer failed')) {
        errorMessage = 'Extra spin payment failed. Please check your balance and approval (need 5 USDC).';
      } else if (msg.includes('Extra spin cost transfer failed') || msg.includes('extra spin cost transfer failed')) {
        errorMessage = 'Extra spin payment failed. Please check your balance and approval (need 5 USDC).';
      } else if (msg.includes('Spin cost transfer failed') || msg.includes('transfer failed')) {
        errorMessage = 'Token transfer failed. Please check your balance and approval.';
      } else if (msg.includes('Spin cost not set')) {
        errorMessage = 'Spin cost is not configured. Please contact admin.';
      } else if (msg.includes('Insufficient prize pool')) {
        errorMessage = 'Insufficient prize pool. Please wait for the admin to add more funds.';
      } else if (msg.includes('You can only spin once per day') || msg.includes('wait 24 hours')) {
        // This error should not happen when paying extra spin cost
        // It means the contract doesn't support extra spin (old version)
        // Or the contract logic is blocking the spin
        errorMessage = 'The contract may not support extra spins. Please wait 24 hours or contact support.';
      } else if (msg.includes('user rejected') || msg.includes('User denied')) {
        errorMessage = 'Transaction was cancelled.';
        throw new Error(errorMessage);
      } else if (msg.includes('rate limited') || msg.includes('rate limit') || error.code === -32005) {
        errorMessage = 'RPC rate limit exceeded. Please wait a few seconds and try again.';
      } else {
        // Try to extract revert reason from error message
        const revertMatch = msg.match(/revert(ed)?\s+"?([^"]+)"?/i) || 
                          msg.match(/reason:\s*"?([^"]+)"?/i) ||
                          msg.match(/execution reverted:?\s*"?([^"]+)"?/i);
        if (revertMatch && (revertMatch[2] || revertMatch[1])) {
          errorMessage = revertMatch[2] || revertMatch[1];
        } else {
          // If we can't extract, provide more context
          errorMessage = `Transaction reverted. Check console for details. Original error: ${msg.substring(0, 200)}`;
        }
      }
    }
    
    // Log full error for debugging
    console.error('❌ Full error object:', {
      error,
      message: errorMessage,
      reason: error.reason,
      data: error.data,
      code: error.code,
      stack: error.stack,
    });
    
    throw new Error(errorMessage);
  }
  
  // Wait for transaction and get receipt
  const receipt = await tx.wait();
  
  // Parse event to get prize
  let prizeWon = 0;
  let prizeName = 'Nothing';
  
  if (receipt && receipt.logs) {
    const iface = new ethers.Interface(ROULETTE_ABI);
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === 'SpinExecuted') {
          prizeWon = parseFloat(formatUSDC(parsed.args.prizeWon));
          prizeName = parsed.args.prizeName;
          break;
        }
      } catch (e) {
        // Not our event, continue
      }
    }
  }
  
  return { prizeWon, prizeName };
}

/**
 * Fund the prize pool (owner only)
 */
export async function fundPrizePool(amount: number): Promise<ethers.ContractTransactionResponse> {
  if (!rouletteContractAddress) {
    throw new Error('Roulette contract address not set');
  }

  const signer = await getSigner();
  const userAddress = await signer.getAddress();
  
  const amountWei = parseUSDC(amount.toString());
  
  // Check and approve USDC if needed
  const allowance = await getUSDCAllowance(userAddress, rouletteContractAddress);
  if (allowance < amountWei) {
    // Approve a larger amount
    const approveTx = await approveUSDC(rouletteContractAddress, amountWei * 2n);
    await approveTx.wait();
  }

  const contract = await getRouletteContractWithSigner();
  return await contract.fundPrizePool(amountWei);
}

/**
 * Get roulette statistics
 */
export async function getRouletteStats(): Promise<{
  totalSpins: number;
  totalPrizesWon: number;
  totalPrizeAmount: number;
}> {
  const contract = getRouletteContract();
  const [totalSpins, totalPrizesWon, totalPrizeAmount] = await Promise.all([
    contract.totalSpins(),
    contract.totalPrizesWon(),
    contract.totalPrizeAmount(),
  ]);
  
  return {
    totalSpins: Number(totalSpins),
    totalPrizesWon: Number(totalPrizesWon),
    totalPrizeAmount: parseFloat(formatUSDC(totalPrizeAmount)),
  };
}

/**
 * Check if contract is paused
 */
export async function isPaused(): Promise<boolean> {
  const contract = getRouletteContract();
  return await contract.paused();
}

