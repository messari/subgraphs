# Autigami Subgraph

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

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor)`

Note: This currently excludes Liquidations

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrows * Pool Borrow Rate) * (1 - Pool Reserve Factor)`

Note: This currently excludes Liquidations

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

Amount of reward tokens (PLY/AURORA) distributed each day in a given market.

`rewardsPerSecond * 60 * 60 * 24`

### Protocol Controlled Value

Not applicable to Aurigami

### Notes

- The PLY, USN, AURORA, and TRI markets do not allow for borrows. For some reason the price oracle doesn't work with them. Instead we can derive price from another method.
  - To get price we are using LP pools from Trisolaris
  - The USN market will be missing price for the first month.
  - PLY market will be missing price for the first 2 days.
  - stNEAR is missing accurate pricing for the first 2 weeks.

## Reference and Useful Links

Protocol: https://www.aurigami.finance/

Docs: https://docs.aurigami.finance/public/introduction/aurigami

Smart contracts: https://github.com/Aurigami-Finance/aurigami-smart-contracts

Deployed addresses: https://docs.aurigami.finance/public/protocol/contract-addresses
