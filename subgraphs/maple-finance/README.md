# Maple Finance Subgraph

## Calculation Methodology v1.0.0 - Market methodologies


### Total Value Locked (TVL) USD

`Current Loans + remaining deposits available to borrow as loan + any staked assets providing cover to the market`

total amount on the supply side that is earning interest; it does not include accrued staking rewards 

### Cumulative Deposit USD

`Sum of all deposits made over time to the market (pool)`

Does not include stake deposits since these are not loanable

### Cumulative Withdraw USD

`Sum of all withdraws that have ever been removed from the market (pool)`

Does not include stake deposits since these are not loanable

### Total Deposit Balance USD

`Cumulative Deposit USD - Cumulative Withdraw USD - Sum of all default suffered to the pool from defaulted loans`

### Total Borrow Balance USD

`Total borrows outstanding - any recognized losses to the market (pool)`

Recognized losses do not count torwards borrow amounts; interpreted same as paying principal, just does not come from the borrower

### Cumulative Borrow USD

`Sum of all withdraws taken from a Market (pool)`

### Cumulative Liquidate USD

`Total losses suffered by stakers and lenders of the market from defaulted loans`

stake locker lossess + pool lossess

### Cumulative Supply Side Revenue USD

`Sum of all interest paid and establishment fees paid to the Pool Delegate + Sum of all interested earned by Lenders + Sum of all interest earned by Stakers`

this doesn’t include MPL token distribution or profits earned by the Keeper for liquidations

### Cumulative Protocol Side Revenue USD

`Sum of all establishment fees from borrowers paid to Maple Treasury`

Fees are percentage of the drawdown amount; lump sum for v1 loans and amortized over time for v2/v3 loans

### Cumulative Total Revenue USD

`Cumulative Supply Side Revenue + Cumulative Protocol Side Revenue`

---

## Calculation Methodology v1.0.0 - Protocol methodologies

### Total Value Locked USD

`Sum of Total Value Locked USD for all markets in the protocol`

Sum of Protocol-Side Revenue USD for all markets

### Total Deposit Balance USD

`Sum of Total Deposit Balance USD for all markets in the protocol`

### Cumulative Deposit USD

`Sum of Cumulative Deposit USD for all markets`

### Total Borrow Balance USD

`Sum of Total Borrow Balance USD for all markets`

**Calculation is across all markets (pools)**

### Cumulative Borrow USD

`Sum of Cumulative Borrow USD for all markets`

### Cumulative Liquidate USD

`Sum of Cumulative Liquidate USD for all markets`

stake locker lossess + pool lossess for all markets (pools)

###  Cumulative Supply Side Revenue USD

`Sum of Cumulative Supply Side Revenue USD for all markets`

### Cumulative Protocol Side Revenue USD

`Sum of Cumulative Protocol Side Revenue USD for all markets`

### Cumulative Total Revenue USD

`Sum of Cumulative Total Revenue USD for all markets`