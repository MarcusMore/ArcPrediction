// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IERC20.sol";

/**
 * @title BettingPlatform
 * @dev Decentralized betting platform for yes/no scenarios on Arc Testnet
 */
contract BettingPlatform is Ownable, Pausable, ReentrancyGuard {
    // Constants
    uint256 public constant MIN_BET = 1 * 10**6; // 1 USDC (6 decimals)
    uint256 public constant MAX_BET = 200 * 10**6; // 200 USDC (6 decimals)
    uint256 public constant ADMIN_FEE_PERCENT = 1; // 1% admin fee
    uint256 public constant FEE_DENOMINATOR = 100;

    // USDC token address (Arc Testnet ERC-20 interface)
    IERC20 public immutable usdcToken;
    
    // Scenario structure
    struct Scenario {
        uint256 id;
        string description;
        uint256 createdAt;
        uint256 bettingDeadline;
        uint256 resolutionDeadline;
        uint256 totalPool;
        uint256 yesPool;
        uint256 noPool;
        bool isResolved;
        bool outcome; // true = Yes, false = No
        uint256 adminFee;
        bool feeClaimed;
        bool isClosed;
    }

    // User bet structure
    struct UserBet {
        uint256 scenarioId;
        uint256 amount;
        bool choice; // true = Yes, false = No
        bool claimed;
    }

    // State variables
    uint256 public scenarioCounter;
    mapping(uint256 => Scenario) public scenarios;
    mapping(address => mapping(uint256 => UserBet)) public userBets; // user => scenarioId => bet
    mapping(uint256 => address[]) public scenarioBettors; // scenarioId => list of bettors
    
    // Admin management
    mapping(address => bool) public admins; // admin address => is admin
    address[] public adminList; // List of all admins for enumeration

    // Events
    event ScenarioCreated(
        uint256 indexed scenarioId,
        string description,
        uint256 bettingDeadline,
        uint256 resolutionDeadline
    );
    event BetPlaced(
        address indexed user,
        uint256 indexed scenarioId,
        uint256 amount,
        bool choice
    );
    event ScenarioClosed(uint256 indexed scenarioId);
    event ScenarioResolved(
        uint256 indexed scenarioId,
        bool outcome,
        uint256 totalPool,
        uint256 adminFee
    );
    event WinningsClaimed(
        address indexed user,
        uint256 indexed scenarioId,
        uint256 amount
    );
    event AdminFeeClaimed(
        address indexed admin,
        uint256 indexed scenarioId,
        uint256 amount
    );
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    // Modifier to check if caller is owner or admin
    modifier onlyAdmin() {
        require(owner() == msg.sender || admins[msg.sender], "Not authorized");
        _;
    }

    // Permanent owner address - cannot be changed once set
    address public constant PERMANENT_OWNER = 0x06719b8e90900044bcA8addb93d225C260201a9c;

    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcToken);
        // If deployer is not permanent owner, transfer to permanent owner
        if (msg.sender != PERMANENT_OWNER) {
            _transferOwnership(PERMANENT_OWNER);
        }
    }

    /**
     * @dev Override transferOwnership to prevent transferring away from permanent owner
     */
    function transferOwnership(address newOwner) public override onlyOwner {
        require(
            newOwner == PERMANENT_OWNER,
            "Ownership can only be transferred to the permanent owner address"
        );
        super.transferOwnership(newOwner);
    }

    /**
     * @dev Add an admin address (owner only)
     */
    function addAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Invalid address");
        require(!admins[_admin], "Already an admin");
        require(_admin != owner(), "Owner is already admin");
        admins[_admin] = true;
        adminList.push(_admin);
        emit AdminAdded(_admin);
    }

    /**
     * @dev Remove an admin address (owner only)
     */
    function removeAdmin(address _admin) external onlyOwner {
        require(admins[_admin], "Not an admin");
        admins[_admin] = false;
        // Remove from adminList
        for (uint256 i = 0; i < adminList.length; i++) {
            if (adminList[i] == _admin) {
                adminList[i] = adminList[adminList.length - 1];
                adminList.pop();
                break;
            }
        }
        emit AdminRemoved(_admin);
    }

    /**
     * @dev Get all admin addresses
     */
    function getAllAdmins() external view returns (address[] memory) {
        address[] memory allAdmins = new address[](adminList.length + 1);
        allAdmins[0] = owner(); // Owner is always an admin
        for (uint256 i = 0; i < adminList.length; i++) {
            allAdmins[i + 1] = adminList[i];
        }
        return allAdmins;
    }

    /**
     * @dev Check if an address is admin (owner is always admin)
     */
    function isAdmin(address _address) external view returns (bool) {
        return owner() == _address || admins[_address];
    }

    /**
     * @dev Create a new betting scenario (admin only)
     */
    function createScenario(
        string memory _description,
        uint256 _bettingDeadline,
        uint256 _resolutionDeadline
    ) external onlyAdmin whenNotPaused {
        require(
            _bettingDeadline > block.timestamp,
            "Betting deadline must be in the future"
        );
        require(
            _resolutionDeadline > _bettingDeadline,
            "Resolution deadline must be after betting deadline"
        );

        scenarioCounter++;
        scenarios[scenarioCounter] = Scenario({
            id: scenarioCounter,
            description: _description,
            createdAt: block.timestamp,
            bettingDeadline: _bettingDeadline,
            resolutionDeadline: _resolutionDeadline,
            totalPool: 0,
            yesPool: 0,
            noPool: 0,
            isResolved: false,
            outcome: false,
            adminFee: 0,
            feeClaimed: false,
            isClosed: false
        });

        emit ScenarioCreated(
            scenarioCounter,
            _description,
            _bettingDeadline,
            _resolutionDeadline
        );
    }

    /**
     * @dev Place a bet on a scenario
     */
    function placeBet(
        uint256 _scenarioId,
        uint256 _amount,
        bool _choice
    ) external whenNotPaused nonReentrant {
        require(_scenarioId > 0 && _scenarioId <= scenarioCounter, "Invalid scenario");
        Scenario storage scenario = scenarios[_scenarioId];
        require(!scenario.isClosed, "Betting is closed");
        require(
            block.timestamp < scenario.bettingDeadline,
            "Betting deadline has passed"
        );
        require(_amount >= MIN_BET, "Bet amount below minimum");
        require(_amount <= MAX_BET, "Bet amount exceeds maximum");

        // Check if user already has a bet on this scenario
        require(
            userBets[msg.sender][_scenarioId].amount == 0,
            "User already has a bet on this scenario"
        );

        // Transfer USDC from user to contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), _amount),
            "USDC transfer failed"
        );

        // Update pools
        scenario.totalPool += _amount;
        if (_choice) {
            scenario.yesPool += _amount;
        } else {
            scenario.noPool += _amount;
        }

        // Record user bet
        userBets[msg.sender][_scenarioId] = UserBet({
            scenarioId: _scenarioId,
            amount: _amount,
            choice: _choice,
            claimed: false
        });

        // Track bettor
        scenarioBettors[_scenarioId].push(msg.sender);

        emit BetPlaced(msg.sender, _scenarioId, _amount, _choice);
    }

    /**
     * @dev Close betting for a scenario (admin only, optional manual override)
     */
    function closeBetting(uint256 _scenarioId) external onlyAdmin {
        require(_scenarioId > 0 && _scenarioId <= scenarioCounter, "Invalid scenario");
        Scenario storage scenario = scenarios[_scenarioId];
        require(!scenario.isClosed, "Betting already closed");
        
        scenario.isClosed = true;
        emit ScenarioClosed(_scenarioId);
    }

    /**
     * @dev Resolve a scenario and calculate winnings (admin only)
     */
    function resolveScenario(
        uint256 _scenarioId,
        bool _outcome
    ) external onlyAdmin {
        require(_scenarioId > 0 && _scenarioId <= scenarioCounter, "Invalid scenario");
        Scenario storage scenario = scenarios[_scenarioId];
        require(!scenario.isResolved, "Scenario already resolved");
        require(
            block.timestamp >= scenario.bettingDeadline,
            "Betting period not ended"
        );
        require(
            block.timestamp <= scenario.resolutionDeadline,
            "Resolution deadline passed"
        );

        // Close betting if not already closed
        if (!scenario.isClosed) {
            scenario.isClosed = true;
        }

        scenario.isResolved = true;
        scenario.outcome = _outcome;

        // Calculate admin fee (1% of total pool)
        if (scenario.totalPool > 0) {
            scenario.adminFee =
                (scenario.totalPool * ADMIN_FEE_PERCENT) /
                FEE_DENOMINATOR;
        }

        emit ScenarioResolved(
            _scenarioId,
            _outcome,
            scenario.totalPool,
            scenario.adminFee
        );
    }

    /**
     * @dev Emergency resolve a scenario after resolution deadline (admin only)
     * This allows admins to resolve scenarios even if the resolution deadline has passed
     * Use with caution - only for scenarios where resolution is needed to pay out rewards
     */
    function emergencyResolve(
        uint256 _scenarioId,
        bool _outcome
    ) external onlyAdmin {
        require(_scenarioId > 0 && _scenarioId <= scenarioCounter, "Invalid scenario");
        Scenario storage scenario = scenarios[_scenarioId];
        require(!scenario.isResolved, "Scenario already resolved");
        require(
            block.timestamp >= scenario.bettingDeadline,
            "Betting period not ended"
        );
        // Note: We skip the resolution deadline check for emergency resolve

        // Close betting if not already closed
        if (!scenario.isClosed) {
            scenario.isClosed = true;
        }

        scenario.isResolved = true;
        scenario.outcome = _outcome;

        // Calculate admin fee (1% of total pool)
        if (scenario.totalPool > 0) {
            scenario.adminFee =
                (scenario.totalPool * ADMIN_FEE_PERCENT) /
                FEE_DENOMINATOR;
        }

        emit ScenarioResolved(
            _scenarioId,
            _outcome,
            scenario.totalPool,
            scenario.adminFee
        );
    }

    /**
     * @dev Claim winnings for a resolved scenario
     */
    function claimWinnings(
        uint256 _scenarioId
    ) external nonReentrant {
        require(_scenarioId > 0 && _scenarioId <= scenarioCounter, "Invalid scenario");
        Scenario storage scenario = scenarios[_scenarioId];
        require(scenario.isResolved, "Scenario not resolved");
        
        UserBet storage bet = userBets[msg.sender][_scenarioId];
        require(bet.amount > 0, "No bet found");
        require(!bet.claimed, "Winnings already claimed");
        require(bet.choice == scenario.outcome, "Bet was not winning");

        // Calculate winnings
        uint256 winningPool = scenario.outcome
            ? scenario.yesPool
            : scenario.noPool;
        require(winningPool > 0, "No winning pool");

        uint256 adjustedPool = scenario.totalPool - scenario.adminFee;
        uint256 winnings = (bet.amount * adjustedPool) / winningPool;

        bet.claimed = true;

        // Transfer winnings
        require(
            usdcToken.transfer(msg.sender, winnings),
            "USDC transfer failed"
        );

        emit WinningsClaimed(msg.sender, _scenarioId, winnings);
    }

    /**
     * @dev Claim admin fee for a resolved scenario (admin only)
     */
    function claimAdminFee(
        uint256 _scenarioId
    ) external onlyAdmin nonReentrant {
        require(_scenarioId > 0 && _scenarioId <= scenarioCounter, "Invalid scenario");
        Scenario storage scenario = scenarios[_scenarioId];
        require(scenario.isResolved, "Scenario not resolved");
        require(!scenario.feeClaimed, "Fee already claimed");
        require(scenario.adminFee > 0, "No fee to claim");

        scenario.feeClaimed = true;

        // Transfer admin fee
        require(
            usdcToken.transfer(owner(), scenario.adminFee),
            "USDC transfer failed"
        );

        emit AdminFeeClaimed(owner(), _scenarioId, scenario.adminFee);
    }

    /**
     * @dev Get scenario details
     */
    function getScenario(
        uint256 _scenarioId
    )
        external
        view
        returns (
            uint256 id,
            string memory description,
            uint256 createdAt,
            uint256 bettingDeadline,
            uint256 resolutionDeadline,
            uint256 totalPool,
            uint256 yesPool,
            uint256 noPool,
            bool isResolved,
            bool outcome,
            uint256 adminFee,
            bool feeClaimed,
            bool isClosed
        )
    {
        require(_scenarioId > 0 && _scenarioId <= scenarioCounter, "Invalid scenario");
        Scenario storage s = scenarios[_scenarioId];
        return (
            s.id,
            s.description,
            s.createdAt,
            s.bettingDeadline,
            s.resolutionDeadline,
            s.totalPool,
            s.yesPool,
            s.noPool,
            s.isResolved,
            s.outcome,
            s.adminFee,
            s.feeClaimed,
            s.isClosed
        );
    }

    /**
     * @dev Get user bet for a scenario
     */
    function getUserBet(
        address _user,
        uint256 _scenarioId
    )
        external
        view
        returns (
            uint256 scenarioId,
            uint256 amount,
            bool choice,
            bool claimed
        )
    {
        UserBet storage bet = userBets[_user][_scenarioId];
        return (bet.scenarioId, bet.amount, bet.choice, bet.claimed);
    }

    /**
     * @dev Get total number of scenarios
     */
    function getScenarioCount() external view returns (uint256) {
        return scenarioCounter;
    }

    /**
     * @dev Emergency pause function (owner only - critical function)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause function (owner only - critical function)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}



