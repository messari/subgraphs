# Uniswap v3 Subgraph

## Optimism Regenesis

Because of a regenesis event on Optimism, many of the liquidity pools have to be manually instantiated at the start of the program. This is because all of the liquidity pool contracts that were created before regenesis do not have a corresponding event from the factory contract upon indexing the post-regenesis chain. The state of these contracts were maintained, however, we are not able to recover volume, fee, swap, deposit, and withdraw data from before regenesis.

More Info:
https://blog.synthetix.io/optimism-mainnet-upgrade-scheduled-downtime-and-regenesis/

## TVL Corrections

DEXs can be very difficult with composing accurate prices from the liquidity pools. For this reason, there are some measures in place to correct highly inaccurate prices. These are:

- Blacklisting Tokens
- Blacklisting Pools
- Ignoring TVL changes that have a delta of more than 1 Billion USD

Each of these measures are taken on a case by case basis and are selected in order to solve the problem the most reliably while still providing a good representation of the TVL. Ingoring of TVL changes with delta of mroe than 1 Billion is a temporary fix, and will be removed once the underlying issue is better resolved in 2.0.0.

As per the pricing investigation that is currently underway, we have discovered that many of the pricing issues result from fake versions of tokens. The pool that ends up being the outlier in the instances seen, are often composed of a token that is a fake version of a whitelist token and another token, sometimes fake as well, that has an outlier price. The pricing mechanism ignores calculating metrics when one of the tokens is a fake version of the whitelist token.

## Calculation Methodology v1.0.0

### Positions

Positions may or may not be created through the NFT manager contract. Positions are only tracked if they are created through the NFT manager contract. Most positions are created through the NFT manager contract, but some are created through the pool contract. It would be very difficult to track positions that bypass the NFT manager contract, so I decided not to track them.

### Total Value Locked (TVL) USD

Sum across all Pools:

`Liquidity Pool TVL` = `Active Liquidity` + `Inactive Liquidity` + `Uncollected Fees`

Changes whenever there is a swap, deposit, withdraw, or uncollected fees are removed from the pool.

### Total Revenue USD

Sum across all Pools:

`(Pool Swap Trading Volume * Pool Fee Tier)`

Note that Pool Fee Tiers vary by pool and more tiers could be added by Governance (04/07/22)

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Swap Trading Volume * Pool Fee Tier * Protocol Fee)`

Note that the Protocol Fee for Uniswap is currently 0% but could be changed via Governance (04/07/22)

https://uniswap.org/blog/uniswap-v3

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Swap Trading Volume * Pool Fee Tier * (1 - Protocol Fee))`

Note that Pool Fee Tiers vary by pool and more tiers could be added by Governance (04/07/22)

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Swaps`

`Deposits`

`Withdraws`

### Reward Token Emissions Amount

Does not apply to Uniswap V3

### Protocol Controlled Value

Does not apply to Uniswap V3

## References and Useful Links

Other existing subgraph
https://thegraph.com/hosted-service/subgraph/uniswap/uniswap-v3

## Smart Contracts Interactions

![Uniswap v3](../../docs/images/protocols/uniswap-v3.png "Uniswap v3")
