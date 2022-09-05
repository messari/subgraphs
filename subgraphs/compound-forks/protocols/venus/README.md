# Venus Protocol Subgraph

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

Not applicable to Venus Protocol

### Protocol Controlled Value

Not applicable to Venus Protocol

### Notes

- The `PancakeSwap Token` token shows up on chain with the symbol `Cake` when a lot of platforms show `CAKE`
- High deposits / borrows can be partly attributed to Bunny Finance:
  - This protocol is a Yield Aggregator that uses Venus Protocol to earn yield.
  - In this [article](https://pancakebunny.medium.com/introducing-bunny-smart-vaults-b073938909d) they describe an algorithm that will lever up if it deems it is safe, explaining high borrows / deposits on certain days due to market conditions.
- An event occured on May 19, 2021 had a liquidation incedent, which we can see on our subgraph.
  - Initial tweet: https://twitter.com/VenusProtocol/status/1394892979190513664?s=20&t=yvrRsx4T8RpH7zgKOvGUaQ
  - Post-mortem statement: https://blog.venus.io/venus-protocol-incident-post-mortem-4468c87d245e

## Reference and Useful Links

Protocol: https://venus.io/

Docs: https://docs.venus.io/docs/getstarted#introduction

Comptroller: [`0xfD36E2c2a6789Db23113685031d7F16329158384`](https://www.bscscan.com/address/0xfD36E2c2a6789Db23113685031d7F16329158384)
