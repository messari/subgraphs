# ApeSwap Subgraph
## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Sum of Pool Assets`

This applies to the DEX. Can ignore Lending market for now. Also do not count staked value as TVL. 


### Total Revenue USD

Sum across all Pools:

`totalPoolFee * Pool Volume`

*fees are different between polygon and Binance deployments* 

Polygon: 0.2% total fee - 0.05% goes to LPs, 0.15% to ApeSwap Treasury
Binance: 0.2% total fee - 0.15% goes to LPs, 0.05% to ApeSwap Treasury 

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`PoolFee * Pool Volume * (chainProtocolFee / totalFee)`

*fees are different between polygon and Binance deployments* 

Polygon:  0.15% to ApeSwap Treasury
Binance:  0.05% to ApeSwap Treasury 

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`PoolFee * Pool Volume * (chainLPFee / totalFee)`

Polygon: 0.2% total fee - 0.05% goes to LPs
Binance: 0.2% total fee - 0.15% goes to LPs


### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Swaps`

`Deposits`

`Withdraws`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added
  
  

## Links

- Protocol website: https://apeswap.finance/
- Protocol documentation: https://apeswap.gitbook.io/apeswap-finance/welcome/master
- Smart contracts: https://apeswap.gitbook.io/apeswap-finance/where-dev/smart-contracts
- Lending Stats: https://lending.apeswap.finance/network
- DEX Stats: https://info.apeswap.finance/
