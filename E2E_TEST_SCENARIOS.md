# End-to-End Test Scenarios

This document outlines comprehensive end-to-end test scenarios for the Betting Platform.

---

## Test Environment Setup

**Network:** Arc Testnet  
**Contract:** Deployed and verified  
**Test Accounts:** Multiple wallets with USDC balance

---

## Scenario 1: Complete Betting Flow

### Objective
Test the complete flow from scenario creation to winnings claim.

### Steps
1. **Admin creates scenario**
   - ✅ Admin connects wallet
   - ✅ Navigates to Admin Panel
   - ✅ Fills scenario creation form
   - ✅ Sets betting deadline (1 hour from now)
   - ✅ Sets resolution deadline (2 hours from now)
   - ✅ Submits transaction
   - ✅ Verifies scenario appears on dashboard

2. **User places bet**
   - ✅ User connects wallet
   - ✅ Views scenario on dashboard
   - ✅ Clicks "Trade" button
   - ✅ Selects YES/NO
   - ✅ Sets bet amount (10 USDC)
   - ✅ Approves USDC spending
   - ✅ Confirms bet transaction
   - ✅ Verifies bet appears in portfolio

3. **Admin closes betting**
   - ✅ Admin navigates to Admin Panel
   - ✅ Finds scenario
   - ✅ Clicks "Close Betting"
   - ✅ Confirms transaction
   - ✅ Verifies scenario status changes to "CLOSED"

4. **Admin resolves scenario**
   - ✅ Admin navigates to Admin Panel
   - ✅ Finds closed scenario
   - ✅ Clicks "Resolve Scenario"
   - ✅ Selects outcome (YES/NO)
   - ✅ Confirms resolution
   - ✅ Verifies scenario status changes to "RESOLVED"

5. **User claims winnings**
   - ✅ User navigates to Portfolio
   - ✅ Views "Claimable Bets" section
   - ✅ Clicks "Claim" on winning bet
   - ✅ Confirms transaction
   - ✅ Verifies USDC balance increases
   - ✅ Verifies bet marked as claimed

6. **Admin claims fee**
   - ✅ Admin navigates to Admin Panel
   - ✅ Finds resolved scenario
   - ✅ Clicks "Claim Admin Fee"
   - ✅ Confirms transaction
   - ✅ Verifies fee claimed status

### Expected Results
- ✅ All transactions succeed
- ✅ Scenario states update correctly
- ✅ Funds transfer correctly
- ✅ UI updates reflect on-chain state

---

## Scenario 2: Multiple Concurrent Bets

### Objective
Test placing bets on multiple scenarios simultaneously.

### Steps
1. **Admin creates 5 scenarios**
   - ✅ Create 5 different scenarios
   - ✅ All with different deadlines
   - ✅ Verify all appear on dashboard

2. **User places bets on all scenarios**
   - ✅ Place bet on Scenario 1 (YES, 10 USDC)
   - ✅ Place bet on Scenario 2 (NO, 20 USDC)
   - ✅ Place bet on Scenario 3 (YES, 15 USDC)
   - ✅ Place bet on Scenario 4 (NO, 25 USDC)
   - ✅ Place bet on Scenario 5 (YES, 30 USDC)

3. **Verify portfolio**
   - ✅ Navigate to Portfolio
   - ✅ Verify all 5 bets appear
   - ✅ Verify total active capital correct
   - ✅ Verify bet amounts correct

### Expected Results
- ✅ All bets placed successfully
- ✅ Portfolio shows all bets
- ✅ Active capital calculated correctly
- ✅ No conflicts between bets

---

## Scenario 3: Betting Deadline Enforcement

### Objective
Test that betting is properly closed after deadline.

### Steps
1. **Create scenario with short deadline**
   - ✅ Create scenario with 1-minute betting deadline
   - ✅ Wait for deadline to pass

2. **Attempt to place bet**
   - ✅ Try to place bet after deadline
   - ✅ Verify error message appears
   - ✅ Verify transaction fails

3. **Verify scenario status**
   - ✅ Check scenario status is "CLOSED"
   - ✅ Verify betting interface disabled

### Expected Results
- ✅ Betting rejected after deadline
- ✅ Clear error message
- ✅ Scenario status correct

---

## Scenario 4: Emergency Resolve

### Objective
Test emergency resolve for past-deadline scenarios.

### Steps
1. **Create scenario with past resolution deadline**
   - ✅ Create scenario
   - ✅ Set resolution deadline in past
   - ✅ Close betting

2. **Attempt normal resolve**
   - ✅ Try normal resolve
   - ✅ Verify it fails (deadline passed)

3. **Use emergency resolve**
   - ✅ Click "Emergency Resolve"
   - ✅ Select outcome
   - ✅ Confirm transaction
   - ✅ Verify scenario resolved

### Expected Results
- ✅ Normal resolve fails
- ✅ Emergency resolve succeeds
- ✅ Scenario marked as resolved

---

## Scenario 5: Win/Loss Calculations

### Objective
Test accurate win/loss calculations.

### Steps
1. **Create scenario with known outcome**
   - ✅ Create scenario
   - ✅ Place multiple bets (YES and NO)
   - ✅ Resolve with known outcome

2. **Verify calculations**
   - ✅ Check winning pool
   - ✅ Check losing pool
   - ✅ Check admin fee (1%)
   - ✅ Check individual winnings
   - ✅ Verify calculations match contract

