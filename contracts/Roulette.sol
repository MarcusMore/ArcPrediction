// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IERC20.sol";

/**
 * @title Roulette
 * @dev Premium roulette game with weighted prize distribution
 * Users can spin to win prizes from a prize pool funded by the owner
 */
contract Roulette is Ownable, Pausable, ReentrancyGuard {
    // Token used for prizes (USDT or USDC)
    IERC20 public immutable prizeToken;
    
    // Prize tiers with their probabilities (in basis points, 10000 = 100%)
    struct PrizeTier {
        uint256 amount;      // Prize amount in token units (6 decimals for USDC/USDT)
        uint256 probability; // Probability in basis points (e.g., 100 = 1%)
        string name;          // Prize tier name
    }
    
    // Prize tiers configuration
    PrizeTier[] public prizeTiers;
    
    // Total probability (should sum to 10000 = 100%)
    uint256 public constant TOTAL_PROBABILITY = 10000;
    
    // Minimum spin cost (entry fee)
    uint256 public spinCost;
    
    // Prize pool balance
    uint256 public prizePool;
    
    // Statistics
    uint256 public totalSpins;
    uint256 public totalPrizesWon;
    uint256 public totalPrizeAmount;
    
    // Daily spin limit tracking
    mapping(address => uint256) public lastSpinTime; // user => timestamp of last spin
    uint256 public constant SPIN_COOLDOWN = 24 hours; // 24 hours cooldown between spins
    
    // Events
    event PrizePoolFunded(address indexed funder, uint256 amount);
    event SpinExecuted(address indexed player, uint256 spinResult, uint256 prizeWon, string prizeName);
    event PrizeTierUpdated(uint256 indexed tierIndex, uint256 amount, uint256 probability, string name);
    event SpinCostUpdated(uint256 newCost);
    
    constructor(address _prizeToken, uint256 _spinCost) Ownable(msg.sender) {
        require(_prizeToken != address(0), "Invalid token address");
        prizeToken = IERC20(_prizeToken);
        spinCost = _spinCost;
        
        // Initialize default prize tiers with weighted probabilities
        // Higher prizes have lower probabilities
        // Maximum prize is 100 USDC
        prizeTiers.push(PrizeTier({
            amount: 0,           // Nothing (35% chance)
            probability: 3500,
            name: "Nothing"
        }));
        prizeTiers.push(PrizeTier({
            amount: 1 * 10**6,   // 1 USDC (25% chance)
            probability: 2500,
            name: "Small Prize"
        }));
        prizeTiers.push(PrizeTier({
            amount: 2 * 10**6,   // 2 USDC (15% chance)
            probability: 1500,
            name: "Tiny Prize"
        }));
        prizeTiers.push(PrizeTier({
            amount: 5 * 10**6,   // 5 USDC (10% chance)
            probability: 1000,
            name: "Medium Prize"
        }));
        prizeTiers.push(PrizeTier({
            amount: 10 * 10**6,   // 10 USDC (6% chance)
            probability: 600,
            name: "Good Prize"
        }));
        prizeTiers.push(PrizeTier({
            amount: 20 * 10**6,   // 20 USDC (4% chance)
            probability: 400,
            name: "Great Prize"
        }));
        prizeTiers.push(PrizeTier({
            amount: 50 * 10**6,   // 50 USDC (3% chance)
            probability: 300,
            name: "Excellent Prize"
        }));
        prizeTiers.push(PrizeTier({
            amount: 75 * 10**6,   // 75 USDC (1.4% chance)
            probability: 140,
            name: "Epic Prize"
        }));
        prizeTiers.push(PrizeTier({
            amount: 100 * 10**6,  // 100 USDC (0.6% chance) - MAXIMUM
            probability: 60,
            name: "Legendary Prize"
        }));
        
        // Verify probabilities sum to 10000
        uint256 totalProb = 0;
        for (uint256 i = 0; i < prizeTiers.length; i++) {
            totalProb += prizeTiers[i].probability;
        }
        require(totalProb == TOTAL_PROBABILITY, "Probabilities must sum to 10000");
    }
    
    /**
     * @dev Fund the prize pool with tokens
     * @param _amount Amount of tokens to add to prize pool
     */
    function fundPrizePool(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(prizeToken.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        
        prizePool += _amount;
        emit PrizePoolFunded(msg.sender, _amount);
    }
    
    /**
     * @dev Spin the roulette and win a prize
     * User must pay spinCost to play
     * Users can only spin once per day (24 hours)
     */
    function spin() external whenNotPaused nonReentrant {
        require(spinCost > 0, "Spin cost not set");
        require(prizePool > 0, "Prize pool is empty");
        
        // Check if user has already spun today
        uint256 lastSpin = lastSpinTime[msg.sender];
        require(
            lastSpin == 0 || block.timestamp >= lastSpin + SPIN_COOLDOWN,
            "You can only spin once per day. Please wait 24 hours."
        );
        
        // Transfer spin cost from user
        require(prizeToken.transferFrom(msg.sender, address(this), spinCost), "Spin cost transfer failed");
        
        // Generate random number (0-9999) using block data
        uint256 randomValue = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.number,
            msg.sender,
            totalSpins
        ))) % TOTAL_PROBABILITY;
        
        // Determine which prize tier was won
        uint256 cumulativeProbability = 0;
        uint256 winningTierIndex = 0;
        
        for (uint256 i = 0; i < prizeTiers.length; i++) {
            cumulativeProbability += prizeTiers[i].probability;
            if (randomValue < cumulativeProbability) {
                winningTierIndex = i;
                break;
            }
        }
        
        PrizeTier memory winningTier = prizeTiers[winningTierIndex];
        uint256 prizeAmount = winningTier.amount;
        
        // Update statistics
        totalSpins++;
        
        // Update last spin time for this user
        lastSpinTime[msg.sender] = block.timestamp;
        
        // Award prize if not "Nothing"
        if (prizeAmount > 0) {
            require(prizePool >= prizeAmount, "Insufficient prize pool");
            prizePool -= prizeAmount;
            totalPrizesWon++;
            totalPrizeAmount += prizeAmount;
            
            // Transfer prize to winner
            require(prizeToken.transfer(msg.sender, prizeAmount), "Prize transfer failed");
        } else {
            // If user wins "Nothing", add spin cost to prize pool
            prizePool += spinCost;
        }
        
        emit SpinExecuted(msg.sender, randomValue, prizeAmount, winningTier.name);
    }
    
    /**
     * @dev Get all prize tiers
     */
    function getAllPrizeTiers() external view returns (PrizeTier[] memory) {
        return prizeTiers;
    }
    
    /**
     * @dev Get prize tier count
     */
    function getPrizeTierCount() external view returns (uint256) {
        return prizeTiers.length;
    }
    
    /**
     * @dev Update a prize tier (owner only)
     */
    function updatePrizeTier(
        uint256 _tierIndex,
        uint256 _amount,
        uint256 _probability,
        string memory _name
    ) external onlyOwner {
        require(_tierIndex < prizeTiers.length, "Invalid tier index");
        require(_probability > 0, "Probability must be greater than 0");
        
        // Calculate new total probability
        uint256 newTotalProb = 0;
        for (uint256 i = 0; i < prizeTiers.length; i++) {
            if (i == _tierIndex) {
                newTotalProb += _probability;
            } else {
                newTotalProb += prizeTiers[i].probability;
            }
        }
        require(newTotalProb == TOTAL_PROBABILITY, "Probabilities must sum to 10000");
        
        prizeTiers[_tierIndex] = PrizeTier({
            amount: _amount,
            probability: _probability,
            name: _name
        });
        
        emit PrizeTierUpdated(_tierIndex, _amount, _probability, _name);
    }
    
    /**
     * @dev Set spin cost (owner only)
     */
    function setSpinCost(uint256 _newCost) external onlyOwner {
        spinCost = _newCost;
        emit SpinCostUpdated(_newCost);
    }
    
    /**
     * @dev Withdraw tokens from prize pool (owner only, emergency use)
     */
    function withdrawPrizePool(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount <= prizePool, "Insufficient prize pool");
        
        prizePool -= _amount;
        require(prizeToken.transfer(owner(), _amount), "Withdrawal failed");
    }
    
    /**
     * @dev Get current prize pool balance
     */
    function getPrizePool() external view returns (uint256) {
        return prizePool;
    }
    
    /**
     * @dev Get spin cost
     */
    function getSpinCost() external view returns (uint256) {
        return spinCost;
    }
    
    /**
     * @dev Get time until user can spin again
     * @param _user Address of the user
     * @return secondsUntilNextSpin Time in seconds until user can spin again (0 if can spin now)
     */
    function getTimeUntilNextSpin(address _user) external view returns (uint256) {
        uint256 lastSpin = lastSpinTime[_user];
        if (lastSpin == 0) {
            return 0; // User has never spun, can spin now
        }
        
        uint256 nextSpinTime = lastSpin + SPIN_COOLDOWN;
        if (block.timestamp >= nextSpinTime) {
            return 0; // Cooldown has passed, can spin now
        }
        
        return nextSpinTime - block.timestamp; // Time remaining
    }
    
    /**
     * @dev Check if user can spin now
     * @param _user Address of the user
     * @return canSpin True if user can spin now, false otherwise
     * @return timeRemaining Time remaining in seconds until next spin (0 if can spin now)
     */
    function canUserSpin(address _user) external view returns (bool canSpin, uint256 timeRemaining) {
        uint256 lastSpin = lastSpinTime[_user];
        if (lastSpin == 0) {
            return (true, 0); // User has never spun, can spin now
        }
        
        uint256 nextSpinTime = lastSpin + SPIN_COOLDOWN;
        if (block.timestamp >= nextSpinTime) {
            return (true, 0); // Cooldown has passed, can spin now
        }
        
        timeRemaining = nextSpinTime - block.timestamp;
        return (false, timeRemaining); // Still in cooldown
    }
    
    /**
     * @dev Pause the contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

