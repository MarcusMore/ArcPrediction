import { ethers } from 'ethers';
import { 
  getProvider, 
  getSigner, 
  BETTING_PLATFORM_ABI, 
  formatUSDC, 
  parseUSDC,
  USDC_DECIMALS 
} from '../lib/web3';
import { Scenario, UserBet } from '../types';

// Contract address - will be set after deployment
let CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

export function setContractAddress(address: string) {
  // Normalize address when setting it
  CONTRACT_ADDRESS = normalizeAddress(address);
}

export function getContractAddress(): string {
  return CONTRACT_ADDRESS;
}

/**
 * Validate and normalize address
 */
function normalizeAddress(address: string): string {
  if (!address) {
    throw new Error('Address is required');
  }
  // Remove any whitespace
  address = address.trim();
  // Ensure it starts with 0x
  if (!address.startsWith('0x')) {
    address = '0x' + address;
  }
  // Validate it's a valid hex address (42 characters including 0x)
  if (address.length !== 42) {
    throw new Error(`Invalid address length: ${address.length}. Expected 42 characters.`);
  }
  // Validate hex format
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error(`Invalid address format: ${address}`);
  }
  return address;
}

/**
 * Get contract instance (read-only)
 */
function getContract(): ethers.Contract {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not set. Please deploy the contract first.');
  }
  
  // Normalize and validate address
  const normalizedAddress = normalizeAddress(CONTRACT_ADDRESS);
  
  try {
    const provider = getProvider();
    // Use getAddress to ensure it's treated as an address, not a name
    const address = ethers.getAddress(normalizedAddress);
    return new ethers.Contract(address, BETTING_PLATFORM_ABI, provider);
  } catch (error: any) {
    // Suppress ENS/name resolution errors
    if (
      error.code === 'UNSUPPORTED_OPERATION' || 
      error.code === 'UNCONFIGURED_NAME' ||
      error.operation === 'getEnsAddress' ||
      error.message?.includes('unconfigured name')
    ) {
      // Retry with normalized address
      const provider = getProvider();
      const address = ethers.getAddress(normalizedAddress);
      return new ethers.Contract(address, BETTING_PLATFORM_ABI, provider);
    }
    throw error;
  }
}

/**
 * Get contract instance with signer (for transactions)
 */
async function getContractWithSigner(): Promise<ethers.Contract> {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not set. Please deploy the contract first.');
  }
  
  // Normalize and validate address
  const normalizedAddress = normalizeAddress(CONTRACT_ADDRESS);
  
  try {
    const signer = await getSigner();
    // Use getAddress to ensure it's treated as an address, not a name
    const address = ethers.getAddress(normalizedAddress);
    return new ethers.Contract(address, BETTING_PLATFORM_ABI, signer);
  } catch (error: any) {
    // Suppress ENS/name resolution errors
    if (
      error.code === 'UNSUPPORTED_OPERATION' || 
      error.code === 'UNCONFIGURED_NAME' ||
      error.operation === 'getEnsAddress' ||
      error.message?.includes('unconfigured name')
    ) {
      // Retry with normalized address
      const signer = await getSigner();
      const address = ethers.getAddress(normalizedAddress);
      return new ethers.Contract(address, BETTING_PLATFORM_ABI, signer);
    }
    throw error;
  }
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Check if it's a rate limit error (multiple error codes)
      const isRateLimit = 
        error?.code === -32603 || 
        error?.code === -32005 ||
        error?.data?.httpStatus === 429 ||
        error?.message?.includes('rate limit') || 
        error?.message?.includes('rate limited') ||
        error?.message?.includes('Request is being rate limited');
      
      if (isRateLimit) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Rate limited, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      // For other errors, throw immediately
      throw error;
    }
  }
  throw lastError;
}

/**
 * Process array in batches with delay between batches
 */
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>,
  delayBetweenBatches: number = 200
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => retryWithBackoff(() => processor(item)))
    );
    results.push(...batchResults);
    
    // Add delay between batches (except for the last one)
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  return results;
}

