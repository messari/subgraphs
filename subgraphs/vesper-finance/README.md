# Vesper Finance Subgraph
## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools (Grow Pools + Earn Pools + Governance Pools): 

`Deposit TVL`

### Total Revenue USD

Sum across all Pools (Grow Pools + Earn Pools + Governance Pools):

`Total Yield + Withdrawal Fees * Withdrawal Amount`

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

`Total Yield - Platform Fee * Total Yield`

**Note**: Following pools historical revenue cannot be calculated cause there is no event for the harvested amount.

```
- Name: vUSDC-v2, Pool: 0xB1C0d6EFD3bAb0FC3CA648a12C15d0827e3bcde5
- Name: vLINK, Pool: 0x0a27E910Aee974D05000e05eab8a4b8Ebd93D40C
- Name: vVSP, Pool: 0xbA4cFE5741b357FA371b506e5db0774aBFeCf8Fc
- Name: vBetaWBTC, Pool: 0x74Cc5BC20B0c396dF5680eE4aeB6169A6288a8aF
- Name: vBetaUSDC, Pool: 0x1e86044468b92c310800d4B350E0F83387a7097F
- Name: vDAI, Pool: 0xcA0c34A3F35520B9490C1d58b35A19AB64014D80
- Name: vBetaETH, Pool: 0x2C361913e2dA663e1898162Ec01497C46eb87AbF
- Name: vUSDC, Pool: 0x0C49066C0808Ee8c673553B7cbd99BCC9ABf113d
- Name: vWBTC, Pool: 0x4B2e76EbBc9f2923d83F5FBDe695D8733db1a17B
- Name: vETH, Pool: 0x103cc17C2B1586e5Cd9BaD308690bCd0BBe54D5e
```

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
