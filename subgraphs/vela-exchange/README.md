# VELA Exchange Subgraph Metrics Methodology v1.0.0

This is for VELA Exchange Subgraph based on Messari Derivatives Perpetual Schema.

## Business Summary

VELA Exchange is a decentralized exchange with advanced perpetuals trading capabilities, community focused incentives, and scalable infrastructure.

The business of the protocol can be divided and summarized as follows:

### VLP

VLP is the liquidity provider token for VELA Exchange platform. It’s based on USDC staking, and can be redeemed for USDC at any time. Anybody can stake USDC to mint VLP and earn fees based on generated trading volume on the platform.

VLP is to provide liquidity for traders, allowing them to take positions with leverage. If traders take a loss then the VLP holders will make profit, if the traders take a profit then VLP holders will make a loss. Although VLP value is market neutral and is not directly affected by the crypto market volatility, holding VLP still bears risks.

### Trading

Start by selecting the direction of the leverage position traders would like to open: “Long” or “Short”.

Collateral is used to open a position at the selected leverage. These two levers will define your position size.

Collateral x Leverage Level = Position Size

Example: If you select 10x leverage level with $500 collateral, the position size you purchase will be $5,000 worth of selected asset.

After creating a position, traders can create a variety of triggers, edit collateral, add to positions, and close positions.

## Rewards and Fees

Rewards and incentives are provided to holders and stakers of Vela Exchange utility tokens via several different methods.

### VLP

A percentage of fees, realized losses, and liquidated collateral will go into the VLP vault, increasing the value of VLP for holders. By staking their VLP, users receive a share of 10% of the total perpetual fees in esVELA for each corresponding rewards cycle.

### esVELA

A rewards token claimable by stakers of $VELA, $esVELA and $VLP. esVELA may be staked to earn a portion of $VELA rewards, or vested over time to be claimed as $VELA. A percentage of fees, realized losses, and liquidated collateral will be used to buy back $VELA from supported market places to supply vested $VELA.

### Fee Splits

The fees generated from the perpetual exchange are split according to:

- 55% in USDC
  > 5% for staking VELA and esVELA
  > 50% for holding VLP
- 20% in esVELA (via VELA buybacks which is kept as a reserve 1:1 for minting esVELA)
  > 10% for staking VELA and esVELA
  > 10% for staking VLP
- 25% to Treasury

## Usage Metrics

The usage metrics for VELA Exchange take the following user activities into accout.

### VLP

- Mint VLP token by supplying the asset
- Burn VLP tokens to redeem the asset

### Spot & Perpetual Exchange Traders

- Open a long or short position
- Provide specific amount of collateral
- Edit position to change the margin level
- Set stop-loss and take-profit orders
- Close the position

## Financial Metrics

### TVL

> TVL of a Pool = ∑ value of all assets to be provided as liquidity in the pool

> TVL of the Protocol = ∑ TVL of the pools

_Note: The collateral of traders are also reserved in the GLP pool. Hence, there are two types of transactions to deposit tokens to the pool, which are the users who provide liquidity and another one for the traders who provide collaterals before trading. The subgraph only counts the tokens to be provided as liqiudity into TVL and does not add positions' collaterals to the pool's TVL, in order to be consistent with official measurement._

### Volume

Total volumes in this subgraph refer to perp trading volume. Meanwhile, there are three types of volumes for perp trading: InflowVolume, OutflowVolume and ClosedInflowVolume:

- Inflows are all funds that entered the protocol as part of long/short positions being opened.
- Outflows are all funds that left the protocol because of positions being closed.
- And then inflows at close: when a position closes, if it results in a gain to the protocol balance (the trader lost), whatever is the net increase would go here. If the trader wins (removing funds from the protocol balance) then this is untouched. It would be like the "settled inflow", which allows users to know if the protocol is making or losing money during a given period.

### Total Revenue

> Total Revenue of a Pool = ∑ poistion opening & closing fees, borrowing fees, and trading fees

#### Supply Side Revenue

> Supply Side Revenue = 60% \* Total Revenue

#### Protocol Side Revenue

> Protocol Side Revenue = 25% \* Total Revenue

#### Stake Side Revenue

> Protocol Side Revenue = 15% \* Total Revenue

## Useful Links

Protocol:

- https://app.vela.exchange/

Docs:

- https://vela-exchange.gitbook.io/

Smart contracts:

- https://vela-exchange.gitbook.io/vela-knowledge-base/developers/contract-functions

Smart contracts address:

- https://vela-exchange.gitbook.io/vela-knowledge-base/developers/contract-addresses/mainnet

Tokenomics:

- https://vela-exchange.gitbook.io/vela-knowledge-base/token-economy
