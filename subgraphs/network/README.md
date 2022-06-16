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

## Block-specific Data

There are 4 different types of networks supported by [thegraph](https://thegraph.com/). Each one has a different set of returning values for block handlers. All of the data in this subgraph is derived from the metrics listed below. Some networks have a different set of metrics than others.

### EVM or Ethereum Virtual Machine supported networks

```ts
class Block {
      author: Address,
      baseFeePerGas: BigInt | null,
      difficulty: BigInt,
      gasLimit: BigInt,
      gasUsed: BigInt,
      hash: Bytes,
      number: BigInt,
      parentHash: Bytes,
      receiptsRoot: Bytes,
      size: BigInt | null,
      stateRoot: ,
      timestamp: BigInt,
      totalDifficulty: BigInt,
      transactionsRoot: Bytes,
      unclesHash: Bytes,
}
```

### Arweave

```ts
class Block {
     timestamp: u64,
     lastRetarget: u64,
     height: u64,
     indepHash: Bytes,
     nonce: Bytes,
     previousBlock: Bytes,
     diff: Bytes,
     hash: Bytes,
     txRoot: Bytes,
     txs: Bytes[],
     walletList: Bytes,
     rewardAddr: Bytes,
     tags: Tag[],
     rewardPool: Bytes,
     weaveSize: Bytes,
     blockSize: Bytes,
     cumulativeDiff: Bytes,
     hashListMerkle: Bytes,
     poa: ProofOfAccess,
}
```

### Cosmos

```ts
class Block {
      header: Header,
      evidence: EvidenceList,
      resultBeginBlock: ResponseBeginBlock,
      resultEndBlock: ResponseEndBlock,
      transactions: Array<TxResult>,
      validatorUpdates: Array<Validator>,
}

class Header {
      version: Consensus,
      chainId: string,
      height: u64,
      time: Timestamp,
      lastBlockId: BlockID,
      lastCommitHash: Bytes,
      dataHash: Bytes,
      validatorsHash: Bytes,
      nextValidatorsHash: Bytes,
      consensusHash: Bytes,
      appHash: Bytes,
      lastResultsHash: Bytes,
      evidenceHash: Bytes,
      proposerAddress: Bytes,
      hash: Bytes,
}
```

### NEAR

```ts
class BlockHeader {
      height: u64,
      prevHeight: u64, // Always zero when version < V3
      epochId: Bytes,
      nextEpochId: Bytes,
      chunksIncluded: u64,
      hash: Bytes,
      prevHash: Bytes,
      timestampNanosec: u64,
      randomValue: Bytes,
      gasPrice: BigInt,
      totalSupply: BigInt,
      latestProtocolVersion: u32,
  }

class ChunkHeader {
      gasUsed: u64,
      gasLimit: u64,
      shardId: u64,
      chunkHash: Bytes,
      prevBlockHash: Bytes,
      balanceBurnt: BigInt,
  }

class Block {
      author: string,
      header: BlockHeader,
      chunks: Array<ChunkHeader>,
  }
```

## Resources and Links

<details>
<summary>See hosted service testing endpoints</summary>
<br>

- Arbitrum One: https://thegraph.com/hosted-service/subgraph/dmelotik/network-arbitrum-one
- Aurora: https://thegraph.com/hosted-service/subgraph/dmelotik/network-aurora
- Avalanche: https://thegraph.com/hosted-service/subgraph/dmelotik/network-avalanche
- Boba: https://thegraph.com/hosted-service/subgraph/dmelotik/network-boba
- BSC: https://thegraph.com/hosted-service/subgraph/dmelotik/network-bsc
- Celo: https://thegraph.com/hosted-service/subgraph/dmelotik/network-celo
- Clover: https://thegraph.com/hosted-service/subgraph/dmelotik/network-clover
- Cronos: https://thegraph.com/hosted-service/subgraph/dmelotik/network-cronos
- Fantom: https://thegraph.com/hosted-service/subgraph/dmelotik/network-fantom
- Fuse: https://thegraph.com/hosted-service/subgraph/dmelotik/network-fuse
- Harmony: https://thegraph.com/hosted-service/subgraph/dmelotik/network-harmony
- Mainnet: https://thegraph.com/hosted-service/subgraph/dmelotik/network-mainnet
- Matic: https://thegraph.com/hosted-service/subgraph/dmelotik/network-matic
- Moonbeam: https://thegraph.com/hosted-service/subgraph/dmelotik/network-optimism
- Moonriver: https://thegraph.com/hosted-service/subgraph/dmelotik/network-moonriver
- Optimism: https://thegraph.com/hosted-service/subgraph/dmelotik/network-optimism
- xDai: https://thegraph.com/hosted-service/subgraph/dmelotik/network-xdai
- Arweave: https://thegraph.com/hosted-service/subgraph/dmelotik/network-arweave-mainnet
- Cosmos: https://thegraph.com/hosted-service/subgraph/dmelotik/network-cosmoshub
- Juno: https://thegraph.com/hosted-service/subgraph/dmelotik/network-juno
- Osmosis: https://thegraph.com/hosted-service/subgraph/dmelotik/network-osmosis
- NEAR: https://thegraph.com/hosted-service/subgraph/dmelotik/network-near-mainnet

</details>

<details>
<summary>Reference subgraphs</summary>
<br>

- https://github.com/stakewise/subgraphs/tree/main/subgraphs/ethereum
- https://github.com/graphprotocol/example-subgraph
- https://thegraph.com/explorer/subgraph?id=3WFXNz46rk4iuVgsBybcGtxMa4cbHkBLfuSjUvvqs2MD&view=Overview
- Arweave: https://github.com/hepnerthomas/arweave-revenues
- Near: https://github.com/linear-protocol/linear-subgraph
- Cosmos: `NA`

</details>

<details>
<summary>Resources</summary>
<br>

- https://ethereum.org/en/developers/docs/gas/
- https://docs.near.org/docs/develop/basics/getting-started

</details>
