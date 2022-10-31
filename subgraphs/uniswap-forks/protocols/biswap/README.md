# Biswap Subgraph

Biswap Exchange is an automated market maker (AMM) that allows users to exchange two tokens on the BNB Chain network. The liquidity provided to the exchange comes from Liquidity Providers ("LPs") who stake their tokens in Liquidity Pools. In exchange, a user gets LP tokens that can also be staked to earn BSW tokens in the "Farms".

When users make a token swap (trade) in the Exchange tab, a trading fee is charged. Biswap launched with trading fees of 0.1% which was later [increased to 0.2% in Aug 2022](https://biswap.org/votings/proposal/tradefee_voting).

## Biswap Trading Fees & Breakdown

Before Aug 2022

- 0.1% - Trade Fees
- 0.05% - LP fees
- 0.05% 0 BSW Token Burn

After Aug 2022

- 0.2% - Trade Fees
- 0.15% - LP Reward for Liquidity Providers
- 0.01% - BSW Token Burn
- 0.02% - Biswap Earn (Multi-reward pool, Double Launchpools, other product features)
- 0.02% - Biswap Team

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools: `Liquidity Pool TVL`

### Total Revenue USD

Sum across all Pools: `Pool Swap Trading Volume * Trading Fee`

### Protocol-Side Revenue USD

Sum across all Pools: `Pool Swap Trading Volume * Protocol Fee`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side (LPs).

Sum across all Pools: `Pool Swap Trading Volume * Trading Fee`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

- Swaps
- Deposits
- Withdraws

### Reward Token Emissions Amount

No rewards for LPs on deposit. LPs need to stake and achieve set trading volumes to take advantage of rewards.

## References and Useful Links

- https://biswap.gitbook.io/biswap/core-products/exchange
- https://biswap.gitbook.io/biswap/general-information
- https://biswap.gitbook.io/biswap/general-information/biswap-smart-contracts
- https://biswap.gitbook.io/biswap/core-products/exchange/transaction-fee-mining
- https://biswap.org/analytics
- https://biswap.org/votings/proposal/tradefee_voting

## Notes

- Staking rewards/revenue are not included as part of the methodology. They would be classified as Yield related activity (vs DEX AMM activity).
- Trans-fee-mining rewards are not removed from revenue calculations because they are funded through funds reserved for transaction fee mining.
