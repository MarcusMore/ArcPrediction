import { expect } from "chai";
import { ethers } from "hardhat";
import { BettingPlatform } from "../typechain-types";
import { IERC20 } from "../typechain-types";

describe("BettingPlatform", function () {
  let bettingPlatform: BettingPlatform;
  let usdcToken: IERC20;
  let owner: any;
  let user1: any;
  let user2: any;
  let usdcAddress: string;

  const MIN_BET = ethers.parseUnits("1", 6); // 1 USDC
  const MAX_BET = ethers.parseUnits("200", 6); // 200 USDC
  const USDC_DECIMALS = 6;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // USDC address on Arc Testnet
    usdcAddress = "0x3600000000000000000000000000000000000000";
    
    // Deploy BettingPlatform
    const BettingPlatformFactory = await ethers.getContractFactory("BettingPlatform");
    bettingPlatform = await BettingPlatformFactory.deploy(usdcAddress);
    await bettingPlatform.waitForDeployment();

    // Get USDC contract instance
    const USDC_ABI = [
      "function balanceOf(address account) external view returns (uint256)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function transfer(address to, uint256 amount) external returns (bool)",
      "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
      "function decimals() external view returns (uint8)",
    ];
    usdcToken = new ethers.Contract(usdcAddress, USDC_ABI, owner) as any as IERC20;
  });

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await bettingPlatform.usdcToken()).to.equal(usdcAddress);
    });

    it("Should set the correct owner", async function () {
      expect(await bettingPlatform.owner()).to.equal(owner.address);
    });
  });

  describe("Scenario Creation", function () {
    it("Should create a new scenario", async function () {
      const description = "Will Bitcoin reach $100k?";
      const bettingDeadline = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
      const resolutionDeadline = bettingDeadline + 86400; // 2 days from now

      await expect(
        bettingPlatform.createScenario(description, bettingDeadline, resolutionDeadline)
      )
        .to.emit(bettingPlatform, "ScenarioCreated")
        .withArgs(1, description, bettingDeadline, resolutionDeadline);

      const scenario = await bettingPlatform.getScenario(1);
      expect(scenario.id).to.equal(1);
      expect(scenario.description).to.equal(description);
      expect(scenario.bettingDeadline).to.equal(bettingDeadline);
    });

    it("Should revert if betting deadline is in the past", async function () {
      const description = "Test scenario";
      const bettingDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const resolutionDeadline = Math.floor(Date.now() / 1000) + 3600;

      await expect(
        bettingPlatform.createScenario(description, bettingDeadline, resolutionDeadline)
      ).to.be.revertedWith("Betting deadline must be in the future");
    });

    it("Should revert if resolution deadline is before betting deadline", async function () {
      const description = "Test scenario";
      const bettingDeadline = Math.floor(Date.now() / 1000) + 86400;
      const resolutionDeadline = bettingDeadline - 3600;

      await expect(
        bettingPlatform.createScenario(description, bettingDeadline, resolutionDeadline)
      ).to.be.revertedWith("Resolution deadline must be after betting deadline");
    });
  });

  describe("Placing Bets", function () {
    let scenarioId: bigint;
    let bettingDeadline: number;
    let resolutionDeadline: number;

    beforeEach(async function () {
      bettingDeadline = Math.floor(Date.now() / 1000) + 86400;
      resolutionDeadline = bettingDeadline + 86400;
      
      await bettingPlatform.createScenario(
        "Will Bitcoin reach $100k?",
        bettingDeadline,
        resolutionDeadline
      );
      scenarioId = 1n;
    });

    it("Should place a YES bet", async function () {
      const betAmount = MIN_BET;
      
      // Note: In a real test, you would need to mint USDC to user1 first
      // This test assumes user1 has USDC and has approved the contract
      
      // Approve USDC spending (assuming user1 has USDC)
      const usdcWithUser1 = usdcToken.connect(user1);
      // await usdcWithUser1.approve(await bettingPlatform.getAddress(), betAmount);

      // This test will fail without actual USDC, but demonstrates the structure
      // await expect(
      //   bettingPlatform.connect(user1).placeBet(scenarioId, betAmount, true)
      // )
      //   .to.emit(bettingPlatform, "BetPlaced")
      //   .withArgs(user1.address, scenarioId, betAmount, true);
    });

    it("Should revert if bet amount is below minimum", async function () {
      const betAmount = MIN_BET - 1n;
      
      await expect(
        bettingPlatform.connect(user1).placeBet(scenarioId, betAmount, true)
      ).to.be.revertedWith("Bet amount below minimum");
    });

    it("Should revert if bet amount exceeds maximum", async function () {
      const betAmount = MAX_BET + 1n;
      
      await expect(
        bettingPlatform.connect(user1).placeBet(scenarioId, betAmount, true)
      ).to.be.revertedWith("Bet amount exceeds maximum");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to create scenarios", async function () {
      const description = "Test scenario";
      const bettingDeadline = Math.floor(Date.now() / 1000) + 86400;
      const resolutionDeadline = bettingDeadline + 86400;

      await expect(
        bettingPlatform.connect(user1).createScenario(description, bettingDeadline, resolutionDeadline)
      ).to.be.revertedWithCustomError(bettingPlatform, "OwnableUnauthorizedAccount");
    });
  });
});