/**
 * Get bettor counts from BetPlaced events (fallback method)
 */
async function getBettorsFromEvents(
  contract: ethers.Contract,
  scenarioId: number
): Promise<{ totalBettors: number; yesBettors: number; noBettors: number }> {
  try {
    const provider = getProvider();
    
    // Create filter for BetPlaced events for this scenario
    // BetPlaced(address indexed user, uint256 indexed scenarioId, uint256 amount, bool choice)
    const filter = contract.filters.BetPlaced(null, scenarioId);
    
    // Query events from the contract deployment (or last 10000 blocks if too old)
    const currentBlock = await retryWithBackoff(() => provider.getBlockNumber());
    const fromBlock = Math.max(0, currentBlock - 10000); // Last 10000 blocks
    
    const events = await retryWithBackoff(() => contract.queryFilter(filter, fromBlock, 'latest'));
    
    // Count unique bettors and their choices
    // Note: If a bettor placed multiple bets, we count them once but use their latest choice
    const uniqueBettors = new Set<string>();
    const bettorChoices = new Map<string, boolean>();
    
    events.forEach((event) => {
      if (event.args && event.args.length >= 4) {
        const bettor = event.args[0]; // user address (indexed)
        const eventScenarioId = event.args[1]; // scenarioId (indexed)
        const choice = event.args[3]; // choice (bool)
        
        // Double-check this event is for the correct scenario
        if (Number(eventScenarioId) === scenarioId) {
          const bettorLower = bettor.toLowerCase();
          uniqueBettors.add(bettorLower);
          // Use latest choice if bettor placed multiple bets
          bettorChoices.set(bettorLower, choice);
        }
      }
    });
    
    // Count YES and NO bettors
    let yesBettors = 0;
    let noBettors = 0;
    bettorChoices.forEach((choice) => {
      if (choice === true) {
        yesBettors++;
      } else {
        noBettors++;
      }
    });
    
    return {
      totalBettors: uniqueBettors.size,
      yesBettors,
      noBettors,
    };
  } catch (error: any) {
    console.warn(`Error querying BetPlaced events for scenario ${scenarioId}:`, error?.message || error);
    return { totalBettors: 0, yesBettors: 0, noBettors: 0 };
  }
}

/**
 * Convert contract scenario to frontend Scenario type
 */
