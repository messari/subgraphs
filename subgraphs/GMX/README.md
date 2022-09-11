# GMX
This is for the Generic Schema of Messari Subgraph. 

## Business Summary

GMX is a mix of non-custodial spot and perpetual exchange which supports low swap fees and zero impact trades.

The protocol officially launched first on Arbitrum network in September 2021, and then expanded to Avalanche network in January 2022.

Trading is supported through a unique multi-asset liquidity pool that generates rewards for liquidity providers in multiple ways such as market making, swap fees, leverage trading (this includes position opening & closing fees, borrowing fees, and swap fees), and asset rebalancing which are channeled back to liquidity providers.

The business of the protocol can be divided and summarized as follows:

### GLP

The GLP Index Composition is made up of a basket of assets that is used as the counter party for swaps and leverage trading. Liquidity providers add liquidity by minting GLP to add assets to the multi-asset pool. LPs then hold GLP, an LP token for the multi-asset pool. 

GLP holders get the balance of the pool, which are affected by trading gans and losss, as well as trading fees, position fees, and borrowing fees.

The token weights of the GLP Index Composition are automatically adjusted based on the open positions of traders.

- On Arbitrum, GLP holders receive Escrowed GMX (esGMX) rewards as well as 70% of the platform’s generated fees in the form of $ETH.
- On Avalanche, GLP holders receive esGMX rewards as well as 70% of platform fees in the form of $AVAX.

GLP holders or the liquidity providers get all the collateral when positions are liquidated.


### Spot & Perpetual Exchange Traders

Traders can utilize the liquidity for leveraged trading or swaps with zero price impact. Pricing feed is supported and secured by Chainlink Oracles and an aggregate of prices from leading volume exchanges such as Binance and FTX.

Traders need to post collateral first to open a long or short position for any asset in the index with a leverage of up to 30x.

When a trader closes his position in profit, he gets paid out in the token for his long position (ETH for example) or stablecoins for short position (USDC for example).

Successful traders are paid out by the liquidity pool and on the other side, unsuccessful traders payout to liquidity providers.

Traders will get automatically liquidated when the loss plus the borrow fee approaches the value of the collateral they posted.

### GMX

GMX is used in governance and can be staked to receive three types of rewards such as Escrowed GMX (esGMX), Multiplier Points, and platform fees distributed in ETH or AVAX. Multiplier Points (MPs) can be staked for platform fee rewards by compounding. MPs reward the long-term holders without additional inflation.

### Referral rewards

Referral rewards has three tiers and this helps to ensure that referrers receive rebates for users they bring to the platform.

- Tier 1: 5% discount for traders, 5% rebates to referrer
- Tier 2: 10% discount for traders, 10% rebates to referrer
- Tier 3: 10% discount for traders, 15% rebates to referrer paid in ETH / AVAX, 5% rebates to referrer paid in esGMX

Note: Referral codes are case-sensitive, and it must be created on both Arbitrum and Avalanche in order to qualify for rebates on both networks.

## Useful Links

Protocol:
- https://app.gmx.io/#/trade

Docs:
- https://gmxio.gitbook.io/gmx/

Smart contracts:
- https://gmxio.gitbook.io/gmx/contracts

Tokenomics:
- https://gmxio.gitbook.io/gmx/tokenomics


## Rewards and Fees

### Rewards for staking GLP and GMX

Stakers earn the GMX emissions per block:

> Reward Rate for GLP holders = Rewards received in esGMX * GLP Price / Balance of the Staked GLP pool

> Reward Rate for GMX holders = Rewards received in esGMX * GMX Price / Balance of the Staked GMX pool

> Reward Rate for esGMX stakers = Rewards received in esGMX * GMX Price / Balance of the Staked eGMX pool

*Note: 30% of the platform fees generated from swaps and leverage trading are converted to ETH or AVAX and distributed to staked GMX tokens. On the other hand, GLP token holders earn 70% of platform fees distributed in ETH or AVAX.*

### Fees for opening or closing a position

