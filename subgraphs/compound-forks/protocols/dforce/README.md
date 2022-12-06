# dForce Network Lending Protocol Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum deposits on dForce Lending, that is, sum across all Markets:

`iToken.get_cash() * priceOracle.getUnderlyingPrice(iToken)`

`iToken.get_cash()` returns the deposits (inputTokenBalance), which is then converted to USD by
multiplying with the underlying token price (including ETH) returned from the price Oracle contract.

### Total Revenue USD

Sum across all Pools:

Sum of Interest paid by borrowers, or `UpdateInterest.interestAccumulated * priceOracle.getUnderlyingPrice(iToken)`

The `UpdateInterest` event is emitted when interest (revenue) is accrued in the underlying token. The interest (revenue) is converted to USD by multiplying with the underlying token price (including ETH) returned from the price Oracle contract.

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol. The total interest (revenue) is split between depositors (supply-side) and the protocol based on the value of the `reserveRatio`.

Sum across all Markets: `Total Revenue USD * reserveRatio / 10 ^ MANTISSA`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side. The total interest (revenue) is split between depositors (supply-side) and the protocol based on the value of the `reserveRatio`.

Sum across all Markets:`Total Revenue USD - Protocol-Side Revenue USD`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Repays`

`Liquidations`

### Reward Token Emissions Amount

The dForce lending RewardDistributor contract computes the rewards emissions to lenders and borrowers when users interacts with the contracts, and emit `RewardDistributed` event when emissions are distributed to user account. Since there is no event for market-level emissions, the daily emissions for a market have to be computed using the `distributionSpeed` storage in the RewardDistributor contract multiplied with `BLOCKS_PER_DAY`:

Reward emissions for lenders: `distributionSupplySpeed * priceOracle.getUnderlyingPrice(iToken) * BLOCKS_PER_DAY`

Reward emissions for borrowers: `distributionSpeed * priceOracle.getUnderlyingPrice(iToken) * BLOCKS_PER_DAY`

### Protocol Controlled Value

Not applicable.

## Notes

- Avalanche and Fantom is not supported on their frontend. We will keep the config for now, but it is not actively being used as far as we know.

## Smart Contracts Interactions

![dforce-lending](../../docs/images/protocols/dforce.png "dforce-lending")

(Credit: [dForce Network](https://developers.dforce.network/lend/lend-and-synth))

## dForce Network Lending Protocol

### Deposit, Borrow, and Liquidate in Markets

The dForce Network Lending Protocol is controled by a [controller contract](https://etherscan.io/address/0x8B53Ab2c0Df3230EA327017C91Eb909f815Ad113), which controls 24 lending markets, each represented by an iToken (a dForce ERC20 token) with a corresponding underlying/input token, including iUSX/USX, iETH/ETH, iWBTC/WBTC, etc ([A complete list of all markets/iTokens](https://developers.dforce.network/lend/lend-and-synth/deployed-contracts)). When a user deposits underlying (input) tokens in a market, they mint the corresponding iToken. As a depositor, the user will receive interest and DF token emissions as reward. An depositor can also borrow underlying tokens from any of the (unpaused) markets. The ratio between total borrow amount and collateral amount across all markets must be below a specified collateral factor. If a borrower's loan-to-collateral ratio is above the collateral factor, a liquidator can invoke the `LiquidateBorrow` function, repay all or part of the borrower's debt, and seize the borrower's iTokens (which can then be redeemed for the underlying tokens).

### USX/EUX stablecoin

The dForce Network also manages the USX and EUX stablecoin. The USX is pegged to \$1, and the peg is maintained through controling the interest rate via [Protocol-Direct-Liquidity-Provision](https://docs.dforce.network/protocols/usx/price-stability). When the demand for USX is high (price is above \$1), the pool increases the USX supply by minting more USX tokens; vice versa.

## Resources

- Protocol: https://dforce.network/
- Analytics: [Not found]
- Docs: https://docs.dforce.network/
- Smart contracts: https://github.com/dforce-network/LendingContractsV2
- Deployed addresses: https://developers.dforce.network/lend/lend-and-synth/deployed-contracts
- Official subgraph: [Not found]
