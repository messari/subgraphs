# Euler Finance Subgraph

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

Protocol: https://euler.finance/

Docs: https://docs.euler.finance/

Smart contracts: https://github.com/euler-xyz/euler-contracts

Deployed addresses: https://docs.euler.finance/protocol/addresses

Existing subgraphs: https://thegraph.com/hosted-service/subgraph/euler-xyz/euler-mainnet

Existing Subgraph in Studio: N/A

Explanation of lending metrics: https://docs.euler.finance/risk-framework/methodology

Dune Dashboard for Testing: https://dune.com/shippooordao/Euler-Finance-Dashboard https://dune.com/altooptimo/Euler-Finance

Other dashboads: https://tokenterminal.com/terminal/projects/euler
