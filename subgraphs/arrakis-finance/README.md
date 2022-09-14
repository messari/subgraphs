# Arrakis Finance Subgraph

### Vault Input Token, Price per share

Arrakis finance vaults work with two input tokens that corresponds to the underlying Uniswap v3 pool. To track this using our standardised schema, the `inputToken` is set as the `outputToken` of the vault.  The `_UnderlyingToken` entity tracks the actual two tokens used.
Due to the above, the `pricePerShare` has been set to null in this subgraph.

### Total Value Locked (TVL) USD

Sum across all Vaults: 

`Vault TVL`

### Total Revenue USD

The source of revenue from each vault comes from trading fees collected by providing liquidity to the underlying uniswap v3 pool. Trading fees are collected whenever `rebalance`, `executiveRebalance` or `burn` (withdraw) is called on the vault, and is tracked via the FeesEarned event.

Sum across all Vaults:

'`Total Fees collected`'

### Protocol-Side Revenue USD

The protocol-side revenue consists of two components:
1. Arrakis Finance performance fee (2.5%)
2. Manager performance fee (variable)

Arrakis finance collects these fees as a percentage of trading fees collected by its vaults. This Arrakis Finance fee is hardcoded in the vault contract, while the manager fee is variable and can be set by specific vault managers. The USD value of the fees are calculated at the point of collection.

Sum across all Vaults:

`(Vault Revenue * Vault Performance Fee)`

### Supply-Side Revenue USD

The rest of the of trading fees are accrued to LPs of the vault and re-invested automatically during each `rebalance` and `executiveRebalance` call.  The USD value of this is calculated at the time of the rebalance call.

Sum across all Vaults

`((Vault Revenue * (1 - Vault annualized Performance Fee))`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol vaults via the following functions:

`Deposit`

`Withdraw`

###  Reward Token Emissions Amount

Arrakis Finance have deployed vaults on Polygon with a time-limited rewards program, distributing MATIC tokens to users.

###  Protocol Controlled Value

To be added

### TVL/Revenue Known Issues
The subgraph uses the price libs which currently does not support polygon and optimism.  The price lib used in this subgraph does not currently support Uniswap V3, as such, USD values of TVL and revenue of vaults containing the following tokens may be inaccurate:
| Token Symbol | Token Address                              |
|--------------|--------------------------------------------|
| JPG          | 0x02e7ac540409d32c90bfb51114003a9e1ff0249c |
| uAD          | 0x0f644658510c95cb46955e55d7ba9dda9e9fbec6 |
| ETHMAXY      | 0x0fe20e0fa9c78278702b05c333cc000034bb69e2 |
| 🌐           | 0x3402e15b3ea0f1aec2679c4be4c6d051cef93953 |
| iETHV        | 0x3a707d56d538e85b783e8ce12b346e7fb6511f90 |
| Silo         | 0x6f80310ca7f2c654691d1383149fa1a57d8ab1f8 |
| icETH        | 0x7c07f7abe10ce8e33dc6c5ad68fe033085256a84 |
| ETHV         | 0xc53342fd7575f572b0ff4569e31941a5b821ac76 |
| POP          | 0xd0cd466b34a24fcb2f87676278af2005ca8a78c4 |
| FAITH        | 0x30b2de4a95f397545c6509402f235b1be0fa9a14 |

## Links

- Protocol website: https://www.arrakis.finance/
