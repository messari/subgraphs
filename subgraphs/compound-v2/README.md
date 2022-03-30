# Compound Subgraph

### TODO

- Get prices working for cTokens
- add calculations for daily snapshots
- Figure out how/where to calculate/update:
  - protocol.totalValueLockedUSD
  - market.totalValueLockedUSD
  - market.totalVolumeUSD
  - market.inputTokenBalances
  - market.outputTokenSupply
  - market.outputTokenPriceUSD (easy once cToken Price Oracle)
  - market.rewardTokenEmissionsAmount
  - market.rewardTokenEmissionsUSD
  - market.maximumLTV
  - market.liquidationThreshold
  - market.liquidationPenalty
  - market.depositRate
  - market.stableBorrowRate
  - market.variableBorrowRate
  - marketDailySnapshot.totalValueLockedUSD
  - marketDailySnapshot.inputTokenBalances
  - marketDailySnapshot.inputTokenPricesUSD
  - marketDailySnapshot.outputTokenSupply
  - marketDailySnapshot.outputTokenPriceUSD
  - marketDailySnapshot.rewardTokenEmissionsAmount
  - marketDailySnapshot.rewardTokenEmissionsUSD
  - marketDailySnapshot.depositRate
  - marketDailySnapshot.stableBorrowRate
  - marketDailySnapshot.variableBorrowRate
  - financialDailySnapshot.totalValueLockedUSD
  - financialDailySnapshot.totalVolumeUSD
  - financialDailySnapshot.supplySideRevenueUSD
  - financialDailySnapshot.protocolSideRevenueUSD
  - financialDailySnapshot.feesUSD
- Test along the way
- test making sure each var is what we want
- test along dune tests to ensure accuracy
- Refactor code - make sure all standards are followed

## Links

Protocol: https://compound.finance/

Docs: https://compound.finance/docs

Smart contracts: https://github.com/compound-finance/compound-protocol

Deployed addresses: https://compound.finance/docs#networks

Existing subgraphs: https://github.com/graphprotocol/compound-v2-subgraph

Subgraph in the studio:

Dune Dashboard for Testing: https://dune.xyz/messari/Messari:-Compound-Macro-Financial-Statements
