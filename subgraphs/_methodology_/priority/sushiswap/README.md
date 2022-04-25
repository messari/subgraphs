# Sushiswap Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Liquidity Pool TVL`

Note: This ignores staked Sushi

### Total Revenue USD

Sum across all Pools:

`(Swap Trading Volume * Total Swap Fee)`

Note that the Total Swap Fee for SushiSwap is currently 0.3% and cannot be changed via Governance (04/07/22)

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Swap Trading Volume * Total Swap Fee * Protocol Share) or (Swap Trading Volume * Protocol Swap Fee)`

Protocol Share is 1/6th of Total Fee (0.3%) i.e. Protocol Swap Fee is 0.05%, 

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Swap Trading Volume * Total Swap Fee * (1- Protocol Share)) or (Swap Trading Volume * LP Swap Fee)`

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Swaps`

`Deposits`

`Withdraws`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added


## Links

- Protocol website: https://www.sushi.com/
- Protocol documentation:  https://docs.sushi.com/
- Smart contracts: https://github.com/sushiswap/sushiswap
- Deployed addresses: https://dev.sushi.com/sushiswap/contracts
- Existing subgraphs: https://github.com/sushiswap/sushiswap-subgraph