async function convertScenario(
  contractData: any,
  id: string,
  contract?: ethers.Contract
): Promise<Scenario> {
  const [
    _id,
    description,
    createdAt,
    bettingDeadline,
    resolutionDeadline,
    totalPool,
    yesPool,
    noPool,
    isResolved,
    outcome,
    adminFee,
    feeClaimed,
    isClosed,
  ] = contractData;

  const totalPoolNum = Number(formatUSDC(totalPool));
  const yesPoolNum = Number(formatUSDC(yesPool));
  const noPoolNum = Number(formatUSDC(noPool));
  
  // Calculate yes price (0.0 to 1.0)
  const yesPrice = totalPoolNum > 0 ? yesPoolNum / totalPoolNum : 0.5;

  // Convert timestamps to dates
  const endDate = new Date(Number(bettingDeadline) * 1000).toISOString().split('T')[0];

  // Determine category based on description keywords
  let category: 'Finance' | 'Sports' | 'Politics' | 'Crypto' = 'Finance';
  const descLower = description.toLowerCase();
  if (descLower.includes('bitcoin') || descLower.includes('ethereum') || descLower.includes('crypto') || descLower.includes('exchange')) {
    category = 'Crypto';
  } else if (descLower.includes('lakers') || descLower.includes('nba') || descLower.includes('championship') || descLower.includes('sport')) {
    category = 'Sports';
  } else if (descLower.includes('congress') || descLower.includes('regulate') || descLower.includes('government')) {
    category = 'Politics';
  }

  // Get bettor counts if contract is provided
  // Try mapping first, then fallback to events if mapping is empty
  let yesBettors = 0;
  let noBettors = 0;
  let totalBettors = 0;
  if (contract) {
    try {
      // Convert id to number for contract call
      const scenarioIdNum = parseInt(id, 10);
      if (isNaN(scenarioIdNum)) {
        console.warn(`Invalid scenario ID for bettor counting: ${id}`);
      } else {
        // First, try to get bettors from the mapping
        try {
          const bettors = await retryWithBackoff(() => contract.scenarioBettors(scenarioIdNum));
          totalBettors = bettors && Array.isArray(bettors) ? bettors.length : 0;
          
          // Only count if there are bettors (optimization)
          if (totalBettors > 0 && totalBettors <= 50) { // Reduced limit to avoid rate limiting
            // Process bettors in small batches with delays to avoid rate limiting
            const betResults = await processInBatches(
              bettors.slice(0, 50),
              5, // Process 5 at a time
              async (bettor: string) => {
                try {
                  const bet = await retryWithBackoff(() => contract.getUserBet(bettor, scenarioIdNum));
                  return bet[1] > 0n ? bet[2] : null; // Return choice if bet exists, null otherwise
                } catch (e) {
                  return null;
                }
              },
              300 // 300ms delay between batches
            );
            
            betResults.forEach((choice) => {
              if (choice === true) yesBettors++;
              else if (choice === false) noBettors++;
            });
          } else if (totalBettors > 50) {
            // Too many bettors, just set total (skip detailed counting to avoid rate limits)
            totalBettors = bettors.length;
          }
        } catch (mappingError: any) {
          // Mapping failed, will try events
          // If it's a rate limit error, skip bettor counting entirely
          if (mappingError?.code === -32603 || mappingError?.message?.includes('rate limit')) {
            console.warn(`Rate limited while fetching bettors for scenario ${scenarioIdNum}, skipping bettor count`);
          } else {
            console.warn(`scenarioBettors mapping failed for scenario ${scenarioIdNum}, trying events:`, mappingError);
          }
        }
        
        // If mapping returned 0 or failed, try querying events as fallback
        if (totalBettors === 0) {
          const eventBettors = await getBettorsFromEvents(contract, scenarioIdNum);
          if (eventBettors.totalBettors > 0) {
            totalBettors = eventBettors.totalBettors;
            yesBettors = eventBettors.yesBettors;
            noBettors = eventBettors.noBettors;
          }
        }
      }
    } catch (error: any) {
      // Log error for debugging but don't fail the scenario conversion
      console.warn(`Error fetching bettor counts for scenario ${id}:`, error?.message || error);
      // Try events as last resort
      try {
        const scenarioIdNum = parseInt(id, 10);
        if (!isNaN(scenarioIdNum)) {
          const eventBettors = await getBettorsFromEvents(contract, scenarioIdNum);
          totalBettors = eventBettors.totalBettors;
          yesBettors = eventBettors.yesBettors;
          noBettors = eventBettors.noBettors;
        }
      } catch (eventError) {
        // Events also failed, keep 0
        console.warn(`Event query also failed for scenario ${id}:`, eventError);
      }
    }
  }

  return {
    id,
    title: description.split('?')[0] + '?', // Extract title from description
    category,
    description,
    endDate,
    totalVolume: totalPoolNum,
    yesPool: yesPoolNum,
    noPool: noPoolNum,
    yesPrice,
    isTrending: totalPoolNum > 100000, // Trending if volume > 100k
    history: [], // Can be populated from events if needed
    // Add contract-specific fields
    isResolved,
    isClosed,
    outcome: isResolved ? outcome : undefined,
    adminFee: Number(formatUSDC(adminFee)),
    feeClaimed,
    // Store actual timestamps for proper deadline checking
    bettingDeadline: Number(bettingDeadline),
    resolutionDeadline: Number(resolutionDeadline),
    // Bettor counts
    yesBettors,
    noBettors,
    totalBettors,
    // Closed timestamp (use betting deadline if closed, or undefined)
    closedAt: isClosed ? Number(bettingDeadline) : undefined,
  };
}

/**
 * Get all scenarios
 */
