# BaseSwap Subgraph

BaseSwap Exchange is an automated market maker (AMM) that allows users to exchange two tokens on Base network. The liquidity provided to the exchange comes from Liquidity Providers ("LPs") who stake their tokens in Liquidity Pools. In exchange, a user gets LP tokens that can also be staked to earn reward tokens in the "Farms" (MasterChef contract).

When users make a token swap (trade) in the Exchange tab, a trading fee is charged. Baseswap launched with trading fees of 0.25%.

**Docs:** https://base-swap-1.gitbook.io/baseswap/

## Baseswap Trading Fees & Breakdown

- 0.25% - Trade Fees
- 0% - LP Reward for Liquidity Providers
- 0.25% - Protocol Fee

LP providers earn rewards for staking LP tokens

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

- https://base-swap-1.gitbook.io/baseswap/

## Notes

- Staking rewards from the MasterChef contract are not included in the subgraph yet.
