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

`Reward Token Per Block * blocksPerDay`

### Protocol Controlled Value

`NA`

## Fuse Specific Additions

- There is a helper entity called `_FusePool` that tracks each fuse pool's market's, pool number, price oracle, liquidation incentive. This is needed in order to populate certain `Market` fields when a new market is added to an existing pool.
- Each market has additional `rates` added for the `Fuse Fee` and `Admin Fee`
  - `Fuse Fee` is the percentage of a market's accrued interest that is sent to the Rari Capital DAO
  - `Admin Fee` is the percentage of a market's accrued interest that is given to the admin of the pool.
  - Note: `Admin Fee` + `Fuse Fee` + `Reserve Factor` <= 100%

## Known Issues

- Ethereum:
  - _Note_: When OHM moved migrated to v2, pools that started with an `inputToken` of `sOHM` were migrated to `gOHM`. This is handled in `./src/mappings.ts`
- Arbitrum One:
  - Market `0xc0c997227922004da3a47185ac2be1d648db0062` has a very high TVL (~$100m). This is likely due to the fact that 10% of the total supply of the `inputToken` is in this vault and there are only 5 holders. Price of this asset is probably hard to calculate.
    - A potential fix is to recalculate TVL in every market each time `AccrueInterest` emits. This would slow down syncing as lots of contract calls would be introduced.

## Reference and Useful Links

Protocol: https://rari.capital/

Docs: https://docs.rari.capital/fuse/#fuse

Smart contracts: https://github.com/Rari-Capital/fuse-contracts

Deployed addresses: https://docs.rari.capital/contracts

Existing subgraphs: https://github.com/sharad-s/rari-fuse-subgraph
