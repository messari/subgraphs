# BadgerDAO Subgraph

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

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Deposit`

`Withdraw`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added

## Links

- Protocol website: https://badger.com/
- Protocol documentation: https://badger-finance.gitbook.io/badger-finance/
- Smart contracts: https://github.com/Badger-Finance/badger-system
- Deployed addresses: https://docs.badger.com/badger-finance/contract-addresses
- Existing subgraphs: https://github.com/Badger-Finance/badger-subgraph
