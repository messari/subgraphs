# CREAM Finance Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Borrow Amount * Pool Borrow Rate)`

Note: This currently excludes Liquidations

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor)`

Note: This currently excludes Liquidations

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrows * Pool Borrow Rate) * (1 - Pool Reserve Factor)`

Note: This currently excludes Liquidations

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

`NA`

### Protocol Controlled Value

Not applicable to CREAM Finance

### Notes

- BSC and Ethereum deployments have oracles that return the price in BNB and ETH respectively
- Unable to get pricing data for BSC deployment before November 2, 2020. Unable to reliably get the price of BNB on chain.
- The ethereum deployment is "deprecated" after October 27th, 2021.
  - See the article here: https://creamdotfinance.medium.com/moving-forward-post-exploit-next-steps-for-c-r-e-a-m-finance-1ad05e2066d5

## Reference and Useful Links

Protocol: https://cream.finance/

Docs: https://docs.cream.finance/

Smart contracts: https://github.com/compound-finance/compound-protocol

Contracts: https://github.com/CreamFi/cream-deployment

Deployed addresses: https://docs.cream.finance/lending/lending-contract-address

CREAM's api: https://api.cream.finance/api/documentations
