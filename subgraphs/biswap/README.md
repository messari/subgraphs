# Biswap Subgraph

Biswap Exchange is an automated market maker (AMM) that allows users to exchange two tokens on the BNB Chain network. The liquidity provided to the exchange comes from Liquidity Providers ("LPs") who stake their tokens in Liquidity Pools. In exchange, a user gets LP tokens that can also be staked to earn BSW tokens in the "Farms". 

When users make a token swap (trade) in the Exchange tab, a trading fee of 0.2% will be charged, which is broken down in the following way:
* 0.15% - LP Reward for Liquidity Providers
* 0.01% - BSW Token Burn
* 0.02% - Biswap Earn (Multi-reward pool, Double Launchpools, other product features)
* 0.02% - Biswap Team

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools: `Liquidity Pool TVL`

### Total Revenue USD

Sum across all Pools: `Pool Swap Trading Volume * Trading Fee (0.2%)`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol
* Should trading fees allocated to Biswap Team (0.02%) be considered protocol revenue?
* Should trading fees allocated to Biswap Earn (0.02%) be considered protocol revenue?
* Should trading fees allocated to BSW Token Burn (0.01%) be considered protocol revenue?

Sum across all Pools: `Pool Swap Trading Volume * Protocol Fee`

Protocol Fee is set to  0 with the assumption that fees allocated towards Biswap Earn, Biswap Team, BSW Token Burn don't count towards protocol revenue.


https://biswap.gitbook.io/biswap/core-products/exchange

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side (LPs).

Sum across all Pools: `Pool Swap Trading Volume *  Trading Fee (0.15%)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

- Swaps
- Deposits
- Withdraws

### Reward Token Emissions Amount

No rewards for LPs on deposit. LPs need to stake and achieve set trading volumes to take advantage of rewards.

## References and Useful Links

* https://biswap.gitbook.io/biswap/core-products/exchange
* https://biswap.gitbook.io/biswap/general-information
* https://biswap.gitbook.io/biswap/general-information/biswap-smart-contracts
* https://biswap.gitbook.io/biswap/core-products/exchange/transaction-fee-mining

## Notes

* Staking rewards/revenue are not included as part of the methodology. They would be classified as Yield related activity (vs DEX AMM activity).
* Trans-fee-mining rewards are not removed from revenue calculations because they are funded through funds reserved for transaction fee mining.