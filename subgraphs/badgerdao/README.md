# BadgerDAO Subgraph

## Known Issue

The `bDigg` vault of badger finance with contract address `0x7e7E112A68d8D2E221E11047a72fFC1065c38e1a`
has issue related to the input token price. The price for `Digg` token with address `0x798d1be841a82a273720ce31c822c61a67a601c3`
is currently fetched from `SushiSwapRouter` which results in incorrect values since block `11680422`.

The entities `Deposit` and `Withdraw` which stores the `amountUSD` for the tokens is incorrect for
above mentioned vault. Since, the amountUSD is used to calculate various financial metrics, hence
entity `FinancialsDailySnapshot` will also is affected.

Logs from the Price Library

```
[SushiSwapRouter] tokenAddress: 0x798d1be841a82a273720ce31c822c61a67a601c3, Price: 17.517436 Block: 12639535, data_source: bDIGG
```

- Vault Link [Badger - Digg](https://app.badger.com/vault/badger-digg?chain=ethereum)
- Digg Token [Etherscan](https://etherscan.io/address/0x798D1bE841a82a273720CE31c822C61a67a601C3)
- Vault Etherscan [View](https://etherscan.io/address/0x7e7E112A68d8D2E221E11047a72fFC1065c38e1a)

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Vaults:

`Vault TVL`

### Total Revenue USD

Sum across all Vaults:

`Total Yield`

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Note that BadgerDAO applies a Variable Withdrawal Fee and Variable Performance Fee

Sum across all Vaults:

`(Vault Revenue * Vault Annualized Performance Fee) + (Withdraw Amount * Vault Withdraw Fee)`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Note that this is the remaining Yield after Protocol Fees

Sum across all Vaults

`((Vault Revenue * (1 - Vault annualized Performance Fee)) - (Withdraw Amount * Vault Withdraw Fee)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposit`

`Withdraw`

### Reward Token Emissions Amount

To be added

### Protocol Controlled Value

To be added

## Links

- Protocol website: https://badger.com/
- Protocol documentation: https://badger-finance.gitbook.io/badger-finance/
- Smart contracts: https://github.com/Badger-Finance/badger-system
- Deployed addresses: https://docs.badger.com/badger-finance/contract-addresses
- Existing subgraphs: https://github.com/Badger-Finance/badger-subgraph
