# Banker Joe Subgraph

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

See Notes

### Protocol Controlled Value

`NA`

## Notes

- Banker Joe does not emit rewards anymore and the reward mechanisms are unclear from their docs. Therefore we do not have rewards in the subgraph even though they were emitted historically.

## Reference and Useful Links

Protocol: https://traderjoexyz.com/lend
Docs: https://docs.traderjoexyz.com/en/trader-joe/lending
Contracts: https://github.com/traderjoe-xyz/joe-lending