### Expected Results
- ✅ All calculations accurate
- ✅ Admin fee correct (1%)
- ✅ Winnings proportional to bet size
- ✅ No rounding errors

---

## Scenario 6: Minimum/Maximum Bet Limits

### Objective
Test bet amount validation.

### Steps
1. **Test minimum bet**
   - ✅ Try to bet 0.5 USDC (below minimum)
   - ✅ Verify error message
   - ✅ Try to bet 1 USDC (minimum)
   - ✅ Verify success

2. **Test maximum bet**
   - ✅ Try to bet 201 USDC (above maximum)
   - ✅ Verify error message
   - ✅ Try to bet 200 USDC (maximum)
   - ✅ Verify success

### Expected Results
- ✅ Below minimum rejected
- ✅ Above maximum rejected
- ✅ Within limits accepted

---

## Scenario 7: Insufficient Balance

### Objective
Test handling of insufficient USDC balance.

### Steps
1. **Check balance**
   - ✅ View current USDC balance
   - ✅ Note balance amount

2. **Attempt over-limit bet**
   - ✅ Try to bet more than balance
   - ✅ Verify error message
   - ✅ Verify transaction fails

### Expected Results
- ✅ Clear error message
- ✅ Transaction fails gracefully
- ✅ No partial transactions

---

## Scenario 8: Admin Management

### Objective
Test admin add/remove functionality.

### Steps
1. **Add admin**
   - ✅ Owner navigates to Admin Panel
   - ✅ Opens "Admin Management"
   - ✅ Enters new admin address
   - ✅ Clicks "Add Admin"
   - ✅ Verifies admin added

2. **Verify admin access**
   - ✅ New admin connects wallet
   - ✅ Navigates to Admin Panel
   - ✅ Verifies access granted

3. **Remove admin**
   - ✅ Owner removes admin
   - ✅ Admin tries to access panel
   - ✅ Verifies access denied

### Expected Results
- ✅ Admin added successfully
- ✅ Admin has access
- ✅ Admin removed successfully
- ✅ Access revoked

---

## Scenario 9: Achievements System

### Objective
Test achievements calculation and display.

### Steps
1. **Place first bet**
   - ✅ Place bet
   - ✅ Navigate to Achievements
   - ✅ Verify "First Steps" unlocked

2. **Place multiple bets**
   - ✅ Place 10 bets
   - ✅ Verify "Getting Started" unlocked
   - ✅ Check progress bars

3. **Win bets**
   - ✅ Win several bets
   - ✅ Verify win-related achievements
   - ✅ Check win rate achievements

### Expected Results
- ✅ Achievements unlock correctly
- ✅ Progress bars accurate
- ✅ Categories filter correctly

---

## Scenario 10: Leaderboard

### Objective
Test leaderboard functionality.

### Steps
1. **Multiple users place bets**
   - ✅ User 1 places bets
   - ✅ User 2 places bets
   - ✅ User 3 places bets

2. **Verify leaderboard**
   - ✅ Navigate to Leaderboard
   - ✅ Verify all users appear
   - ✅ Test sorting (profit, win rate, volume)
   - ✅ Verify top 3 podium
   - ✅ Verify user rank

### Expected Results
- ✅ All users appear
- ✅ Rankings accurate
- ✅ Sorting works
- ✅ Top 3 highlighted

---

## Scenario 11: Network Switching

### Objective
Test network detection and switching.

### Steps
1. **Wrong network**
   - ✅ Connect with wrong network
   - ✅ Verify network switch prompt
   - ✅ Switch to Arc Testnet

2. **Verify connection**
   - ✅ Verify connected to Arc Testnet
   - ✅ Verify contract accessible
   - ✅ Verify data loads

### Expected Results
- ✅ Network switch prompt appears
- ✅ Switch successful
- ✅ App works after switch

---

## Scenario 12: Error Recovery

### Objective
Test error handling and recovery.

### Steps
1. **Transaction rejection**
   - ✅ Start transaction
   - ✅ Reject in MetaMask
   - ✅ Verify graceful handling
   - ✅ Verify no state corruption

2. **Network error**
   - ✅ Simulate network error
   - ✅ Verify error message
   - ✅ Retry operation
   - ✅ Verify recovery

### Expected Results
- ✅ Errors handled gracefully
- ✅ Clear error messages
- ✅ No state corruption
- ✅ Recovery possible

---

## Test Execution

### Run E2E Test Scenarios
```bash
# Create test scenarios
npm run create-e2e-scenarios

# Run load tests
npm run load-test

# Run QA tests
npm run qa-test
```

### Manual Testing Checklist
- [ ] Complete betting flow
- [ ] Multiple concurrent bets
- [ ] Deadline enforcement
- [ ] Emergency resolve
- [ ] Win/loss calculations
- [ ] Bet limits
- [ ] Insufficient balance
- [ ] Admin management
- [ ] Achievements
- [ ] Leaderboard
- [ ] Network switching
- [ ] Error recovery

---

## Success Criteria

✅ **All scenarios pass**  
✅ **No critical bugs**  
✅ **Performance acceptable**  
✅ **User experience smooth**  
✅ **Security maintained**

---

**Last Updated:** $(date)  
**Status:** Ready for Testing