export async function getAllScenarios(): Promise<Scenario[]> {
  const contract = getContract();
  const count = await retryWithBackoff(() => contract.getScenarioCount());
  const scenarios: Scenario[] = [];

  for (let i = 1; i <= Number(count); i++) {
    try {
      const scenarioData = await retryWithBackoff(() => contract.getScenario(i));
      try {
        scenarios.push(await convertScenario(scenarioData, i.toString(), contract));
      } catch (convertError: any) {
        // If convertScenario fails (e.g., bettor counting or rate limiting), try without contract for bettors
        if (convertError?.code === -32603 || convertError?.message?.includes('rate limit')) {
          console.warn(`Rate limited while processing scenario ${i}, skipping bettor data`);
        } else {
          console.warn(`Error converting scenario ${i}, trying without bettor data:`, convertError);
        }
        try {
          scenarios.push(await convertScenario(scenarioData, i.toString()));
        } catch (fallbackError) {
          console.error(`Error converting scenario ${i} (fallback):`, fallbackError);
        }
      }
      
      // Small delay between scenarios to avoid rate limiting
      if (i < Number(count)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error: any) {
      // If rate limited, skip this scenario and continue
      if (error?.code === -32603 || error?.message?.includes('rate limit')) {
        console.warn(`Rate limited while fetching scenario ${i}, skipping`);
        // Wait a bit longer before continuing
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.error(`Error fetching scenario ${i}:`, error);
      }
    }
  }

  return scenarios;
}

/**
 * Get a specific scenario
 */
export async function getScenario(scenarioId: number): Promise<Scenario | null> {
  try {
    const contract = getContract();
    const scenarioData = await contract.getScenario(scenarioId);
    try {
      return await convertScenario(scenarioData, scenarioId.toString(), contract);
    } catch (convertError) {
      // If convertScenario fails, try without contract for bettors
      console.warn(`Error converting scenario ${scenarioId}, trying without bettor data:`, convertError);
      return await convertScenario(scenarioData, scenarioId.toString());
    }
  } catch (error) {
    console.error(`Error fetching scenario ${scenarioId}:`, error);
    return null;
  }
}

/**
 * Get user bet for a scenario
 */
export async function getUserBet(
  userAddress: string,
  scenarioId: number
): Promise<UserBet | null> {
  try {
    const contract = getContract();
    const betData = await contract.getUserBet(userAddress, scenarioId);
    const [id, amount, choice, claimed] = betData;

    if (Number(amount) === 0) {
      return null;
    }

    // Get scenario to check if resolved and calculate winnings
    let canClaim = false;
    let winnings = 0;
    try {
      const scenarioData = await contract.getScenario(scenarioId);
      const [
        _id, description, createdAt, bettingDeadline, resolutionDeadline,
        totalPool, yesPool, noPool, isResolved, outcome, adminFee, feeClaimed, isClosed
      ] = scenarioData;

      if (isResolved && !claimed) {
        // Check if user won
        const userWon = (choice && outcome) || (!choice && !outcome);
        if (userWon) {
          canClaim = true;
          // Calculate winnings: (betAmount / winningPool) * (totalPool - adminFee)
          // All values from contract are in USDC wei (6 decimals, as BigInt)
          const winningPool = outcome ? yesPool : noPool;
          if (winningPool > 0n) {
            // Calculate using BigInt for precision: (betAmount * (totalPool - adminFee)) / winningPool
            const adjustedPool = totalPool - adminFee;
            const winningsWei = (amount * adjustedPool) / winningPool;
            // Convert from wei to USDC using formatUSDC
            winnings = Number(formatUSDC(winningsWei));
          }
        }
      }
    } catch (error) {
      // Scenario might not exist, that's okay
      console.error(`Error fetching scenario for bet calculation:`, error);
    }

    return {
      id: `${scenarioId}-${userAddress}`,
      scenarioId: scenarioId.toString(),
      amount: Number(formatUSDC(amount)),
      position: choice ? 'YES' : 'NO',
      timestamp: Date.now(), // Can be fetched from events if needed
      entryPrice: 0, // Can be calculated from scenario data
      currentValue: Number(formatUSDC(amount)), // Will be updated when resolved
      claimed: claimed,
      canClaim: canClaim,
      winnings: winnings > 0 ? winnings : undefined,
    };
  } catch (error) {
    console.error(`Error fetching user bet:`, error);
    return null;
  }
}

/**
 * Get all user bets across all scenarios
 */
export async function getAllUserBets(userAddress: string): Promise<UserBet[]> {
  const contract = getContract();
  const count = await contract.getScenarioCount();
  const bets: UserBet[] = [];

  for (let i = 1; i <= Number(count); i++) {
    try {
      const bet = await getUserBet(userAddress, i);
      if (bet) {
        bets.push(bet);
      }
    } catch (error) {
      // Scenario might not exist or user has no bet
    }
  }

  return bets;
}

/**
 * Place a bet on a scenario
 */
export async function placeBet(
  scenarioId: number,
  amount: number,
  choice: boolean
): Promise<ethers.ContractTransactionResponse> {
  try {
    const contract = await getContractWithSigner();
    const amountWei = parseUSDC(amount.toString());
    
    return await contract.placeBet(scenarioId, amountWei, choice);
  } catch (error: any) {
    // Provide better error message for rate limiting
    if (error?.code === -32603 || error?.message?.includes('rate limit') || error?.message?.includes('rate limited')) {
      throw new Error('The network is currently experiencing high traffic. Please wait a moment and try again.');
    }
    throw error;
  }
}

/**
 * Claim winnings from a resolved scenario
 */
export async function claimWinnings(
  scenarioId: number
): Promise<ethers.ContractTransactionResponse> {
  const contract = await getContractWithSigner();
  return await contract.claimWinnings(scenarioId);
}

/**
 * Create a new scenario (admin only)
 */
export async function createScenario(
  description: string,
  bettingDeadline: number, // Unix timestamp
  resolutionDeadline: number // Unix timestamp
): Promise<ethers.ContractTransactionResponse> {
  try {
    const contract = await getContractWithSigner();
    return await retryWithBackoff(
      () => contract.createScenario(description, bettingDeadline, resolutionDeadline),
      3,
      2000 // Start with 2 second delay for transactions
    );
  } catch (error: any) {
    if (error?.code === -32005 || error?.code === -32603 || error?.message?.includes('rate limit')) {
      throw new Error('The network is currently experiencing high traffic. Please wait a moment and try again.');
    }
    throw error;
  }
}

/**
 * Resolve a scenario (admin only)
 */
export async function resolveScenario(
  scenarioId: number,
  outcome: boolean
): Promise<ethers.ContractTransactionResponse> {
  try {
    const contract = await getContractWithSigner();
    return await retryWithBackoff(
      () => contract.resolveScenario(scenarioId, outcome),
      3,
      2000 // Start with 2 second delay for transactions
    );
  } catch (error: any) {
    if (error?.code === -32005 || error?.code === -32603 || error?.message?.includes('rate limit')) {
      throw new Error('The network is currently experiencing high traffic. Please wait a moment and try again.');
    }
    throw error;
  }
}

/**
 * Emergency resolve a scenario after resolution deadline (admin only)
 * This bypasses the resolution deadline check
 */
export async function emergencyResolve(
  scenarioId: number,
  outcome: boolean
): Promise<ethers.ContractTransactionResponse> {
  try {
    const contract = await getContractWithSigner();
    return await retryWithBackoff(
      () => contract.emergencyResolve(scenarioId, outcome),
      3,
      2000 // Start with 2 second delay for transactions
    );
  } catch (error: any) {
    if (error?.code === -32005 || error?.code === -32603 || error?.message?.includes('rate limit')) {
      throw new Error('The network is currently experiencing high traffic. Please wait a moment and try again.');
    }
    throw error;
  }
}

/**
 * Close betting for a scenario (admin only)
 */
export async function closeBetting(
  scenarioId: number
): Promise<ethers.ContractTransactionResponse> {
  try {
    const contract = await getContractWithSigner();
    return await retryWithBackoff(
      () => contract.closeBetting(scenarioId),
      3,
      2000 // Start with 2 second delay for transactions
    );
  } catch (error: any) {
    if (error?.code === -32005 || error?.code === -32603 || error?.message?.includes('rate limit')) {
      throw new Error('The network is currently experiencing high traffic. Please wait a moment and try again.');
    }
    throw error;
  }
}

/**
 * Claim admin fee (admin only)
 */
export async function claimAdminFee(
  scenarioId: number
): Promise<ethers.ContractTransactionResponse> {
  try {
    const contract = await getContractWithSigner();
    return await retryWithBackoff(
      () => contract.claimAdminFee(scenarioId),
      3,
      2000 // Start with 2 second delay for transactions
    );
  } catch (error: any) {
    if (error?.code === -32005 || error?.code === -32603 || error?.message?.includes('rate limit')) {
      throw new Error('The network is currently experiencing high traffic. Please wait a moment and try again.');
    }
    throw error;
  }
}

/**
 * Check if an address is the contract owner
 */
export async function isOwner(address: string): Promise<boolean> {
  try {
    const contract = getContract();
    const owner = await contract.owner();
    return owner.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error checking owner:', error);
    return false;
  }
}

/**
 * Get the contract owner address
 */
export async function getContractOwner(): Promise<string> {
  try {
    const contract = getContract();
    const owner = await contract.owner();
    return owner;
  } catch (error) {
    console.error('Error getting owner:', error);
    throw error;
  }
}

/**
 * Add an admin address (owner only)
 */
export async function addAdmin(adminAddress: string): Promise<ethers.ContractTransactionResponse> {
  try {
    // Normalize address before calling
    const normalizedAddress = normalizeAddress(adminAddress);
    console.log('🔵 Normalized admin address:', normalizedAddress);
    
    const contract = await getContractWithSigner();
    const contractAddress = getContractAddress();
    console.log('🔵 Contract address:', contractAddress);
    
    // Check if contract has addAdmin function by trying to get the function
    try {
      const addAdminFunction = contract.getFunction('addAdmin');
      console.log('🔵 addAdmin function found in ABI');
    } catch (funcError: any) {
      console.error('❌ addAdmin function not found in contract ABI');
      throw new Error('The contract ABI does not include addAdmin. Please ensure you are using the latest contract version with admin management features.');
    }
    
    // Verify contract owner before attempting call
    try {
      const owner = await contract.owner();
      const signer = await getSigner();
      const signerAddress = await signer.getAddress();
      console.log('🔵 Contract owner:', owner);
      console.log('🔵 Your address:', signerAddress);
      if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error(`You are not the contract owner. Owner is: ${owner}, Your address: ${signerAddress}`);
      }
    } catch (ownerCheckError: any) {
      if (ownerCheckError.message?.includes('not the contract owner')) {
        throw ownerCheckError;
      }
      console.warn('⚠️ Could not verify owner (continuing anyway):', ownerCheckError);
    }
    
    // Check if address is already admin
    try {
      const isAlreadyAdmin = await contract.isAdmin(normalizedAddress);
      console.log('🔵 Is already admin:', isAlreadyAdmin);
      if (isAlreadyAdmin) {
        throw new Error('This address is already an admin.');
      }
    } catch (adminCheckError: any) {
      if (adminCheckError.message?.includes('already an admin')) {
        throw adminCheckError;
      }
      console.warn('⚠️ Could not check admin status (continuing anyway):', adminCheckError);
    }
    
    console.log('🔵 Calling addAdmin on contract...');
    
    // Try to call the function directly - let MetaMask handle gas estimation
    // This avoids the "missing revert data" issue during separate gas estimation
    try {
      console.log('🔵 Attempting contract call (MetaMask will estimate gas)...');
      const tx = await contract.addAdmin(normalizedAddress);
      console.log('🔵 Transaction created:', tx.hash);
      return tx;
    } catch (callError: any) {
      console.error('❌ Contract call failed:', callError);
      
      // Handle specific error cases
      if (callError.code === 'CALL_EXCEPTION' || callError.message?.includes('missing revert data')) {
        // The most likely cause is that the contract doesn't actually have this function
        // even though it's in the ABI (old contract deployment)
        throw new Error(
          'Contract call failed with "missing revert data". This usually means:\n\n' +
          '1) The deployed contract at ' + contractAddress + ' does not have the addAdmin function\n' +
          '   (contract was deployed before admin management was added)\n' +
          '2) The contract address in your .env file is incorrect\n' +
          '3) Network/RPC issue\n\n' +
          'Solution: Deploy a new contract with the latest code that includes addAdmin, or update the contract address in your .env file.'
        );
      }
      throw callError;
    }
  } catch (error: any) {
    console.error('❌ Error in addAdmin service:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      reason: error.reason,
      data: error.data,
      info: error.info,
      args: error.args
    });
    
    // Re-throw with better error message if possible
    if (error.reason) {
      throw new Error(error.reason);
    } else if (error.data?.message) {
      throw new Error(error.data.message);
    } else if (error.message) {
      // If it's already our custom error, throw it as-is
      if (error.message.includes('does not support') || error.message.includes('Contract call failed')) {
        throw error;
      }
      throw error;
    } else {
      throw new Error('Failed to add admin. Please check console for details.');
    }
  }
}

