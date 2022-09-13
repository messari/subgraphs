# StakeDAO Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Vaults: 

`Vault TVL`

### Total Revenue USD

Sum across all Vaults:

`Total Yield`

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Vault Revenue * Annualized Vault Performance Fee) + (Withdraw Amount * Vault Withdraw Fee)`

Note that different fees are applied:

- Passive Vaults: Performance Fee +  Withdrawal fee
- Option Vaults: Performance Fee + Withdrawal Fee 
- (Fees can vary between vaults - standard is 15% performance, 0.5% withdrawal)

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`(Vault Revenue * (1-Vault annualized Performance Fee)) - (Withdraw Amount * Vault Withdraw Fee)`

Note that this is the remaining yield after protocol fees

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Deposit`

`Withdraw`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added

## Links

- Protocol website: https://stakedao.org/
- Protocol documentation: https://stakedao.gitbook.io/stakedaohq/
- Smart contracts: https://github.com/StakeDAO/smart-contracts
- Deployed addresses: https://stakedao.gitbook.io/stakedaohq/platform/deployed-contracts
- Existing subgraphs: https://github.com/SimpleFi-finance/subgraphs/tree/master/stake-dao
