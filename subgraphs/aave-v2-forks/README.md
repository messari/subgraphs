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

- Liquidity index (used to calculate revenue) is initialized to 1e27, not 0

### Resources

- Aave V2 Contract Addresses: https://docs.aave.com/developers/v/2.0/deployed-contracts/deployed-contracts
- Aave V2 Permissioned Contract Addresses: https://aave-arc.gitbook.io/docs/deployed-contracts/arc
- Gesit Contract Addresses: https://docs.geist.finance/useful-info/deployments-addresses
