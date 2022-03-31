# Balancer v2 Subgraph
## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Pools: 

`Liquidity Pool TVL`

### Total Revenue USD

Sum across all Pools:

`Pool Swap Volume * Pool Swap Fee`

Note, does this not include

- Flash Loans (Flash Loan Amount * Flash Loan Interest)
- Asset Manager Yield Generated

### Protocol-Side Revenue USD
Portion of the Total Revenue allocated to the Protocol

Sum across all Pools:

`Pool Swap Volume * Pool Swap Fee * ProtocolSide Fee`

Note: 04/07/22 The ProtocolSideFee is currently 50% and has been changed twice. It can continue changing.

### Supply-Side Revenue USD
Portion of the Total Revenue allocated to the Supply-Side

Sum across all Pools

`Pool Swap Volume * Pool Swap Fee * (1 - ProtocolSide Fee)`

### Total Unique Users

Count of  Unique Addresses which have interacted with the protocol via any transaction

`Swaps`

`Deposits`

`Withdraws`

###  Reward Token Emissions Amount

To be added

###  Protocol Controlled Value

To be added

## Useful Links

- Protocol: https://balancer.fi/
- Analytics: https://dune.xyz/balancerlabs
- Docs: https://docs.balancer.fi/
- Smart contracts: https://github.com/balancer-labs/balancer-v2-monorepo
- Deployed addresses: https://github.com/balancer-labs/balancer-v2-monorepo/tree/master/pkg/deployments#past-deployments
- Official subgraph: https://github.com/balancer-labs/balancer-subgraph-v2

## Build

- Generate code from manifest and schema: `yarn codegen`
- Build subgraph: `yarn build`

## Deploy

- Authenticate (just once): `graph auth --product hosted-service <ACCESS_TOKEN>`
- Deploy to Hosted Service: `graph init --product hosted-service cbrzn/balancer-v2`