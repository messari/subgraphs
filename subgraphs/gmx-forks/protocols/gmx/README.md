# GMX Protocol Subgraph Metrics Methodology v1.0.0

This is for GMX Subgraph based on Messari Derivatives Perpetual Schema.

## Business Summary

GMX is a mix of non-custodial spot and perpetual exchange which supports low swap fees and zero impact trades.

The protocol officially launched first on Arbitrum network in September 2021, and then expanded to Avalanche network in January 2022.

Trading is supported through a unique multi-asset liquidity pool that generates rewards for liquidity providers in multiple ways such as market making, swap fees, leverage trading (this includes position opening & closing fees, borrowing fees, and swap fees), and asset rebalancing which are channeled back to liquidity providers.

The business of the protocol can be divided and summarized as follows:

### GLP

The GLP Index Composition is made up of a basket of assets that is used as the counter party for swaps and leverage trading. Liquidity providers add liquidity by minting GLP to add assets to the multi-asset pool. LPs then hold GLP, an LP token for the multi-asset pool.

GLP holders get the balance of the pool, which are affected by trading gains and losses, as well as trading fees, position fees, and borrowing fees.

GLP holders or the liquidity providers get all the collateral when positions are liquidated.

The token weights of the GLP Index Composition are automatically adjusted based on the open positions of traders.

As of writing, there are eight different assets in Arbitrum network and six assets in Avalanche network, shown in the pool's interface. There is another token of MIM in the pool which is temporarily hided from the interface for the moment.

- Reference: https://gov.gmx.io/t/propose-to-remove-mim-from-glp/432

### Spot & Perpetual Exchange Traders

Traders can utilize the liquidity for leveraged trading or swaps with zero price impact. Pricing feed is supported and secured by Chainlink Oracles and an aggregate of prices from leading volume exchanges such as Binance.

Traders need to post collateral first to open a long or short position for any asset in the index with a leverage of up to 30x.

When a trader closes his position in profit, he gets paid out in the token for his long position (ETH for example) or stablecoins for short position (USDC for example).

Successful traders are paid out by the liquidity pool and on the other side, unsuccessful traders pay out to liquidity providers.

Traders will get automatically liquidated when the loss plus the borrow fee approaches the value of the collateral they posted.

## Rewards and Fees

### Rewards for staking GLP

- On Arbitrum, GLP holders receive Escrowed GMX (esGMX) rewards as well as 70% of the platform’s generated fees in the form of \$ETH.
- On Avalanche, GLP holders receive esGMX rewards as well as 70% of platform fees in the form of \$AVAX.

### Fees for opening or closing a position

> Open position fee = 0.1% \* Trader’s position size

> Close position fee = 0.1% \* Trader’s position size

- Reference: https://gmxio.gitbook.io/gmx/trading

### Fees for borrowing

> Borrow fee = (assets borrowed by traders) / (total assets in pool) \* Borrow Fee Rate%

Note: Traders need to pay a borrowing fee every hour. The fee is calculated based on utilization and this similar to money market protocols like AAVE. The max borrow fee would be at 100% utilization which is 0.01% per hour.

- Reference: https://gmxio.gitbook.io/gmx/trading

### Swap Fees for the conversion of the asset to its USD value

There is a 0.3% swap fee when depositing collateral into a long position. The purpose of this is to prevent deposits from being used as a zero-fee swap.

Note: This applies for long positions only. It does not apply for withdrawing of collateral from longs and shorts.

- Reference: https://gmxio.gitbook.io/gmx/trading

## Usage Metrics

The usage metrics for GMX take the following user activities into accout.

### GLP

- Mint GLP token by supplying the assets
- Burn GLP tokens to redeem any index asset

### Spot & Perpetual Exchange Traders

- Swap tokens
- Open a long or short position
- Provide specific amount of collateral in any asset available
- Edit position to change the margin level
- Set stop-loss and take-profit orders
- Close the position

## Financial Metrics

### TVL

> TVL of a Pool = ∑ value of all assets to be provided as liquidity in the unique multi-asset pool

> TVL of the Protocol = ∑ TVL of the multi-asset pool

_Note: The collateral of traders are also reserved in the GLP pool. Hence, there are two types of transactions to deposit tokens to the pool, which are the users who provide liquidity and another one for the traders who provide collaterals before trading. The subgraph only counts the tokens to be provided as liqiudity into TVL and does not add positions' collaterals to the pool's TVL, in order to be consistent with GMX official measurement._

### Volume

Total volumes in this subgraph refer to perp trading volume. Meanwhile, there are three types of volumes for perp trading: InflowVolume, OutflowVolume and ClosedInflowVolume:

- Inflows are all funds that entered the protocol as part of long/short positions being opened.
- Outflows are all funds that left the protocol because of positions being closed.
- And then inflows at close: when a position closes, if it results in a gain to the protocol balance (the trader lost), whatever is the net increase would go here. If the trader wins (removing funds from the protocol balance) then this is untouched. It would be like the "settled inflow", which allows users to know if the protocol is making or losing money during a given period.

### Total Revenue

> Total Revenue of a Pool = ∑ position opening & closing fees, borrowing fees, and swap fees

#### Supply Side Revenue

> Supply Side Revenue = 70% \* Total Revenue

#### Protocol Side Revenue

> Protocol Side Revenue = 30% \* Total Revenue

## Useful Links

Protocol:

- https://app.gmx.io/#/trade

Docs:

- https://gmxio.gitbook.io/gmx/

Smart contracts:

- https://gmxio.gitbook.io/gmx/contracts

Tokenomics:

- https://gmxio.gitbook.io/gmx/tokenomics

Dashboard:

- https://app.gmx.io/#/dashboard
