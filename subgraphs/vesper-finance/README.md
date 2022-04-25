# Vesper Finance Subgraph
## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools (Grow Pools + Earn Pools + Governance Pools): 

`Deposit TVL`

### Total Revenue USD

Sum across all Pools (Grow Pools + Earn Pools + Governance Pools):

`Yield Generated`

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`(Withdrawal Fees * Withdrawal Amount) + (Platform Fee * Yield)`

Note (04/07/22): 
- Grow Pools have 0.6% fee on withdrawals, and a 20% platform fee on yield.
- Earn Pools have 25% platform fee on yield and no withdrawal fee
- 5% goes to developer / strategist but is to be included in Protocol-side Revenue

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`Yield Generated - (Withdrawal Fees * Withdrawal Amount) - (Platform Fee * Yield Generated)`

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added

## Useful Links

Existing Subgraph 

https://thegraph.com/explorer/subgraph?id=0x9520b477aa81180e6ddc006fc09fb6d3eb4e807a-0&view=Playground	

https://github.com/vesperfi/vesper-subgraph
