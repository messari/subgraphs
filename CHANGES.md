# Schema Updates

## Schema Update 1.3.0

Main PR: [#310](https://github.com/messari/subgraphs/pull/310)
Fixes: [#320](https://github.com/messari/subgraphs/pull/320), [#325](https://github.com/messari/subgraphs/pull/325), [#330](https://github.com/messari/subgraphs/pull/330), [#331](https://github.com/messari/subgraphs/pull/331), [#359](https://github.com/messari/subgraphs/pull/359)

### Common

- Added revenue data to pools.
- Added more networks.
- Fixed markdown formatting issue in comments (# gets interpreted as heading).
- Added pool count `totalPoolCount` to the `Protocol` entity and daily usage metrics.

### DEXes

- Added `isSingleSided` for single-sided pools. Single-sided pools should be able to reuse/adopt most if not all of the existing fields with minor adaptation. These should be handled on a per protocol basis.

### Lending

- Changed `fixed_term` to `fixed` in `InterestRateType` entity to be more precise.
- Added daily/hourly withdraw/repay aggregates into snapshots.
- Fixed a couple `AmountUSD` fields (they were accidentally left as nullable before).
- Updated `Liquidate` entity to include `liquidatee` (the address that got liquidated).
- Updated the definition of `market` and `asset` in the `Liquidate` entity.

## Schema Update 1.2.1

Main commit: [0300919](https://github.com/messari/subgraphs/commit/0300919817079541fe156956912cb06e1efa951c)

### Common

- The ID of hourly snapshots has been changed from `{ # of days since Unix epoch time }-{ HH: hour of the day }` to `{ # of hours since Unix epoch time }`.

## Schema Update 1.2.0

Main PR: [#88](https://github.com/messari/subgraphs/pull/88)  
Fixes: [#109](https://github.com/messari/subgraphs/pull/109), [#111](https://github.com/messari/subgraphs/pull/111)

### Common

- Added prefixes to diambiguate quantitative fields:
  - *cumulative*: sum of all historical data from day 1 up to this point. E.g. `cumulativeDepositUSD` means all deposits has ever been made to this protocol/pool.
  - *daily/hourly*: this only applies to snapshots and represents the sum of the snapshot interval (i.e. daily aggregate). E.g. `dailyActiveUsers` means all unique active users on a given day, up till now.
  - All other quantitative field indicates a spot balance. In other words, the value at this point in time. E.g. `totalValueLockedUSD` means the total TVL of the protocol/pool as of now.
- Updated chain enums to match `dataSource.network()`.
- Added `lastPriceUSD` and `lastPriceBlockNumber` as optional fields in the `Token` entity for tracking prices.
- Refactored `RewardToken` to include `Token` as a field.
- For snapshots, now saving both `cumulative` values and `daily` aggregates.
- Now saving hourly snapshots for usage metrics and pool data.

### DEX-AMM

- Added more detailed usage metrics: deposit/withdraw/swap count.
- Added `inputTokenWeights: [BigDecimal!]!` to track pool composition.
- Added per-token volume `dailyVolumeByTokenUSD: [BigDecimal!]!` to `LiquidityPoolDailySnapshot`.
- Named `PoolDailySnapshot` to `LiquidityPoolDailySnapshot` for consistency.
- Added `stakedOutputTokenAmount: BigInt` to `LiquidityPool` and `LiquidityPoolDailySnapshot`.

### Lending Protocol

- Added more detailed usage metrics: deposit/withdraw/repay/liquidate count.
- Now aggregating deposit/borrow/liquidation USD values.
- Added `InterestRate` entity and made `rates` into an array.
- Added `mintedTokens` and `mintedTokenSupplies` to the `LendingProtocol` entity.
- Added `exchangeRate: BigDecimal` to `Market` and `MarketDailySnapshot` entity.
- Assume only a single input token (i.e. changed `inputTokens` to `inputToken`).
- Updated comments to the `Liquidate` event for clarity.

### Yield Aggregator

- Added more detailed usage metrics: deposit/withdraw count.
- Assume only a single input token (i.e. changed `inputTokens` to `inputToken`).

### Generic

- Added `stakedOutputTokenAmount: BigInt`. See [#87](https://github.com/messari/subgraphs/pull/87)

## Schema Update 1.1.0

Main PR: [#47](https://github.com/messari/subgraphs/pull/47)  
Fixes: [#69](https://github.com/messari/subgraphs/pull/69), [#70](https://github.com/messari/subgraphs/pull/70), [#78](https://github.com/messari/subgraphs/pull/78), [#80](https://github.com/messari/subgraphs/pull/80), [#85](https://github.com/messari/subgraphs/pull/85)

### Common Changes

- Changed `feesUSD` to `totalRevenueUSD`. For DEXes and Lending Protocols, everything stays the same since `fees` = `totalRevenue`. For yield aggregator, you now need to include all revenue (including supply side portion).
- Added `methodologyVersion` to the `Protocol` interface/entity so that we can track which methodology is being used.
- Removed `protocolTreasuryUSD` field from the `FinanceDailySnapshot` entity
- Removed the `Pool` and `PoolDailySnapshot` interface for clarity
- Added `Account` and `DailyActiveAccount` as a part of all schemas, since they are always used to compute usage metrics
- Added `totalVolumeUSD` to the `Protocol` interface to make aggregator easier
- Added a lot of documentation

### Protocol-Type Specific Changes

- Added `totalDepositUSD` and `totalBorrowUSD` to the Lending schema. Note that `totalDepositUSD` should be the same as `totalValueLockedUSD` but `totalBorrowUSD` is different from `totalVolumeUSD` since the former is a point in time and latter is in aggregate.
- Made `outputToken`-related fields optional in the DEX schema since Bancor v2 doesn't have LP token (output token)
- Updated `LiquidityPoolFeeType` to account for LP fees
- Updated `to`/`from` fields for DEX deposit/withdraw
- Added `pricePerShare` to yield aggregator schema (Yield Aggregator 1.1.1)
- Added `inputTokenWeights` to DEX AMM schema (DEX AMM 1.1.1)
- Change `stableInterestRate` in the lending schema to optional. See [#85](https://github.com/messari/subgraphs/pull/85)
