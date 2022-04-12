# Geist Finance Subgraph

## Calculation Methodology v0.0.1

### Total Value Locked (TVL) USD

Sum across all Pools: 

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Variable Pool Borrow Amount * Variable Pool Borrow Rate) + (Stable Pool Borrow Amount * Stable Pool Borrow Rate)`

Note: This currently excludes Flash Loans

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`((Market Oustanding Borrow Amount * Market Borrow Rate) * (Pool Reserve Factor)) + ((Stable Pool Borrow Amount * Stable Pool Borrow Rate) * Pool Reserve Factor)`

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Market Outstanding Borrows * Market Borrow Rate) * (1 - Pool Reserve Factor) + ((Stable Pool Borrow Amount * Stable Pool Borrow Rate) * (1 - Pool Reserve Factor))`

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

Not applicable to Geist

## Links

- Protocol: https://geist.finance/
- Analytics: https://geist.finance/stats/
- Docs: https://docs.geist.finance/
- Smart contracts: https://github.com/geist-finance/geist-protocol
- Deployed addresses: https://docs.geist.finance/useful-info/deployments-addresses
