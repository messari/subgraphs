# Geist Finance Subgraph

## Calculation Methodology v1.1.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Variable Borrow Amount * Variable Pool Borrow Rate) + (Pool Stable Borrow Amount * Stable Pool Borrow Rate) + FlashLoan Amount * Flashloan premium rate (0.9%)`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor)`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrow Amount * Pool Borrow Rate) * (1 - Pool Reserve Factor) + FlashLoan Amount * Flashloan premium rate (0.9%)`

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

## Notes

- The MultiFeeDistribution Contract (0x49c93a95dbcc9A6A4D8f77E59c038ce5020e82f8) tries to send out gTokens and has not opened a position for it before.
  - This tries to subtract from a position that doesn't exist. Therefore there is no record of tokens going there.
  - Since this is an internal contract (and not a whale) we are going to leave as is.

## Links

Protocol: [geist.finance](https://geist.finance/)

Analytics: [geist.finance/stats](https://geist.finance/stats/)

Docs: [docs.geist.finance](https://docs.geist.finance/)

Smart contracts: [github.com/geist-finance/geist-protocol](https://github.com/geist-finance/geist-protocol)

Deployed addresses: [docs.geist.finance/useful-info/deployments-addresses](https://docs.geist.finance/useful-info/deployments-addresses)
