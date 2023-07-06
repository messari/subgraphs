# Aave V2 Forks

## Aave Transaction Flow

When a transaction occurs in the `lendingPool` the following events are emitted in this order.

1. Next a `reserveDataUpdated` event is emitted
   1. This is equivalent to `AccrueInterest` in compound.
   2. New Revenue = ScaledTotalSupply \* (currentLiquidityIndex - lastLiquidityIndex)
   3. This event is used to update all of the rates, prices, and balances in the subgraph.
2. To get current supply balance we take use a contract call to `totalSupply()` in the respective aToken
3. To get the current borrow balance we call `totalSupply()` in both the VariableDebtToken and StableDebtToken
4. Finally we handle the actual transaction event (ie, deposit, borrow, repay, withdraw, liquidate)
   1. This handler is designed to only update the metrics that have to do with those events. ie, usage and daily/hourly event amounts

### Notes

- Avalanche oracles return prices offset by 8 decimals for some reason.
- Liquidity index (used to calculate revenue) is initialized to 1e27, not 0
- Geist CRV market does not return asset price for the first 3 days. So we need to use spooky swap LP pair
- "Platform Fees" on Geist's own dashboard include transfers to the staking contracts as well. This is why it is inflated compared to our TVL
  - Our Geist subgraph TVL only takes into account interest from borrows

### Problems

- Unable to change `protocol.id` for multiple deployments on mainnet [see code](./protocols/aave-v2/src/constants.ts)

### Resources

- Aave V2 Contract Addresses: [https://docs.aave.com/developers/v/2.0/deployed-contracts/deployed-contracts](https://docs.aave.com/developers/v/2.0/deployed-contracts/deployed-contracts)
- Aave V2 Permissioned Contract Addresses: [https://aave-arc.gitbook.io/docs/deployed-contracts/arc](https://aave-arc.gitbook.io/docs/deployed-contracts/arc)
- Gesit Contract Addresses: [https://docs.geist.finance/useful-info/deployments-addresses](https://docs.geist.finance/useful-info/deployments-addresses)
- Aave V3 Metis Subgraph GraphQL Endpoint: https://andromeda.thegraph.metis.io/subgraphs/name/messari/aave-v3-metis