/**
 * Remove an admin address (owner only)
 */
export async function removeAdmin(adminAddress: string): Promise<ethers.ContractTransactionResponse> {
  try {
    const contract = await getContractWithSigner();
    return await contract.removeAdmin(adminAddress);
  } catch (error) {
    console.error('Error removing admin:', error);
    throw error;
  }
}

/**
 * Get all admin addresses (including owner)
 */
export async function getAllAdmins(): Promise<string[]> {
  try {
    const contract = getContract();
    const admins = await contract.getAllAdmins();
    return admins;
  } catch (error) {
    console.error('Error getting admins:', error);
    throw error;
  }
}

/**
 * Check if an address is admin (owner is always admin)
 */
export async function isAdmin(address: string): Promise<boolean> {
  try {
    const contract = getContract();
    const contractAddress = getContractAddress();
    
    console.log('[isAdmin] Checking admin status for:', address);
    console.log('[isAdmin] Using contract address:', contractAddress);
    
    // First check if address is the owner (owner should always have admin access)
    const owner = await contract.owner();
    console.log('[isAdmin] Contract owner:', owner);
    
    if (owner.toLowerCase() === address.toLowerCase()) {
      console.log('[isAdmin] ✅ Address is the owner - granting admin access');
      return true;
    }
    
    // Check if address has ADMIN_ROLE
    try {
      const hasAdminRole = await contract.isAdmin(address);
      console.log('[isAdmin] Has ADMIN_ROLE:', hasAdminRole);
      if (hasAdminRole) {
        return true;
      }
    } catch (roleError: any) {
      console.warn('[isAdmin] Error checking ADMIN_ROLE (contract may not support it):', roleError.message);
      // If isAdmin function doesn't exist (old contract), just rely on owner check
    }
    
    console.log('[isAdmin] ❌ Address is not owner and does not have ADMIN_ROLE');
    return false;
  } catch (error: any) {
    console.error('[isAdmin] Error checking admin status:', error);
    console.error('[isAdmin] Error details:', {
      message: error?.message,
      code: error?.code,
      data: error?.data
    });
    return false;
  }
}

/**
 * Get the minimum bet amount from the contract (for debugging)
 */
export async function getMinBet(): Promise<number> {
  try {
    const contract = getContract();
    const minBetWei = await contract.MIN_BET();
    return Number(formatUSDC(minBetWei));
  } catch (error) {
    console.error('Error getting MIN_BET:', error);
    return 0;
  }
}

/**
 * Get the contract address being used (for debugging)
 */
export function getCurrentContractAddress(): string {
  return getContractAddress();
}

