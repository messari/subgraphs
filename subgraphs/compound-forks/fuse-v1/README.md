# Rari Capital Fuse v1 Subgraph

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

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor + Fuse Fee + Admin Fee)`

Note: This currently excludes Liquidations

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrows * Pool Borrow Rate) * (1 - Pool Reserve Factor - Fuse Fee - Admin Fee)`

Note: This currently excludes Liquidations

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

NA

### Protocol Controlled Value

Not applicable to Fuse v1

## Reference and Useful Links

Protocol: https://rari.capital/

Docs: https://docs.rari.capital/fuse/#fuse

Smart contracts: https://github.com/Rari-Capital/fuse-contracts

Deployed addresses: https://docs.rari.capital/contracts

Existing subgraphs: https://github.com/sharad-s/rari-fuse-subgraph
