# Euler Finance Subgraph

## Intro

Lending protocols are the life-blood of Decentralized Finance (DeFi) and provide an essential “money lego” to replicate banks in TradFi. Therefore, it’s no surprise that AAVE — a lending protocol — ranks at #2 on DefiLlama TVL rankings for protocols. 

Euler follows in the footsteps of lending protocols like AAVE and Compound but focuses on the permissionless aspect i.e. it allows users to create their own markets for any Ethereum ERC20 token. This blog from the Euler team provides much more detailed info on the benefits provided by Euler — [https://blog.euler.finance/introducing-euler-8f4422f13848](https://blog.euler.finance/introducing-euler-8f4422f13848). 


## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Markets:

`Total Supply Balance - Total Borrow Balance`

### Cumulative Total Revenue USD

`Cumulative supply-side revenue + Cumulative protocol-side revenue`

Note: This currently excludes Liquidations

### Cumulative Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Markets, calculated every 50 blocks (~10min):

`Cumulative protocol-side revenue = Cumulative protocol-side revenue + Market Deposits Balance * ((Market Supply APY / (1 - Market Reserve Fee)) - Market Supply APY)`

Note: This currently excludes Liquidations

### Cumulative Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Markets, calculated every 50 blocks (~10min):

`Cumulative supply-side revenue = Cumulative supply-side revenue + Market Supply APY * Market Deposits Balance`

Note: This currently excludes Liquidations

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

Not applicable to Euler Finance

### Protocol Controlled Value

Not applicable to Euler Finance

## Reference and Useful Links



* Protocol
    * [https://www.euler.finance/](https://www.euler.finance/) 
* Docs
    * [https://docs.euler.finance/](https://docs.euler.finance/) 
* Smart contracts
    * [https://docs.euler.finance/protocol/addresses](https://docs.euler.finance/protocol/addresses) 

* Deployed addresses
    * https://docs.euler.finance/protocol/addresses
* Parameters
    * [https://docs.euler.finance/protocol/eulers-default-parameters](https://docs.euler.finance/protocol/eulers-default-parameters)  
* Social
    * [Newsletter](https://newsletter.euler.finance/)
    * [Blog](https://blog.euler.finance/)
    * [Twitter](https://twitter.com/eulerfinance)
    * [Discord](https://t.co/yqSIrrJfWi?amp=1)
    * [Telegram](https://t.me/eulerfinance_official)
    * [Telegram Announcements](https://t.me/eulerfinance)
    * [LinkedIn](https://www.linkedin.com/company/euler-xyz/)
    * [YouTube](https://www.youtube.com/channel/UCoeP9dvbKoL17nqkNnUJBkg)
* Dashboards
    * [DefiLlama](https://defillama.com/protocol/euler)
    * [DeBank](https://debank.com/projects/euler)
    * https://dune.com/shippooordao/Euler-Finance-Dashboard
    * https://dune.com/altooptimo/Euler-Finance
    * https://tokenterminal.com/terminal/projects/euler
* Existing subgraphs
    * https://thegraph.com/hosted-service/subgraph/euler-xyz/euler-mainnet
* Explanation of lending metrics
    * https://docs.euler.finance/risk-framework/methodology
