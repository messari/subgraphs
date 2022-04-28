# Yield Yak Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Vaults:

`Deposits in vaults + deposits in yyJOE + deposits in yyPTP`

Ignores staked YAK. Ignores YY DEX aggregator.

### Total Revenue USD

Sum across all Vaults:

`Harvested yield`

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Vaults:

`Harvested yield * Protocol fee share`

Fees are usually between 5-10% of the reward tokens. Fees are variable and change with network conditions to optimize rewards.

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Vaults

`Harvested yield * (1 - Protocol fee share)`

Fees are usually between 5-10% of the reward tokens. Fees are variable and change with network conditions to optimize rewards.

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added


## Links

- Protocol website: https://yieldyak.com/
- Protocol documentation: https://docs.yieldyak.com/
- Smart contracts: https://github.com/yieldyak/smart-contracts
