import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

interface LoadTestResult {
  operation: string;
  success: boolean;
  duration: number;
  error?: string;
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("⚡ LOAD TESTING - BETTING PLATFORM");
  console.log("=".repeat(60) + "\n");

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env file");
  }

  const [signer] = await ethers.getSigners();
  console.log("👤 Test Account:", signer.address);
  console.log("📋 Contract Address:", contractAddress);
  console.log("");

  const BettingPlatform = await ethers.getContractFactory("BettingPlatform");
  const contract = BettingPlatform.attach(contractAddress);

  const results: LoadTestResult[] = [];
  const concurrentUsers = 5; // Simulate 5 concurrent users
  const operationsPerUser = 10; // 10 operations per user

  // Helper to measure operation time
  const measureOperation = async (
    operation: string,
    fn: () => Promise<any>
  ): Promise<LoadTestResult> => {
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      return { operation, success: true, duration };
    } catch (error: any) {
      const duration = Date.now() - start;
      return {
        operation,
        success: false,
        duration,
        error: error.message,
      };
    }
  };

  console.log(`🧪 Simulating ${concurrentUsers} concurrent users`);
  console.log(`📊 ${operationsPerUser} operations per user\n`);

  // Test 1: Concurrent Scenario Reads
  console.log("📖 TEST 1: Concurrent Scenario Reads");
  console.log("-".repeat(60));
  
  const scenarioCount = await contract.getScenarioCount();
  console.log(`Total scenarios: ${scenarioCount}\n`);

  if (Number(scenarioCount) > 0) {
    const readTests = Array(concurrentUsers * operationsPerUser)
      .fill(0)
      .map((_, i) => {
        const scenarioId = (i % Number(scenarioCount)) + 1;
        return measureOperation(`Read Scenario ${scenarioId}`, async () => {
          await contract.getScenario(scenarioId);
        });
      });

    const readResults = await Promise.all(readTests);
    results.push(...readResults);

    const readSuccess = readResults.filter((r) => r.success).length;
    const readAvgTime =
      readResults.reduce((sum, r) => sum + r.duration, 0) / readResults.length;

    console.log(`✅ Successful reads: ${readSuccess}/${readResults.length}`);
    console.log(`⏱️  Average time: ${readAvgTime.toFixed(2)}ms`);
    console.log(
      `📈 Throughput: ${((readSuccess / readResults.length) * 100).toFixed(2)}%`
    );
    console.log("");
  } else {
    console.log("⚠️  No scenarios to test\n");
  }

  // Test 2: Concurrent User Bet Reads
  console.log("👥 TEST 2: Concurrent User Bet Reads");
  console.log("-".repeat(60));

  if (Number(scenarioCount) > 0) {
    const betReadTests = Array(concurrentUsers * operationsPerUser)
      .fill(0)
      .map((_, i) => {
        const scenarioId = (i % Number(scenarioCount)) + 1;
        return measureOperation(`Read User Bet ${scenarioId}`, async () => {
          await contract.getUserBet(signer.address, scenarioId);
        });
      });

    const betReadResults = await Promise.all(betReadTests);
    results.push(...betReadResults);

    const betReadSuccess = betReadResults.filter((r) => r.success).length;
    const betReadAvgTime =
      betReadResults.reduce((sum, r) => sum + r.duration, 0) /
      betReadResults.length;

    console.log(`✅ Successful reads: ${betReadSuccess}/${betReadResults.length}`);
    console.log(`⏱️  Average time: ${betReadAvgTime.toFixed(2)}ms`);
    console.log(
      `📈 Throughput: ${((betReadSuccess / betReadResults.length) * 100).toFixed(2)}%`
    );
    console.log("");
  } else {
    console.log("⚠️  No scenarios to test\n");
  }

  // Test 3: Concurrent Scenario Count Reads
  console.log("📊 TEST 3: Concurrent Scenario Count Reads");
  console.log("-".repeat(60));

  const countTests = Array(concurrentUsers * 20)
    .fill(0)
    .map((_, i) => {
      return measureOperation(`Get Scenario Count ${i + 1}`, async () => {
        await contract.getScenarioCount();
      });
    });

  const countResults = await Promise.all(countTests);
  results.push(...countResults);

  const countSuccess = countResults.filter((r) => r.success).length;
  const countAvgTime =
    countResults.reduce((sum, r) => sum + r.duration, 0) / countResults.length;

  console.log(`✅ Successful reads: ${countSuccess}/${countResults.length}`);
  console.log(`⏱️  Average time: ${countAvgTime.toFixed(2)}ms`);
  console.log(
    `📈 Throughput: ${((countSuccess / countResults.length) * 100).toFixed(2)}%`
  );
  console.log("");

  // Test 4: Concurrent Admin Checks
  console.log("🔐 TEST 4: Concurrent Admin Checks");
  console.log("-".repeat(60));

  const adminTests = Array(concurrentUsers * 10)
    .fill(0)
    .map((_, i) => {
      const randomAddress = ethers.Wallet.createRandom().address;
      return measureOperation(`Check Admin ${i + 1}`, async () => {
        await contract.isAdmin(randomAddress);
      });
    });

  const adminResults = await Promise.all(adminTests);
  results.push(...adminResults);

  const adminSuccess = adminResults.filter((r) => r.success).length;
  const adminAvgTime =
    adminResults.reduce((sum, r) => sum + r.duration, 0) / adminResults.length;

  console.log(`✅ Successful checks: ${adminSuccess}/${adminResults.length}`);
  console.log(`⏱️  Average time: ${adminAvgTime.toFixed(2)}ms`);
  console.log(
    `📈 Throughput: ${((adminSuccess / adminResults.length) * 100).toFixed(2)}%`
  );
  console.log("");

  // Test 5: Batch Scenario Fetching
  console.log("📦 TEST 5: Batch Scenario Fetching");
  console.log("-".repeat(60));

  const batchSize = 10;
  const batchTests = Array(5)
    .fill(0)
    .map((_, i) => {
      return measureOperation(`Batch Fetch ${i + 1}`, async () => {
        const count = Number(await contract.getScenarioCount());
        const scenarios = [];
        for (let j = 1; j <= Math.min(count, batchSize); j++) {
          scenarios.push(contract.getScenario(j));
        }
        await Promise.all(scenarios);
      });
    });

  const batchResults = await Promise.all(batchTests);
  results.push(...batchResults);

  const batchSuccess = batchResults.filter((r) => r.success).length;
  const batchAvgTime =
    batchResults.reduce((sum, r) => sum + r.duration, 0) / batchResults.length;

  console.log(`✅ Successful batches: ${batchSuccess}/${batchResults.length}`);
  console.log(`⏱️  Average time: ${batchAvgTime.toFixed(2)}ms`);
  console.log(
    `📈 Throughput: ${((batchSuccess / batchResults.length) * 100).toFixed(2)}%`
  );
  console.log("");

  // Summary
  console.log("=".repeat(60));
  console.log("📊 LOAD TEST SUMMARY");
  console.log("=".repeat(60));

  const totalOps = results.length;
  const successfulOps = results.filter((r) => r.success).length;
  const failedOps = results.filter((r) => !r.success).length;
  const avgTime =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const minTime = Math.min(...results.map((r) => r.duration));
  const maxTime = Math.max(...results.map((r) => r.duration));

  console.log(`📈 Total Operations: ${totalOps}`);
  console.log(`✅ Successful: ${successfulOps} (${((successfulOps / totalOps) * 100).toFixed(2)}%)`);
  console.log(`❌ Failed: ${failedOps} (${((failedOps / totalOps) * 100).toFixed(2)}%)`);
  console.log(`⏱️  Average Response Time: ${avgTime.toFixed(2)}ms`);
  console.log(`⚡ Min Response Time: ${minTime}ms`);
  console.log(`🐌 Max Response Time: ${maxTime}ms`);
  console.log(`📊 Throughput: ${((successfulOps / totalOps) * 100).toFixed(2)}%`);

  if (failedOps > 0) {
    console.log("\n❌ FAILED OPERATIONS:");
    results
      .filter((r) => !r.success)
      .slice(0, 10)
      .forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.operation}: ${r.error}`);
      });
  }

  // Performance Analysis
  console.log("\n" + "=".repeat(60));
  console.log("📈 PERFORMANCE ANALYSIS");
  console.log("=".repeat(60));

  if (avgTime < 1000) {
    console.log("✅ Excellent: Average response time < 1s");
  } else if (avgTime < 3000) {
    console.log("⚠️  Good: Average response time < 3s");
  } else {
    console.log("❌ Poor: Average response time > 3s - Consider optimization");
  }

  if ((successfulOps / totalOps) * 100 >= 99) {
    console.log("✅ Excellent: Success rate >= 99%");
  } else if ((successfulOps / totalOps) * 100 >= 95) {
    console.log("⚠️  Good: Success rate >= 95%");
  } else {
    console.log("❌ Poor: Success rate < 95% - Review failed operations");
  }

  console.log("\n💡 Recommendations:");
  if (avgTime > 2000) {
    console.log("   - Consider implementing caching for frequently accessed data");
    console.log("   - Optimize batch operations");
  }
  if (failedOps > 0) {
    console.log("   - Review error logs and fix failing operations");
    console.log("   - Check RPC endpoint performance");
  }
  if (maxTime > 10000) {
    console.log("   - Some operations are taking too long - investigate bottlenecks");
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Load test failed:");
    console.error(error);
    process.exit(1);
  });

