# Complete Testing Guide for BettingPlatform

This guide will help you test all functionalities of the betting platform.

## Prerequisites

1. ✅ Contract deployed: `0xd6f466086f949A4db7908CbFc6fbb8606Ff335e1`
2. ✅ `.env` file configured with:
   - `CONTRACT_ADDRESS=0xd6f466086f949A4db7908CbFc6fbb8606Ff335e1`
   - `VITE_CONTRACT_ADDRESS=0xd6f466086f949A4db7908CbFc6fbb8606Ff335e1`
   - `PRIVATE_KEY=your_private_key`
3. ✅ Frontend running: `npm run dev`
4. ✅ MetaMask connected to Arc Testnet
5. ✅ USDC testnet tokens in wallet

## Test Suite

### 1. Run Automated Tests

```bash
npm run test-all
```

This will check:
- Contract owner
- Contract constants (MIN_BET, MAX_BET, ADMIN_FEE)
- emergencyResolve function availability
- All existing scenarios
- USDC token configuration
- Contract pause status

### 2. Frontend Testing Checklist

#### A. Wallet Connection
- [ ] Connect MetaMask wallet
- [ ] Verify wallet address displays correctly
- [ ] Verify USDC balance displays correctly
- [ ] Verify network is Arc Testnet (Chain ID: 5042002)

#### B. Scenario Creation (Admin Panel)
- [ ] Navigate to Admin Panel
- [ ] Click "Create Scenario"
- [ ] Fill in description
- [ ] Set betting deadline (future date/time)
- [ ] Set resolution deadline (after betting deadline)
- [ ] Submit and verify scenario appears in list
- [ ] Verify deadlines display correctly in Brazilian format

#### C. Betting Functionality
- [ ] Navigate to Dashboard
- [ ] Select an open scenario
- [ ] Choose YES or NO position
- [ ] Set bet amount (1-200 USDC)
- [ ] Verify potential return calculation
- [ ] Approve USDC if needed
- [ ] Place bet
- [ ] Verify bet appears in Portfolio
- [ ] Verify USDC balance updated

#### D. Scenario Resolution (Admin Panel)
- [ ] Navigate to Admin Panel
- [ ] Find scenario with passed betting deadline
- [ ] Click "Resolve YES" or "Resolve NO"
- [ ] Verify scenario shows as resolved
- [ ] Verify admin fee calculated (1% of total pool)
- [ ] Verify outcome badge displays

#### E. Emergency Resolve (Admin Panel)
- [ ] Find scenario with passed resolution deadline
- [ ] Verify "Emergency Resolve" buttons appear
- [ ] Click "Emergency Resolve YES" or "Emergency Resolve NO"
- [ ] Verify scenario resolves successfully
- [ ] Verify admin fee calculated

#### F. Claiming Winnings (Portfolio)
- [ ] Navigate to Portfolio
- [ ] Find resolved scenario where you bet on winning side
- [ ] Click "Claim" button
- [ ] Verify USDC received
- [ ] Verify bet marked as claimed

#### G. Admin Fee Claiming (Admin Panel)
- [ ] Navigate to Admin Panel
- [ ] Find resolved scenario with unclaimed admin fee
- [ ] Click "Claim Fee" button
- [ ] Verify admin receives 1% fee
- [ ] Verify fee marked as claimed

#### H. Scenario Status Display
- [ ] Verify "LIVE MARKET" status for open scenarios
- [ ] Verify "CLOSED" badge for closed scenarios
- [ ] Verify "RESOLVED" badge with outcome for resolved scenarios
- [ ] Verify deadline warnings display correctly
- [ ] Verify resolution deadline error messages display

### 3. Edge Cases Testing

#### A. Betting Limits
- [ ] Try to bet below minimum (should fail)
- [ ] Try to bet above maximum (should fail)
- [ ] Try to bet exact minimum (should succeed)
- [ ] Try to bet exact maximum (should succeed)

#### B. Scenario Deadlines
- [ ] Try to bet after betting deadline (should fail)
- [ ] Try to resolve before betting deadline (should fail)
- [ ] Try to resolve after resolution deadline (should use emergency resolve)
- [ ] Try to resolve already resolved scenario (should fail)

