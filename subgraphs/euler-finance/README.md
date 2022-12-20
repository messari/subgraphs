# Euler Finance Subgraph

## Intro

Lending protocols are the life-blood of Decentralized Finance (DeFi) and provide an essential “money lego” to replicate banks in TradFi. Therefore, it’s no surprise that AAVE — a lending protocol — ranks at #2 on DefiLlama TVL rankings for protocols.

Euler follows in the footsteps of lending protocols like AAVE and Compound but focuses on the permissionless aspect i.e. it allows users to create their own markets for any Ethereum ERC20 token. This blog from the Euler team provides much more detailed info on the benefits provided by Euler — [https://blog.euler.finance/introducing-euler-8f4422f13848](https://blog.euler.finance/introducing-euler-8f4422f13848).

## Calculation Methodology v1.2.1

### Total Value Locked (TVL) USD

Sum across all Markets:

`Total Deposit Balance`

### Cumulative Total Revenue USD

`Total Revenue = Protocol Side Revenue (from interest) / (Reserve Fee / RESERVE FEE SCALE )`

Note: Protocol Side Revenue from liquidations is excluded in this calcuation

### Cumulative Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

`Protocol Side Revenue = current reserveBalance - prev reserveBalance`

Note: reserveBlance is available from AssetStatus `event.params.reserveBalance` and is converted to USD by multiplying with underlying token price.

Note: This includes reserve fees from liquidations

### Cumulative Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

`Supply-side Revenue = Total Revenue - Protocol Side Revenue`

Note: This currently excludes Liquidations

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repays`

### Reward Token Emissions Amount

Euler Finance distributes EUL tokens by epoch (=every 100,000 blocks) to borrowers in the top 10 voted markets. Users vote for a market by staking their EUL for the underlying in [the EulStakes contract](https://etherscan.io/address/0xc697BB6625D9f7AdcF0fbf0cbd4DcF50D8716cd3#code). The total amount of EUL distributed in each epoch is [pre-determined](https://docs.euler.finance/eul/distribution-1#eul-per-epoch). The amount of distribution the top 10 staked markets receives is proportional to square root of sum time weighted EUL amount staked for the market. [eIP 24](https://snapshot.org/#/eulerdao.eth/proposal/0x7e65ffa930507d9116ebc83663000ade6ff93fc452f437a3e95d755ccc324f93) changes the reward distribution to 8000 EUL for epoch 18-23 (a 3-month trial period) and [eIP 28](https://snapshot.org/#/eulerdao.eth/proposal/0x40874e40bc18ff33a9504a770d5aadfa4ea8241a64bf24a36777cb5acc3b59a7) disqualifies FTT for rewards from epoch 16 after the collapse of FTX.

#### Epoch 6 - 17

1. At the start of a new epoch, cumulate EUL amount users staked for each market weighted by number of blocks (approximating time) the EUL is staked;
2. At the end of the epoch, rank markets by total weighted EUL amount staked and select top 10 markets to receive EUL emission;
3. Distribute the total EUL amount for the epoch among the top 10 markets proportional to square root of block weighted EUL amount staked;
4. If epoch > 96, exit, else go back to 1.

#### Epoch 18 - 23

1. At the start of a new epoch, cumulate EUL amount users staked for each market weighted by number of blocks (approximating time) the EUL is staked;
2. At the end of the epoch, calcuate the sqrt of sum weighted EUL amount staked for all markets using the Chainlink Oracle and wstETH;
3. The EUL amount each market receives is proportional to the sqrt of sum weighted EUL amount staked for the market.
4. 8000 EUL awarded to borrowers in the USDC, USDT, WETH, and wstETH market;
5. 5000 EUL awarded to lenders staking their output token from USDC, USDT, and WETH market.

### Protocol Controlled Value

Not applicable to Euler Finance

### Collateral Factor & Borrow Factor

Euler's collateral factor represents a risk-adjusted value of a user's collateral. In practice if a user deposits $1000 `USDC` and the collateral factor is `.9`, they have $900 `USDC` ($1000 \* .9) of collateral to borrow from.

Where Euler differs from other protocols is in the 2-sided approach. There is also a borrow factor. So yes, the user has $900 to use as collateral, but they want to borrow `UNI`, and `UNI` has a borrow factor of `.7`.

In this example the user could borrow ($900 \* `.7` `UNI`) = $630 with their $1000 `USDC` deposit.

### Liquidation Penalty (Incentive)

On Euler the liquidation penalty is variable and decided on in a sort of Dutch Auction style. This reduces the opportunities of MEV and drives the "liquidation penalty" closer to the marginal operating cost of liquidating a borrow. [See more here](https://docs.euler.finance/getting-started/white-paper#mev-resistance)

## Reference and Useful Links

- Protocol
  - [https://www.euler.finance/](https://www.euler.finance/)
- Docs
  - [https://docs.euler.finance/](https://docs.euler.finance/)
- Smart contracts

  - [https://docs.euler.finance/protocol/addresses](https://docs.euler.finance/protocol/addresses)

- Deployed addresses
  - https://docs.euler.finance/protocol/addresses
- Parameters
  - [https://docs.euler.finance/protocol/eulers-default-parameters](https://docs.euler.finance/protocol/eulers-default-parameters)
- Social
  - [Newsletter](https://newsletter.euler.finance/)
  - [Blog](https://blog.euler.finance/)
  - [Twitter](https://twitter.com/eulerfinance)
  - [Discord](https://t.co/yqSIrrJfWi?amp=1)
  - [Telegram](https://t.me/eulerfinance_official)
  - [Telegram Announcements](https://t.me/eulerfinance)
  - [LinkedIn](https://www.linkedin.com/company/euler-xyz/)
  - [YouTube](https://www.youtube.com/channel/UCoeP9dvbKoL17nqkNnUJBkg)
- Dashboards
  - [DefiLlama](https://defillama.com/protocol/euler)
  - [DeBank](https://debank.com/projects/euler)
  - https://dune.com/shippooordao/Euler-Finance-Dashboard
  - https://dune.com/altooptimo/Euler-Finance
  - https://tokenterminal.com/terminal/projects/euler
- Existing subgraphs
  - https://thegraph.com/hosted-service/subgraph/euler-xyz/euler-mainnet
- Explanation of lending metrics
  - https://docs.euler.finance/risk-framework/methodology
