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
  'event SpinExecuted(address indexed player, uint256 spinResult, uint256 prizeWon, string prizeName)',
  'event PrizePoolFunded(address indexed funder, uint256 amount)',
];

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

/**
 * Get time until next spin for user
 */
export async function getTimeUntilNextSpin(userAddress: string): Promise<number> {
  try {
    const contract = getRouletteContract();
    const timeRemaining = await contract.getTimeUntilNextSpin(userAddress);
    return Number(timeRemaining);
  } catch (error) {
    console.error('Error getting time until next spin:', error);
    return 0;
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
}

export async function getAllPrizeTiers(): Promise<PrizeTier[]> {
  const contract = getRouletteContract();
  const tiers = await contract.getAllPrizeTiers();
  
  return tiers.map((tier: any) => ({
    amount: parseFloat(formatUSDC(tier.amount)),
    probability: Number(tier.probability),
    name: tier.name,
  }));
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
  
  // Get spin cost
  const spinCost = await getSpinCost();
  const spinCostWei = parseUSDC(spinCost.toString());
  
  // Check and approve USDC if needed
  const allowance = await getUSDCAllowance(userAddress, rouletteContractAddress);
  if (allowance < spinCostWei) {
    // Approve a larger amount (e.g., 10x the spin cost)
    const approveTx = await approveUSDC(rouletteContractAddress, spinCostWei * 10n);
    await approveTx.wait();
  }

  // Execute spin
  const contract = await getRouletteContractWithSigner();
  
  // Try to estimate gas first to catch revert reasons
  let tx;
  try {
    // Estimate gas to catch revert reasons before sending
    await contract.spin.estimateGas();
    tx = await contract.spin();
  } catch (error: any) {
    // Parse error to get revert reason
    let errorMessage = 'Failed to spin roulette';
    
    if (error.reason) {
      errorMessage = error.reason;
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    } else if (error.message) {
      const msg = error.message;
      
      // Check for specific error patterns
      if (msg.includes('Prize pool is empty') || msg.includes('prize pool is empty')) {
        errorMessage = 'Prize pool is empty. Please wait for the admin to fund it.';
      } else if (msg.includes('Spin cost transfer failed') || msg.includes('transfer failed')) {
        errorMessage = 'Token transfer failed. Please check your balance and approval.';
      } else if (msg.includes('Spin cost not set')) {
        errorMessage = 'Spin cost is not configured. Please contact admin.';
      } else if (msg.includes('Insufficient prize pool')) {
        errorMessage = 'Insufficient prize pool. Please wait for the admin to add more funds.';
      } else if (msg.includes('user rejected') || msg.includes('User denied')) {
        errorMessage = 'Transaction was cancelled.';
        throw new Error(errorMessage);
      } else {
        // Try to extract revert reason from error message
        const revertMatch = msg.match(/revert(ed)?\s+"?([^"]+)"?/i) || 
                          msg.match(/reason:\s*"?([^"]+)"?/i);
        if (revertMatch && revertMatch[2]) {
          errorMessage = revertMatch[2];
        }
      }
    }
    
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

