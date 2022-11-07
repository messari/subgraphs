# Compound III Subgraph

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

TODO

### Protocol Controlled Value

Not applicable to Compound III

## Compound V2 vs Compound III

TODO

## Notes

- `Comet` is also the collateral token. (ie, it is cUSDCv3)
- Need to manually add TotalsBasic() to Comet abi to get total Supply of base tokens with interest, interest (revenue), borrows with interest.
- Base token withdraws act as withdraws and borrows depending on WHAT?? logic
- The base asset cannot be used as collateral

## Reference and Useful Links

Protocol: https://compound.finance/

Docs: https://docs.compound.finance/

Smart contracts: https://github.com/compound-finance/comet

Deployed addresses: https://docs.compound.finance/#networks
