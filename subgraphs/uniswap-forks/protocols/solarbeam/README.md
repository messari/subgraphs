# Solarbeam Subgraph

- The code that faciliates the basic operations of this exchange are forked from Uniswap V2. The two main contracts that are forked and used to index data from swaps, deposits, withdraws, and more are the `UniswapV2Factory` and `Pair` contracts.

- The `SolarDistributorV2` contract is inspired from the Sushiswap MasterChef contracts using the `Gauge` methodology for allocating reward emissions.

## Networks

- Moonriver

## Calculation Methodology v1.0.0

- Sum accross all liquidity pools for protocol metric.

### Total Value Locked (TVL) USD

- The value of all tokens provided in the liquidity pools.

### Volume

- The total value or amount from swaps in liquidity pools. The value of a swap in USD is single-sided, and is only used to update protocol and financial metrics if at least one token is a part of our token whitelist.

### Total Revenue USD

- `Pool Swap Trading Volume * Total Swap Fee Percentage`

- Total Swap Fee: %0.25.

- Protocol Side Fee: `on`.

### Protocol-Side Revenue USD

- `Pool Swap Trading Volume * Protocol Side Fee Percentage`

- `Protocol Side Fee Percentage = Total Swap Fee Percentage - Supply Side Fee Percentage`

- Protocol Side Fee (On): %0.05.

- Protocol Side Fee (Off): %0.00.

### Supply-Side Revenue USD

- `Pool Swap Trading Volume * Supply Side Fee Percentage`

- `Supply Side Fee Percentage = Total Swap Fee Percentage - Protocol Side Fee Percentage`

- Supply Side Fee (On): %0.20.

- Supply Side Fee (Off): %0.25.

### Total Unique Users

**Count of Unique Addresses which have interacted with the protocol via any transaction:**

- Swaps

- Deposits

- Withdraws

### Reward Token Emissions Amount

- `Total emissions Rate * (Pool Allocation / Total MasterChef Allocation)`

- Emissions for the Solar token can be calculated from the total rate emitted by the staking rewards contract and the pool allocation for the staked LP token.

- Rewards token emissions are calculated from the `SolarDistributorV2` contract. Users can earn rewards through staking LP tokens they get as a liquidity provider. `Solar` tokens are emitted on a per second basis through inflation. `Additional rewards tokens` with `Rewarder` contracts for each staking pool.

- NOTE: All reward token emissions rates can be extracted directly from the SolarDistributorV2 contract.

Learn more about the inflation schedule here:
https://docs.solarbeam.io/tokenomics

### Protocol Controlled Value

- Not Applicable for this subgraph.

## References and Useful Links

- Documentation: https://docs.solarbeam.io/
