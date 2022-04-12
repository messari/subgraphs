# Maple Finance Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools: 

`Current Borrow Loans + Remaining Cash Available to Borrow as Loan`

### Total Revenue USD

Sum across all Pools:

`Interest Earned across all loans + Establishment Fees on the Loan Amount for new loans originated + MPL/USDC BPT Deposits`

Note: Establish fee is taken on NEW LOANS. e.g. if you borrow $500k, repay the $500k and take out another $1m, you pay fees across the $1.5m

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`Establishment Fees on the Loan Amount for new loans originated`

Note that Establishment Fees is split between Protocol and Delegate 50/50 but full Establishment Fees to be included Protocol-side Revenue

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`Interest Earned across all loans`

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdraws`

`Borrows`

`Repays`

`Liquidations`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added
