# Harvest Finance Subgraph
## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Vaults: 

`Vault TVL`

### Total Revenue USD

Sum across all Vaults:

`Harvested Yield`

Note: This does not currently include investments https://harvest-finance.gitbook.io/harvest-finance/general-info/what-do-we-do/420-69-programm


### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`Harvested Yield * Protocol Share`

Note that the Protocol Share varies on the Network. 

e.g. As of 04/07/22, the Protocol Share on Ethereum is 30% and 8% on BNB Chain

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`Harvested Yield * (1 - Protocol Share)`

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdraws`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added

## Useful Links

Existing Subgraph

https://thegraph.com/hosted-service/subgraph/harvestfi/harvest-finance	

https://github.com/harvestfi/thegraph	

Documentation - https://harvest-finance.gitbook.io/harvest-finance/thegraph/harvest-finance-subgraph
