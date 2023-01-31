# Burrow Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Pool Deposit TVL`

### Total Revenue USD

Sum across all Pools:

`(Pool Borrow Amount * Pool Borrow Rate)`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Pool Oustanding Borrow Amount * Pool Borrow Rate) * (Pool Reserve Factor)`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Pool Outstanding Borrows * Pool Borrow Rate) * (1 - Pool Reserve Factor)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Liquidations`

`Repayments`

### Reward Token Emissions Amount

`NA`

> Burrow has rewards, but NEAR subgraphs don't support function calls. So it is impossible to get accurate results here.

## Note

1. Token amounts are expressed in factors of 10^decimals + extra_decimals. Example: for BTC with decimals (8) and extraDecimals (18) if the amount is 43581280584419596 => the actual token amount would be 43581280584419596/(10\*\*(8+10)) = 0.043

2. Since contract calls are not [yet] enabled for NEAR subgraphs, we have stored token metadata under `utils/const.ts`. Though it covers all tokens that currently exists on NEAR, in case of a new market being added - the metadata needs to be added and redeployed.

3. NEAR has upgradable contracts, so function calls and events may change in the future.

## Reference and Useful Links

Protocol: https://app.burrow.cash/

Docs: https://docs.burrow.cash/

Smart contracts: https://github.com/NearDeFi/burrowland

Building Subgraphs on NEAR: https://thegraph.com/docs/en/cookbook/near/
