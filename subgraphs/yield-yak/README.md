# Yield Yak Subgraph

## Calculation Methodology v0.0.1

### Total Value Locked (TVL) USD

Sum across all Vaults:

`Vault TVL`

### Total Revenue USD

Sum across all Vaults

`protocol.cumulativeTotalRevenueUSD = protocol.cumulativeSupplySideRevenueUSD + protocol.cumulativeSupplyProtocolRevenueUSD`

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Vaults

`protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD + protocolRewardInUSD`

protocolRewardInUSD - calculate based on admin fees

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Vaults

`protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD + distributedRewardInUSD`

distributedRewardInUSD - calculate based on Deposit Token Price

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