# UwU Lend Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Variable Borrow Amount * Variable Pool Borrow Rate) + (Pool Stable Borrow Amount * Stable Pool Borrow Rate)`

Note: This currently excludes Flash Loans

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor)`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrow Amount * Pool Borrow Rate) * (1 - Pool Reserve Factor)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

To be added

### Protocol Controlled Value

Not applicable to Aave

## Notes

- The MultiFeeDistribution Contract (0x7c0bF1108935e7105E218BBB4f670E5942c5e237) tries to send out collateral tokens and has not opened a position for it before. This contract is staking contract.
  - This tries to subtract from a position that doesn't exist. Therefore there is no record of tokens going there.
  - Since this is an internal contract (and not a whale) we are going to leave as is.

## Resources

App: https://uwulend.fi/
Docs: https://docs.uwulend.fi/
Contract Addresses: https://docs.uwulend.fi/contracts
