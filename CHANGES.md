## Schema Update 1.2.0

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

- Added `stakedOutputTokenAmount: BigInt`
