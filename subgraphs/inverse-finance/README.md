# Inverse Finance Lending Protocol Subgraph

## Calculation Methodology v1.0.0

### Total Value Locked (TVL) USD

Sum across all Markets:

`CToken.get_cash() * priceOracle.getUnderlyingPrice(CToken)`

`CToken.get_cash()` returns the deposits (inputTokenBalance), which is then converted to USD by
multiplying with the underlying token price (including ETH) returned from the price Oracle contract.

### Total Revenue USD

Sum across all Markets: `AccrueInterest.interestAccumulated * priceOracle.getUnderlyingPrice(CToken)`

The `AccrueInterest` event is emitted when interest (revenue) is accrued in the underlying token. The interest (revenue) is converted to USD by multiplying with the underlying token price (including ETH) returned from the price Oracle contract.

### Protocol-Side Revenue USD

Portion of the Total Revenue allocated to the Protocol. The total interest (revenue) is split between depositors (supply-side) and the protocol based on the value of the `reserveFactor`. 

Sum across all Markets: `total revenue * reserveFactorMantissa / 10 ^ MANTISSA`

### Supply-Side Revenue USD

Portion of the Total Revenue allocated to the Supply-Side. The total interest (revenue) is split between depositors (supply-side) and the protocol based on the value of the `reserveFactor`. 

Sum across all Markets:`total revenue - Protocol-Side Revenue`

### Total Unique Users

Count of Unique Addresses which have interacted with the protocol via any transaction

`Deposits`

`Withdrawals`

`Borrows`

`Repays`

`Liquidations`

### Reward Token Emissions Amount

The inverse-finance comptroller computes the rewards emissions to lenders and borrowers when users interacts with the contracts, and emit `DistributedSupplierComp` and `DistributedBorrowerComp` event when emissions are rewarded. The event paramater `compDelta` contains the amount of emissions. Since the emissions happen irregularly, to normalize the emssions to a daily amount, a HelperStore entity keeps tract the block number of the last emissions, and is used to computed `deltaBlocks` between two emissions. The normalized daily emissions = `compDelta / deltaBlock * BLOCKS_PER_DAY`. 

Reward emissions for lenders: `DistributedSupplierComp.compDelta * priceOracle.getUnderlyingPrice(CToken) * BLOCKS_PER_DAY / deltaBlocks`

Reward emissions for borrowers: `DistributedBorrowerComp.compDelta * priceOracle.getUnderlyingPrice(CToken) * BLOCKS_PER_DAY / deltaBlocks`

### Protocol Controlled Value

Not applicable.


## Links

- Protocol: https://www.inverse.finance/
- Analytics: https://dune.xyz/naoufel/inverse-dao
- Docs: https://docs.inverse.finance/inverse-finance/about-inverse
- Smart contracts: https://github.com/InverseFinance/anchor
- Deployed addresses: https://docs.inverse.finance/inverse-finance/technical/smart-contracts
- Official subgraph: https://thegraph.com/studio/subgraph/inverse-subgraph/

## Build

- Initialize subgraph (Subgraph Studio):
  ```
  graph init --product subgraph-studio
  --from-contract <CONTRACT_ADDRESS> [--network <ETHEREUM_NETWORK>] [--abi <FILE>] <SUBGRAPH_SLUG> [<DIRECTORY>]
  ```
- Initialize subgraph (Hosted Service):
  ```
  graph init --product hosted-service --from-contract <CONTRACT_ADDRESS> <GITHUB_USER>/<SUBGRAPH_NAME>[<DIRECTORY>]
  ```
- Generate code from manifest and schema: `graph codegen`
- Build subgraph: `graph build`

## Deploy

- Authenticate (just once): `graph auth --product hosted-service <ACCESS_TOKEN>`
- Deploy to Subgraph Studio: `graph deploy --studio <SUBGRAPH_NAME>`
- Deploy to Hosted Service: `graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH_NAME>`

## Hosted Subgraph

- Hosted subgraph: https://thegraph.com/hosted-service/subgraph/tnkrxyz/inverse-finance

## Smart Contracts Interactions

![inverse-finance](../../docs/images/protocols/inverse-finance.png "inverse-finance")
