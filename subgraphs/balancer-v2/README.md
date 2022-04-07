# Balancer v2 Subgraph
## Calculation Methodology v0.0.1

### Total Value Locked (TVL) USD

Sum across all Pools: 

`Liquidity Pool TVL`

### Total Revenue USD

Sum across all Pools:

`Pool Swap Volume * Pool Swap Fee`

Note, does this not include

- Flash Loans (Flash Loan Amount * Flash Loan Interest)
- Asset Manager Yield Generated

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`Pool Swap Volume * Protocol Pool Swap Fee`

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`Pool Swap Volume * SupplySide Pool Swap Fee`

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Swaps`

`Deposits`

`Withdraws`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added