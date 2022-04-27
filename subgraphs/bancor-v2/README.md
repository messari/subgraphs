# Bancor v2 Subgraph
## Calculation Methodology v0.0.1

### Total Value Locked (TVL) USD

Sum across all Pools:

`Sum of Pool Assers`

ignore the LP staking (mining) and crowdpooling

### Total Revenue USD

Sum across all Pools:

`PoolFeeModel * Pool Volume`

Each pool has its own fee model - will need to pull for each. ignore fee discounts for vDODO holders. Private pools are different to a degree (single LP).

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`Insert Calculation`

Unclear if protocol portion - TokenTerminal suggest no protocol revenue. DODO docs reference vDODO holders could potentially earn protocol fees suggesting there is a mechnism in place

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`PoolFeeModel * Pool Volume`

<Add notes to consider if any - delete if none>

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

- Protocol website: https://www.bancor.network/
- Protocol documentation: https://docs.bancor.network/
- Smart contracts: https://github.com/bancorprotocol/contracts-solidity
- Deployed addresses: https://docs.bancor.network/ethereum-contracts/addresses
- Existing subgraphs: https://thegraph.com/hosted-service/subgraph/blocklytics/bancor
