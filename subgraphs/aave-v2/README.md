# Aave v2 Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools: 

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Variable Borrow Amount * Variable Pool Borrow Rate) + (Pool Stable Borrow Amount * Stable Pool Borrow Rate)`

Note: This currently excludes Flash Loans

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Market Oustanding Borrow Amount * Market Borrow Rate) * (Pool Reserve Factor)`

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Market Outstanding Borrows * Market Borrow Rate) * (1 - Pool Reserve Factor)`

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

Not applicable to Aave