> Open position fee = 0.1% * Trader’s position size

> Close position fee = 0.1% * Trader’s position size

- Reference: https://gmxio.gitbook.io/gmx/trading

### Fees for borrowing

> Borrow fee = (assets borrowed by traders) / (total assets in pool) * Borrow Fee Rate%

Note: Traders need to pay a borrowing fee every hour. The fee is calculated based on utilization and this similar to money market protocols like AAVE. The max borrow fee would be at 100% utilization which is 0.01% per hour.

- Reference: https://gmxio.gitbook.io/gmx/trading


### Swap Fees for the conversion of the asset to its USD value

There is a 0.3% swap fee when depositing collateral into a long position. For example, ETH amount to USD value. The purpose of this is to prevent deposits from being used as a zero-fee swap.

Note: This applies for long positions only. It does not also apply for withdrawing of collateral from longs and shorts.

- Reference: https://gmxio.gitbook.io/gmx/trading

## User Metrics

### Classification of Pools
Each asset or token included in the GLP is a pool in the subgraph. As of writing, there are eight different assets in Arbitrum network and six assets in Avalanche network.

### GLP
- Mint GLP token by supplying the assets
- Burn GLP tokens to redeem any index asset
- Claim rewards
- Purchase insurance via GMX’s platform

### Spot & Perpetual Exchange Traders
- Swap tokens
- Open a long or short position
- Provide specific amount of collateral in any asset available
- Edit position to change the margin level
- Set stop-loss and take-profit orders
- Close the position

### GMX

- Purchase GMX token 
- Stake GMX to receive rewards and platform fees
- Unstake GMX
- Stake earned esGMX to increase the amount of rewards
- Convert esGMX to actual GMX tokens after vesting
- Stake Multiplier Points to earn more platform fee rewards
- Claim all the rewards

## Financial Metrics

Please refer to the "Classification of Pools" under User Metrics for Pools.

### TVL

>TVL of a Pool = ∑ value of the specific asset in the pool

>TVL of the Protocol = ∑ TVL of all single pools

*Note: The collateral of traders are reserved in the GLP pool. Hence, there are two types of transactions to track the TVL, which are the users who provide liquidity and another one for the traders who provide collaterals before trading.*

### Total Revenue

> Total Revenue of a Pool = ∑ poistion opening & closing fees, borrowing fees, and swap fees

Please refer to the Fee section of details of the fees charged by GMX.

#### Supply Side Revenue

> Supply Side Revenue = 70% * Total Revenue

*Note: The generated fees distributed are based on the amount remaining after deducting rewards and the network costs of keepers, which typically costs around 1% of the total fees.*

#### Protocol Side Revenue

> Protocol Side Revenue = 30% * Total Revenue

*Note: The generated fees distributed are based on the amount remaining after deducting referral rewards and the network costs of keepers, which typically costs around 1% of the total fees.*

#### Rewards

GMX provides esGMX rewards goes to liquidity providers and GMX token holders, in the ratio of 70:30. GMX token holders also receive Multiplier Point rewards, which do not value but are entitlements for receiving trading fee rewards.

## Protocol Owned Liquidity

The GMX token has a Floor Price Fund that is denominated in $ETH and $GLP. This can grow in two ways:

- GMX/ETH liquidity is provided and owned by the protocol, the generated fees from this trading pair will be converted to GLP and deposited into the floor price fund

- 50% of funds received through Olympus bonds are given to the floor price fund, the other 50% is used for marketing

The purpose of floor price fund is to help ensure liquidity in GLP and provide a reliable stream of $ETH rewards for GMX stakers. As the floor price fund grows, this can be used to buyback and burn GMX tokens if the (Floor Price Fund) / (Total Supply of GMX) is less than the market price. As a result, GMX will have a minimum price in terms of ETH and GLP.

Note: According to the GMX’s documentation, 2 million out 13.25 (15.04%) max supply of GMX tokens is to be managed by the floor price fund.

Reference: https://gmxio.gitbook.io/gmx/tokenomics
