# Camelot V2 Subgraph

- The code that faciliates the basic operations of this exchange are forked from Uniswap V2. The two main contracts that are forked and used to index data from swaps, deposits, withdraws, and more are the `UniswapV2Factory` and `Pair` contracts.

- There are two notable features to Camelot V2 which are different from other Uniswap V2 forks:

1. Swap fees can be adjusted based on the swap direction (buying or selling)
2. Pools with correlated assets can use the Solidly (Curve) formula

## Networks

- Arbitrum

## Calculation Methodology v1.0.0

- Sum across all liquidity pools for protocol metric.

### Total Value Locked (TVL) USD

- The value of all tokens provided in the liquidity pools.

### Volume

- The total value or amount from swaps in liquidity pools. The value of a swap in USD is single-sided, and is only used to update protocol and financial metrics if at least one token is a part of our token whitelist.

### Total Revenue USD

- `Pool Swap Trading Volume * Total Swap Fee Percentage`

- Total Swap Fee: Variable, up to 2%, default 0.3%
- Can be different based on swap direction

More info on trading fees found here:
https://docs.camelot.exchange/protocol/amm/amm-v2/dynamic-directional-fees

### Protocol-Side Revenue USD

- `Pool Swap Trading Volume * Protocol Side Fee Percentage`

- `Protocol Side Fee Percentage = Total Swap Fee Percentage - Supply Side Fee Percentage`

- Protocol Side Fee: Adjustable percentage of total swap fee, currently 40%

See here for current percent:
https://arbiscan.io/address/0x6EcCab422D763aC031210895C81787E87B43A652#readContract#F10

### Supply-Side Revenue USD

- `Pool Swap Trading Volume * Supply Side Fee Percentage`

- `Supply Side Fee Percentage = Total Swap Fee Percentage - Protocol Side Fee Percentage`

https://docs.camelot.exchange/protocol/amm/amm-v2/referral

- Supply Side Fee: Variable based on given pool's trading fee and protocol share percentage

### Total Unique Users

**Count of Unique Addresses which have interacted with the protocol via any transaction:**

- Swaps

- Deposits

- Withdraws

### Rewards

Rewards for staked LP positions (spNFTs) are paid out in two different tokens, GRAIL and xGRAIL.

xGRAIL token is illiquid and non-transferable, but can be redeemed into GRAIL after a vesting period.

See here for more information:
https://docs.camelot.exchange/protocol/staked-positions-spnfts/yield-farming#rewards
https://docs.camelot.exchange/tokenomics/xgrail-token/conversion-redeeming

#### Reward Token Emissions Amount

- `Total emissions Rate * (Pool Allocation / Total MasterChef Allocation)`

- Emissions per liquidity pool can be calculated from the total rate emitted by the staking rewards contract and the pool allocation for the staked LP token.

### Protocol Controlled Value

- Not Applicable for this subgraph.

## References and Useful Links

- Protocol: https://app.camelot.exchange/
- Analytics: https://info.camelot.exchange/home/v2
- Docs: https://docs.camelot.exchange/
- Smart contracts: https://docs.camelot.exchange/contracts/amm-v2
- Official subgraph: https://github.com/CamelotLabs/amm_subgraph
