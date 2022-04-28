# Inverse Finance Lending Protocol Subgraph

## Useful Links

- https://www.inverse.finance/anchor
- https://www.inverse.finance/transparency/overview
- https://docs.inverse.finance/inverse-finance/about-inverse

## Calculation Methodology v0.0.1

### Total Value Locked (TVL) USD

Sum across all Pools:

`Sum of Deposits on Anchor`

This includes INV staking

### Total Revenue USD

Sum across all Pools:

`Sum of Interest earned by depositors or Sum of Interest paid by borrowers + Fees earned by Stabilizer`

Currenltly borrowing is paused after an exploit. Stabilizer is a backstop for DOLA peg that takes 0.4% for buying and 0.1% for selling DOLA

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Sum of Interest paid by borrowers of DOLA) * Protocol Share + Fees earned by Stabilizer`

Protocol share will kick in after DOLA supply crosses 1 bn

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Sum of Interest paid by borrowers) - (Sum of Interest paid by borrowers of DOLA) * (Protocol Share)`

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Repays`

`Liquidations`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added
