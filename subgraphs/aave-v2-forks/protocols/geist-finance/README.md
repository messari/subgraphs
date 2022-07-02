# Geist Finance Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Variable Borrow Amount * Variable Pool Borrow Rate) + (Pool Stable Borrow Amount * Stable Pool Borrow Rate)`

Note: This currently excludes Flash Loans

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor)`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrow Amount * Pool Borrow Rate) * (1 - Pool Reserve Factor)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

Emissions Per Day = (`emissionsPerSecond` \* `SECONDS_PER_DAY`)

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Protocol Controlled Value

Not applicable to Geist Finance

## Links

Protocol: [geist.finance](https://geist.finance/)

Analytics: [geist.finance/stats](https://geist.finance/stats/)

Docs: [docs.geist.finance](https://docs.geist.finance/)

Smart contracts: [github.com/geist-finance/geist-protocol](https://github.com/geist-finance/geist-protocol)

Deployed addresses: [docs.geist.finance/useful-info/deployments-addresses](https://docs.geist.finance/useful-info/deployments-addresses)
