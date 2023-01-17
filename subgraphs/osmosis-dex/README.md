# Osmosis Subgraph

Osmosis is an advanced automated market maker (AMM) protocol that allows developers to build customized AMMs with sovereign liquidity pools. Built using the Cosmos SDK, Osmosis utilizes Inter-Blockchain Communication (IBC) to enable cross-chain transactions.

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Liquidity Pool TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Swap Trading Volume * Pool Fee Tier)`

Note that Pool Fee Tiers vary by pool and more tiers could be added by Governance.

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Swap Trading Volume * Pool Fee Tier * Protocol Fee)`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Swap Trading Volume * Pool Fee Tier * (1 - Protocol Fee))`

Note that Pool Fee Tiers vary by pool and more tiers could be added by Governance

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Swaps`

`Deposits`

`Withdraws`