#### C. Multiple Bets
- [ ] Try to place second bet on same scenario (should fail)
- [ ] Place bets on multiple different scenarios (should succeed)
- [ ] Verify all bets appear in Portfolio

#### D. Empty Pools
- [ ] Create scenario with no bets
- [ ] Resolve scenario with no bets
- [ ] Verify admin fee is 0
- [ ] Verify no claiming needed

#### E. Winner/Loser Scenarios
- [ ] Place YES bet, resolve as YES (should win)
- [ ] Place NO bet, resolve as NO (should win)
- [ ] Place YES bet, resolve as NO (should lose)
- [ ] Place NO bet, resolve as YES (should lose)
- [ ] Verify only winners can claim

### 4. Error Handling Testing

- [ ] Test with insufficient USDC balance
- [ ] Test with insufficient USDC allowance
- [ ] Test transaction rejection (user cancels)
- [ ] Test with wrong network
- [ ] Test with invalid scenario ID
- [ ] Verify error messages are user-friendly

### 5. UI/UX Testing

- [ ] Verify all dates display in Brazilian format (dd/mm/yyyy HH:mm)
- [ ] Verify timezone is America/Sao_Paulo
- [ ] Verify responsive design (mobile/desktop)
- [ ] Verify loading states
- [ ] Verify success notifications
- [ ] Verify error notifications
- [ ] Verify search functionality
- [ ] Verify category filtering

## Test Scenarios to Create

### Scenario 1: Quick Test (1 hour deadlines)
- Description: "Will Bitcoin reach $100k today?"
- Betting Deadline: 1 hour from now
- Resolution Deadline: 2 hours from now
- Purpose: Quick testing of full lifecycle

### Scenario 2: Emergency Resolve Test
- Description: "Test emergency resolve functionality"
- Betting Deadline: 5 minutes from now
- Resolution Deadline: 10 minutes from now
- Purpose: Test emergency resolve after deadline passes

### Scenario 3: Multiple Bets Test
- Description: "Test multiple concurrent bets"
- Betting Deadline: 1 day from now
- Resolution Deadline: 2 days from now
- Purpose: Test placing multiple bets on different scenarios

## Expected Results

### Contract Constants
- MIN_BET: 1 USDC (6 decimals)
- MAX_BET: 200 USDC (6 decimals)
- ADMIN_FEE_PERCENT: 1%

### Payout Calculation
For a winning bet:
```
Winnings = (Your Bet / Winning Pool) × (Total Pool - Admin Fee)
```

Example:
- Total Pool: 100 USDC
- Admin Fee: 1 USDC (1%)
- Your Bet: 10 USDC on YES
- YES Pool: 50 USDC
- Outcome: YES
- Winnings = (10 / 50) × 99 = 19.8 USDC

## Troubleshooting

### Issue: "function does not exist"
- **Solution**: Verify contract address in `.env` matches deployed contract
- **Check**: Run `npm run test-all` to verify function exists

### Issue: "Resolution deadline passed"
- **Solution**: Use Emergency Resolve buttons (if available)
- **Check**: Verify contract has `emergencyResolve` function

### Issue: "Betting deadline not passed"
- **Solution**: Wait for deadline or close betting manually first
- **Check**: Verify current time vs betting deadline

### Issue: "Insufficient balance"
- **Solution**: Get USDC from faucet: https://faucet.circle.com
- **Check**: Verify USDC balance in MetaMask

### Issue: "Transaction reverted"
- **Solution**: Check browser console for detailed error
- **Check**: Verify you're on Arc Testnet
- **Check**: Verify contract is not paused

## Success Criteria

✅ All tests pass
✅ No console errors
✅ All transactions succeed
✅ UI displays correct information
✅ Brazilian date format works
✅ Emergency resolve works
✅ Winnings can be claimed
✅ Admin fees can be claimed

## Next Steps After Testing

1. Document any bugs found
2. Test with multiple users
3. Test with large bet amounts
4. Test concurrent scenario resolution
5. Performance testing with many scenarios

