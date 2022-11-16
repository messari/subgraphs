# Beethoven X Subgraph

## Rewards

- Beethoven X Fantom, use the childChainLiquidityGauge contract.
- The same abi is used for both of these contract types. The ABI named GaugeController uses events from both the GaugeController and childChainLiquidityGauge contracts - an event from the childChainLiquidityGauge is transported of to the GaugeController abi (RewardsOnlyGaugeCreated).
- The only other example is Beethoven X Fantom which does not use the GaugeController abi. It instead uses the MasterChef V2 contract like Sushiswap to emit rewards to stakers.
- The updateFactoryRewards() is used to pull all reward tokens and their rates. There can be multiple reward tokens for each Gauge and they can all have separate rates.

## Beethoven X

- Fantom
  - Uses the same logic for liquidity pools as Balancer V2, however it uses a separate mechanism for rewards. Instead of using Gauges, it uses the MasterChef V2 contract.
- Optimism
  - Again, uses the same logic for liquidity pools as Balancer V2, and it shares the same reward mechanisms as Balancer V2 on Arbitrum and Polygon.

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools:

`Liquidity Pool TVL`

### Total Revenue USD

Sum across all Pools:

`Pool Swap Volume * Pool Swap Fee`

Note, does this not include

- Flash Loans (Flash Loan Amount \* Flash Loan Interest)
- Asset Manager Yield Generated

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`Pool Swap Volume * Pool Swap Fee * ProtocolSide Fee`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`Pool Swap Volume * Pool Swap Fee * (1 - ProtocolSide Fee)`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Swaps`

`Deposits`

`Withdraws`

### Reward Token Emissions Amount

### Protocol Controlled Value

To be added

## Useful Links

- Protocol: https://beets.fi/
- Docs: https://docs.beets.fi/
- Github: https://github.com/beethovenxfi
- Deployed addresses: https://docs.beets.fi/developers/deployments
- Official subgraph: https://docs.beets.fi/developers/subgraphs

## Smart Contracts Interactions

![balancer-v2](../../docs/images/protocols/balancer-v2.png "balancer-v2")
