# Sushiswap Subgraph

- The code that faciliates the basic operations of this exchange are forked from Uniswap V2. The two main contracts that are forked and used to index data from swaps, deposits, withdraws, and more are the `UniswapV2Factory` and `Pair` contracts.

## Networks

- Arbitrum
- Avalanche
- BSC
- Celo
- Ethereum
- Fantom
- Fuse
- Gnosis
- Harmony
- Moonbeam
- Moonriver
- Polygon

## Calculation Methodology v1.0.0

- Sum accross all liquidity pools for protocol metric.

### Total Value Locked (TVL) USD

- The value of all tokens provided in the liquidity pools.

### Volume

- The total value or amount from swaps in liquidity pools. The value of a swap in USD is single-sided, and is only used to update protocol and financial metrics if at least one token is a part of our token whitelist.

### Total Revenue USD

- `Pool Swap Trading Volume * Total Swap Fee Percentage`

- Total Swap Fee: %0.30.

- Protocol Side Fee: `on`.

More info on swaps found here:
https://docs.sushi.com/docs/Products/Sushiswap/Liquidity%20Pools

### Protocol-Side Revenue USD

- `Pool Swap Trading Volume * Protocol Side Fee Percentage`

- `Protocol Side Fee Percentage = Total Swap Fee Percentage - Supply Side Fee Percentage`

- Protocol Side Fee (On): %0.05.

- Protocol Side Fee (Off): %0.00.

### Supply-Side Revenue USD

- `Pool Swap Trading Volume * Supply Side Fee Percentage`

- `Supply Side Fee Percentage = Total Swap Fee Percentage - Protocol Side Fee Percentage`

- Supply Side Fee (On): %0.25.

- Supply Side Fee (Off): %0.30.

### Total Unique Users

**Count of Unique Addresses which have interacted with the protocol via any transaction:**

- Swaps

- Deposits

- Withdraws

### Reward Token Emissions Amount

- `Total emissions Rate * (Pool Allocation / Total MasterChef Allocation)`

- Emissions per liquidity pool can be calculated from the total rate emitted by the staking rewards contract and the pool allocation for the staked LP token.

#### Ethereum

- Rewards token emissions are calculated from the `MasterChef` and `MasterChefV2` contract. Users can earn rewards through staking LP tokens they get as a liquidity provider. `Sushi` tokens are emitted on a per block basis through inflation. Sushi rewards in the MasterchefV2 contract are determined by a MasterChef allocation - they are a proportion of the inflation rewards from MasterChef. MasterChefV2 can emit `addtional reward tokens` with `Rewarder` contracts for each staking pool. This is currently not being tracked.

Learn more about the inflation schedule here:
https://apeswap.gitbook.io/apeswap-finance/welcome/apeswap-tokens/banana/banana-tokenomics

#### BSC & Avalanche

- Currently do not have any LP staking options.

#### All other Sushi Chains

- Rewards token emissions are calculated from the `MiniChefV2` contract. Users can earn rewards through staking LP tokens they get as a liquidity provider. Sushi tokens are emitted on a per second basis. Additionally, MiniApeV2 can emit `addtional reward tokens` with `Rewarder` contracts for each staking pool. This is currently not being tracked.

- Sushi rewards from MiniChefV2 are refilled manually or through governance.

### Protocol Controlled Value

- Not Applicable for this subgraph.

## References and Useful Links

- Other existing subgraph: https://github.com/sushiswap/sushiswap-subgraph

- Documentation: https://docs.sushi.com/docs/intro
