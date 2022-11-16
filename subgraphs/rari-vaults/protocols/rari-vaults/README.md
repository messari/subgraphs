# Rari Capital Yield Aggregator v1

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Vaults:

`Vault TVL`

### Total Revenue USD

Sum across all Vaults:

`Total Interest Accrued`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Total Vault Revenue USD * Vault Performance Fee) + (Withdraw Amount * Withdraw Fee)`

Note that different fees are applied:

- Passive Vaults: Performance Fee + Withdrawal fee
- Option Vaults: Performance Fee + Withdrawal Fee
- (Fees can vary between vaults - standard is 15% performance, 0.5% withdrawal)

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Total Vault Revenue USD * (1-Vault Performance Fee))`

Note that this is the remaining yield after protocol fees

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdraw`

### Reward Token Emissions Amount

`Not applicable`

### Protocol Controlled Value

`Not applicable`

## Known Issues

- Rari Vaults supports multiple input tokens, so to fit our schema we made a new pool for each input token to a pool. `totalPoolCount` is higher than the number of actual pools because of this.
- Eth vault revenues are weird
- Big spike in revenues around 10/21/2020 (may be okay since there is also a big spike in activity)
- _Note_: `OutputTokenSupply/Price` should be the same for each vault with the same contract addresses (ie, USDC pool mStable and USDC)
  - However, `pricePerShare` is a function of each individual vaults `inputTokenBalance` and the overall Pool's `outputTokenSupply`
- `DEFAULT_DECIMALS` is used in places where the `BigInt` value is offset by a factor of 1e18 on the contract-level
- _Note_: `pricePerShare` is very small for some vaults b/c the `outputTokenSupply` is aggregated and there is little of the `inputToken`
- Vault `totalValueLockedUSD` includes "unclaimed fees", since this is the only way to get individual token balances in a multi-token vault.
  - _Note_: if anyone can figure out how to do it without this please make a PR!

## Reference and Useful Links

Protocol: https://rari.capital/

Docs:

- https://docs.rari.capital/yag/
- https://info.rari.capital/products/earn/
- https://info.rari.capital/risk/earn/

Smart contracts:

- [Yield Pool](https://github.com/Rari-Capital/rari-yield-pool-contracts)
- [Ethereum Pool](https://github.com/Rari-Capital/rari-ethereum-pool-contracts)
- [Stables _ie_ USDC/DAI/USDT/TUSD/BUSD/mUSD Pool](https://github.com/Rari-Capital/rari-stable-pool-contracts)

Deployed addresses: https://docs.rari.capital/contracts

Existing subgraphs: `NA`
