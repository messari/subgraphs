# Price Oracle

In general, prices (in USD) can be fetched from the following places:

- Chainlink Oracle
- DEXes
- Protocol's native oracle

## Lending Protocols

Lending protocols always have oracles built in as a part of their collateralization/liquidation mechanism. In this case, we should always use the protocol's native oracle for price calculations. This is to make sure the prices presented by the subgraph are consistent with the ones used for collateralization/liquidation.

There are situations where a lending protocol may need prices for tokens that are not available from its native oracle (e.g. Protocol's native token, or reward token). In that case, it should rely on other methods to derive the prices.

## DEXes

DEXes should be able to derive prices from itself. For example, Uniswap v2 does this by:

1. Derives the price of ETH from the ETH/stable pools: USDC/ETH, USDT/ETH, DAI/ETH, weighted by liquidity of each pool.
2. Derives the price of a whitelist of tokens from ETH.
3. Derives the price of all tokens from either the ETH pair or the whitelist.
4. When a token has multiple pairs, only use the price of the pair that has the deepest liquidity. This is to not skew the price by some shallow pools.

See detailed implementation: https://github.com/Uniswap/v2-subgraph/blob/master/src/mappings/pricing.ts

For pools with little liquidity on smaller DEXes, it is recommended that you use an oracle to retrieve prices externally. This is to prevent skewed prices/volume in low liquidity pools, especially during pool creation. For example, when you create a pool with 1 ETH and 1 DOGE, the oracle price (slightly over 1 ETH) can be significantly different from the pool price (2 ETH).

## Curve

Curve LP token prices can be resolved as follow:

1. Use Chainlink to find the prices of the underlying
2. If cannot be found on Chainlink, use the biggest DEX on that chain
3. Now you can calculate the price of the LP token using the virtual price of that pool

See details: https://blog.chain.link/using-chainlink-oracles-to-securely-utilize-curve-lp-pools/

## Yearn

Yearn prices can be resolved using its Lens contracts, as described here: https://docs.yearn.finance/vaults/yearn-lens/yearn-lens

One thing to note is that you won't be able to retrieve any prices before the Lens contract was deployed.
