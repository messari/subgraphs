# Gamma Strategies Subgraph

### Vault Input Token, Pirce per share
Gamma Strategies vaults work with two input tokens that corresponds to the underlying Uniswap v3 pool. To track this using our standardised schema, the `inputToken` is set as the `outputToken` of the vault.  The `_UnderlyingToken` entity tracks the actual two tokens used.
Due to the above, the pricePerShare has been set to null in this subgraph.

### Total Value Locked (TVL) USD

Sum across all Vaults: 

`Vault TVL`

### Total Revenue USD
The source of revenue from each vault comes from trading fees collected by providing liquidity to the underlying uniswap v3 pool. Trading fees are collected whenever `rebalance` is called on the hypervisor vault.

Sum across all Vaults:

'`Total Fees collected`'

### Protocol-Side Revenue USD
Gamma Strategies takes a 10% performance fee from the trading fees collected by its vaults. This fee is hardcoded in the vault contract. The performance fee collected is used to buyback GAMMA and distributed to GAMMA stakers. In this subgraph we only consider the USD value of the fees collected pre-GAMMA buyback.

Sum across all Vaults:

`(Vault Revenue * Vault Performance Fee)`


### Supply-Side Revenue USD
The remain 90% of the of trading fees are accrued to LPs of the vault and re-invested automatically during each `rebalance` call.  The USD value of this is calculated at the time of the rebalance call.

Sum across all Vaults

`((Vault Revenue * (1 - Vault annualized Performance Fee))`

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol vaults via the following functions:

`Deposit`

`Withdraw`

###  Reward Token Emissions Amount

No reward tokens are provided

###  Protocol Controlled Value

To be added

## Links

- Protocol website: https://gamma.xyz/