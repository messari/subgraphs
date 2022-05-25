# Balancer v1 Subgraph
## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools: 

`Liquidity Pool TVL`

### Total Revenue USD

Sum across all Pools:

`Pool Swap Volume * Pool Swap Fee`

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`Pool Swap Volume * Protocol Pool Swap Fee`

Note: 04/07/22 - The ProtocolPool Swap Fee is 0

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

## Useful Links

Documentation - https://docs.balancer.fi/v/v1/
Existing Subgraph - https://thegraph.com/hosted-service/subgraph/balancer-labs/balancer
