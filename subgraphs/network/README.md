# EVM L1 Subgraph

This subgraph and schema will gather a standard set of L1 data metrics that matter.

## About the Schema

The timeseries data is important, and it follows our `Blockchain` data in addition to hourly and daily metrics.

The following data is collected: TODO: add new things once schema is finalized

- `totalBlocksMined` is the current block height
- Blocks mined during this day/hour
- `blocksPerDay` is a rolling target at the blocks/day using an algorithm
- Difficulty, is the amount of effort required to mine a block
  - `totalDifficulty` captures the difficulty it took to reach a given block
  - daily/hourly difficulty is the new difficulty added during this day/hour
- Average difficulty = ( difficulty during that timeseries entity ) / ( blocks mined in that timeseries entity )
- `daily/hourlyGasUsed` represents the gas used during the day
- `daily/hourlyGasLimit` is the gasLimit at last block in the timeseries
- The total amount of fees burnt up until this day/hour
  - Burnt Fees = `gasUsed` \* `baseFeePerGas`
- The total rewards emitted up until day/hour
- The reward emissions for a given timeseries entity
- The supply of the native asset at a given timeseries entity

### Networks Supported

TODO: talk about which networks are supported and link to each one

### Block Handlers

There are 4 different types of networks supported by thegraph. Each one has a different set of returning values for block handlers. We will explore each one below: TODO

- EVM:
- Arweave:
- Cosmos:
- NEAR:

### Reference Subgraphs

- https://github.com/stakewise/subgraphs/tree/main/subgraphs/ethereum
- https://github.com/graphprotocol/example-subgraph
- https://thegraph.com/explorer/subgraph?id=3WFXNz46rk4iuVgsBybcGtxMa4cbHkBLfuSjUvvqs2MD&view=Overview
- Arweave: https://github.com/hepnerthomas/arweave-revenues
- Near: https://github.com/linear-protocol/linear-subgraph
- Cosmos: `NA`

### Resources

- https://ethereum.org/en/developers/docs/gas/
