# Spark Lend Subgraph

## Calculation Methodology v1.1.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Variable Borrow Amount * Variable Pool Borrow Rate) + (Pool Stable Borrow Amount * Stable Pool Borrow Rate) + liquidated collateral amount * liquidation penalty * liquidation procotol fee percentage + FlashLoan amount * Flashloan premium rate total`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor) + liquidated collateral amount * liquidation penalty * liquidation procotol fee percentage + FlashLoan amount * Flashloan premium rate to protocol`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrow Amount * Pool Borrow Rate) * (1 - Pool Reserve Factor) + FlashLoan amount * (Flashloan premium rate total - Flashloan premium rate to protocol)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

NA

### Protocol Controlled Value

Not applicable to Spark Lend

## Issues

If you find an issue please create a github issue in [messari/subgraphs](https://github.com/messari/subgraphs)

## Notes

- This is currently a testnet deployment right now.

## Useful links and references

- TODO
