import { ethers } from 'ethers';

// Custom provider class that disables ENS
class ArcTestnetProvider extends ethers.BrowserProvider {
  async getNetwork(): Promise<ethers.Network> {
    // Get chainId directly without ENS lookup
    const chainId = await this.send('eth_chainId', []);
    return {
      chainId: BigInt(chainId),
      name: 'Arc Testnet',
      ensAddress: null,
    };
  }

  async resolveName(name: string): Promise<null> {
    // Always return null - ENS not supported
    return null;
  }

  async lookupAddress(address: string): Promise<null> {
    // Always return null - ENS not supported
    return null;
  }
}

// Arc Testnet Configuration
export const ARC_TESTNET = {
  chainId: '0x4cef52', // 5042002 in hex (corrected from 0x4D0A02)
  chainName: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18, // Native USDC uses 18 decimals for gas
  },
  rpcUrls: ['https://rpc.testnet.arc.network'],
  blockExplorerUrls: ['https://testnet.arcscan.app'],
};

// USDC ERC-20 interface address (6 decimals for ERC-20)
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
export const USDC_DECIMALS = 6; // ERC-20 USDC uses 6 decimals

// Contract ABI (minimal for now, will be updated after deployment)
export const BETTING_PLATFORM_ABI = [
  'function createScenario(string memory _description, uint256 _bettingDeadline, uint256 _resolutionDeadline) external',
  'function placeBet(uint256 _scenarioId, uint256 _amount, bool _choice) external',
  'function resolveScenario(uint256 _scenarioId, bool _outcome) external',
  'function emergencyResolve(uint256 _scenarioId, bool _outcome) external',
  'function claimWinnings(uint256 _scenarioId) external',
  'function scenarioBettors(uint256) external view returns (address[])',
  'function claimAdminFee(uint256 _scenarioId) external',
  'function getScenario(uint256 _scenarioId) external view returns (uint256 id, string memory description, uint256 createdAt, uint256 bettingDeadline, uint256 resolutionDeadline, uint256 totalPool, uint256 yesPool, uint256 noPool, bool isResolved, bool outcome, uint256 adminFee, bool feeClaimed, bool isClosed)',
  'function getUserBet(address _user, uint256 _scenarioId) external view returns (uint256 scenarioId, uint256 amount, bool choice, bool claimed)',
  'function getScenarioCount() external view returns (uint256)',
  'function closeBetting(uint256 _scenarioId) external',
  'function owner() external view returns (address)',
  'function addAdmin(address _admin) external',
  'function removeAdmin(address _admin) external',
  'function getAllAdmins() external view returns (address[])',
  'function isAdmin(address _address) external view returns (bool)',
  'function admins(address) external view returns (bool)',
  'function MIN_BET() external view returns (uint256)',
  'function MAX_BET() external view returns (uint256)',
  'event ScenarioCreated(uint256 indexed scenarioId, string description, uint256 bettingDeadline, uint256 resolutionDeadline)',
  'event BetPlaced(address indexed user, uint256 indexed scenarioId, uint256 amount, bool choice)',
  'event ScenarioResolved(uint256 indexed scenarioId, bool outcome, uint256 totalPool, uint256 adminFee)',
  'event WinningsClaimed(address indexed user, uint256 indexed scenarioId, uint256 amount)',
];

// USDC ERC-20 ABI
export const USDC_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function decimals() external view returns (uint8)',
];

/**
 * Connect to MetaMask and switch/add Arc Testnet
 */
export async function connectWallet(): Promise<string> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  // Use custom provider that disables ENS
  const provider = new ArcTestnetProvider(window.ethereum);
  
  // Request account access
  const accounts = await provider.send('eth_requestAccounts', []);
  if (accounts.length === 0) {
    throw new Error('No accounts found');
  }

  const address = accounts[0];
  
  // Check current chain (using custom provider that doesn't trigger ENS)
  const network = await provider.getNetwork();
  const chainId = network.chainId;
  
  // Switch to Arc Testnet if not already connected
  if (chainId !== BigInt(5042002)) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARC_TESTNET.chainId }],
      });
    } catch (switchError: any) {
      // Chain doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [ARC_TESTNET],
        });
      } else {
        throw switchError;
      }
    }
  }

  return address;
}

/**
 * Get provider instance with ENS disabled
 */
export function getProvider(): ethers.BrowserProvider {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }
  
  // Use custom provider that disables ENS
  const provider = new ArcTestnetProvider(window.ethereum);
  return provider;
}

/**
 * Get signer instance (using custom provider that disables ENS)
 */
export async function getSigner(): Promise<ethers.JsonRpcSigner> {
  const provider = getProvider();
  // Custom provider handles ENS errors, so this should work without issues
  return await provider.getSigner();
}

/**
 * Format USDC amount (6 decimals)
 */
export function formatUSDC(amount: bigint): string {
  return ethers.formatUnits(amount, USDC_DECIMALS);
}

/**
 * Parse USDC amount (6 decimals)
 */
export function parseUSDC(amount: string): bigint {
  return ethers.parseUnits(amount, USDC_DECIMALS);
}

/**
 * Get USDC balance
 */
export async function getUSDCBalance(address: string): Promise<bigint> {
  try {
    const provider = getProvider();
    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
    return await usdcContract.balanceOf(address);
  } catch (error: any) {
    // Suppress ENS errors
    if (error.code === 'UNSUPPORTED_OPERATION' && error.operation === 'getEnsAddress') {
      // Retry - ENS error shouldn't affect balanceOf
      const provider = getProvider();
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
      return await usdcContract.balanceOf(address);
    }
    throw error;
  }
}

/**
 * Get USDC allowance
 */
export async function getUSDCAllowance(
  owner: string,
  spender: string
): Promise<bigint> {
  const provider = getProvider();
  const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
  return await usdcContract.allowance(owner, spender);
}

/**
 * Approve USDC spending
 */
export async function approveUSDC(
  spender: string,
  amount: bigint
): Promise<ethers.ContractTransactionResponse> {
  const signer = await getSigner();
  const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
  return await usdcContract.approve(spender, amount);
}

