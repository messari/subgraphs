# Compound v2 Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools: 

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Borrow Amount * Pool Borrow Rate)`

Note: This currently excludes Liquidations

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor)`

Note: This currently excludes Liquidations

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrows * Pool Borrow Rate) * (1 - Pool Reserve Factor)`

Note: This currently excludes Liquidations

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

Not applicable to Compound v2

### Existing Subgraph for Reference

https://thegraph.com/hosted-service/subgraph/graphprotocol/compound-v2
https://github.com/graphprotocol/compound-V2-subgraph

