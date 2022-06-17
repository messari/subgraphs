# Maple Finance Subgraph

## Development

TODO: remove this section for handoff

### Installing dependencies

```bash
yarn global add @graphprotocol/graph-cli
yarn
```

### Run codegen

```bash
graph codegen
```

### Deploy changes

```bash
graph deploy --product hosted-service papercliplabs/messari-maple-finance --deploy-key <DEPLOY_KEY>
```

Note: the DEPLOY_KEY can be found on the graph page if logged in, otherwise ask @spennyp

---

## Calculation Methodology v1.0.0 - Market methodologies


### Total Value Locked (TVL) USD

`Current Loans + Remaining Deposits Available to Borrow as Loan`

total amount on the supply side that is earning interest; it does not include accrued staking rewards 

### Cumulative Deposit USD

`Cumulative sum of all deposits made over time for the market (pool)`

Does not include stake deposits since these are not loanable

### Cumulative Withdraw USD

`Cumulative sum of all withdraws made over time for the market (pool)`

Does not include stake deposits since these are not loanable

### Total Deposit Balance USD

`Net cumulative deposits for the market (pool) - withdraws from the market (pool) - cumulative market (pool) losses`

### Total Borrow Balance USD

`Total borrows outstanding - any principal repaid - any recognized losses to the market (pool)`

Recognized losses do not count torwards borrow amounts; interpreted same as paying principal, just does not come from the borrower

### Cumulative Borrow USD

`Cumulative sum of all withdraws made over time from a Market (pool)`

### Cumulative Liquidate USD

`Total losses attributable to stakers and lenders of a market (pool)`

stake locker lossess + pool lossess

### Cumulative Supply Side Revenue USD

`All revenues earned by Pool Delegate + interest revenue earned by lenders + staking revenue earned by stakers`

this doesn’t include MPL token distribution or profits earned by the Keeper for liquidations

### Cumulative Protocol Side Revenue USD

`Establishment fees from borrowers paid to Maple Treasury for loans from the market (pool)`

Fees are percentage of the drawdown amount; lump sum for v1 loans and amortized over time for v2/v3 loans

### Cumulative Total Revenue USD

`Cumulative Supply Side Revenue + Cumulative Protocol Side Revenue`

---

## Calculation Methodology v1.0.0 - Protocol methodologies

### Total Value Locked USD

`Sum of Total CURRENT Value Locked USD for all markets in the protocol`

current loans + available deposits

### Total Deposit Balance USD

`Sum of Total CURRENT Deposit Balance USD for all markets in the protocol`

deposits - withdraws - losses

### Cumulative Deposit USD

`Cumulative sum of all deposits made over time for all markets (pools)`

### Total Borrow Balance USD

`Total borrows outstanding - any principal repaid - any recognized losses to the market (pool)`

**Calculation is across all markets (pools)**

### Cumulative Borrow USD

`Cumulative sum of all withdraws made over time from all Markets (pools)`

### Cumulative Liquidate USD

`Total losses attributable to stakers and lenders of all markets (pools)`

stake locker lossess + pool lossess for all markets (pools)

###  Cumulative Supply Side Revenue USD

`All revenues earned by Pool Delegate + interest revenue earned by lenders + staking revenue earned by stakers`

### Cumulative Protocol Side Revenue USD

`Establishment fees from borrowers paid to Maple Treasury for all loans across all pools`

### Cumulative Total Revenue USD

`Cumulative Supply Side Revenue from all markets (pools) + Cumulative Protocol Side Revenue from all markets (pools)`