# Yearn Finance Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Vaults: 

`Vault Deposit TVL`

### Total Revenue USD

Sum across all Vaults:

`Harvested Yield`

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Vaults:

`(Vault TVL * Management Fees) + (Harvested Yield * Performance Fees)`

Partly shared with Strategist / Referring Protocol but to be included in Protocol-Side Revenue

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Vaults

`Harvested Yield - (Vault TVL * Management Fees) - (Harvested Yield * Performance Fees)`

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be confirmed

## Links

Protocol
- https://yearn.finance/

Docs
- https://docs.yearn.finance/
- https://docs.yearn.finance/vaults/smart-contracts/vault

Smart contracts
- https://github.com/yearn/yearn-vaults

Deployed addresses
- https://andrecronje.gitbook.io/yearn-finance/developers/deployed-contracts-registry

ROI Calculation
- https://docs.yearn.finance/getting-started/guides/how-to-understand-yvault-roi
