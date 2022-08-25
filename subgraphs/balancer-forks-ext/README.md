# Balancer Forks

## Rewards

- The GaugeController contract is only used on the Ethereum blockchain for Balancer V2. The other deployments, except Beethoven X Fantom, use the childChainLiquidityGauge contract.
- The same abi is used for both of these contract types. The ABI named GaugeController uses events from both the GaugeController and childChainLiquidityGauge contracts - an event from the childChainLiquidityGauge is transported of to the GaugeController abi (RewardsOnlyGaugeCreated).
- The only other example is Beethoven X Fantom which does not use the GaugeController abi. It instead uses the MasterChef V2 contract like Sushiswap to emit rewards to stakers.
- The updateFactoryRewards() is used to pull all reward tokens and their rates. There can be multiple reward tokens for each Gauge and they can all have separate rates.

## BalancerV2

- Ethereum
  - Uses the GaugeController contract for creating Gauges
  - The updateControllerRewards() in rewards.ts will only update rewards for Balancer V2 on ethereum. This function only handles rewards for the BAL token. The starting inflation rate on Ethereum only is 145000 BAL. All other rewards are calculated in the updateFactoryRewards() function.
  - **NOTE:** BAL can be emitted as a reward on other chains, however, unlike on Ethereum for Balancer V2, it will be calculated along with other reward tokens in the updateFactoryRewards() function.
- Arbitrum
  - Uses the childChainLiquidityPool contract for creating Gauges.
- Polygon
  - Uses the childChainLiquidityPool contract for creating Gauges.

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

Note: Currently, 145,000 BAL tokens, or approximately 7.5M per year, are distributed every week through the Liquidity Mining program.

### Protocol Controlled Value

To be added

## Useful Links

- Protocol: https://balancer.fi/
- Analytics: https://dune.xyz/balancerlabs
- Docs: https://docs.balancer.fi/
- Smart contracts: https://github.com/balancer-labs/balancer-v2-monorepo
- Deployed addresses: https://github.com/balancer-labs/balancer-v2-monorepo/tree/master/pkg/deployments#past-deployments
- Official subgraph: https://github.com/balancer-labs/balancer-subgraph-v2

## Smart Contracts Interactions

![balancer-v2](../../docs/images/protocols/balancer-v2.png "balancer-v2")

## Build

- Generate code from manifest and schema: `yarn codegen`
- Build subgraph:
  - Mainnet: `yarn build:mainnet`
  - Polygon: `yarn build:polygon`
  - Arbitrum: `yarn build:arbitrum`
  - Beets: `yarn build:beets`
  - Beets-optimism: `yarn build:beetsop`

## Deploy

- Authenticate (just once): `graph auth --product hosted-service <ACCESS_TOKEN>`
- Deploy to Hosted Service:
  - Mainnet `yarn deploy:mainnet`
  - Polygon `yarn deploy:polygon`
  - Arbitrum `yarn deploy:arbitrum`
  - Beets: `yarn deploy:beets`
  - Beets-optimism: `yarn deploy:beetsop`
