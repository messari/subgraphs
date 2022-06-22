# Bancor v2.1 Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Sum of Pool Assets`

do inlcude protocol-deposited BNT as TVL

https://bancor-network.gitbook.io/v2.1/guides/querying-a-pool-contract

### Total Revenue USD

Sum across all Pools:

`PoolFee * Pool Volume`

Note - Bancor supplies BNT liquidity. Fees on this liquidity go to covering IL losses of outside LPs. As such, this would still be considered revenue (and protocol revenue). Each pool can have its own fee 

https://bancor-network.gitbook.io/v2.1/guides/measuring-trading-volume

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`PoolFee * Pool Volume * (Protocol BNT / Total TVL)`

This should be the fee revenue attributed to Bancor-supplied BNT 
-- future note: LP fees are subsequently used to compensate users for IL. This should be a operating expense in the future. If Fee Income > IL payouts, then native tokens dumped for more BNT by the protocol. 

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`PoolFeeModel * Pool Volume * (1 - (Protocol BNT / Total TVL)`

This should be fee income not given to Bancor

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Swaps`

`Deposits`

`Withdraws`

###  Reward Token Emissions Amount

To be added

  

## Links

- Protocol website: https://www.bancor.network/
- Protocol documentation: https://docs.bancor.network/
- Version 2.1 Docs: https://bancor-network.gitbook.io/v2.1/faqs
- Smart contracts: https://github.com/bancorprotocol/contracts-solidity
- Deployed addresses: https://docs.bancor.network/ethereum-contracts/addresses
- Existing subgraphs: https://thegraph.com/hosted-service/subgraph/blocklytics/bancor
