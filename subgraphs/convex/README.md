# Convox Yield Protocol Subgraph
## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

cvxCRV Market Cap + Sum across all Vaults:

`LP Pool TVL`

Note: Locked CRV from cvxCRV mints - regardless of whether the cvxCRV is staked or not, the CRV locked is utilized by the protocol to earn boosted CRV rewards so therefore should count as TVL. This is not standard.

### Total Revenue USD

Sum across all Vaults:

`Yield Generated`


### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Vaults:

`Yield Generated * Protocol Side Fees`

- This is split between CVX Stakers, locked CVX and Harvestors

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Vaults

`Yield Generated * (1 - Protocol Side Fees)`

Note: This is the remaining yield/revenue after the protocol fees

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added

## Useful links

Existing Subgraph

https://thegraph.com/hosted-service/subgraph/convex-community/curve-pools

https://github.com/convex-community/convex-subgraph
