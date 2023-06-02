# Network Subgraph

> ALERT: Network subgraphs are deprecated as of May 18, 2023. The subgraphs in this directory should all build, but do not expect any deployments to be supported after this date.

This subgraph and schema will gather a standard set of network data metrics that matter.

## About the Schema

The timeseries data is important, based off `Network` and adds numerous daily/hourly metrics.

### Schema 1.2.0 Explanation

There is a new entity called `STAT` that contains statistical calculations for each field collected.

```ts
type Stat @entity {
  " { id of the snapshot this belongs to } - { DataType } "
  id: ID!

  " Number of times entity has been used in a time data entity "
  count: Int!

  " The average of all the values "
  mean: BigDecimal!

  " The maximum value in this entity "
  max: BigInt!

  " The minimum value in this data set "
  min: BigInt!


  " The sum of all the values "
  sum: BigInt!

  ##### Calculated Statistical Fields #####

  " The standard deviation of all values within this entity "
  variance: BigDecimal

  " This is the upper quartile where 75% of the values lie "
  q3: BigDecimal

  " This is the lower quartile where 25% of the values lie "
  q1: BigDecimal
}
```

> Upon moving to substreams we will add `median` back into `Stats`

The fields that will exhibit this type are:

- `dailyUniqueAuthors` measures the number of different authors that mined a block this day. Some of the `STAT` metrics are redundant for this field.
- `dailyDifficulty`
- `dailyGasUsed`
- `dailyGasLimit`
- `dailyBurntFees`
- `dailyRewards`
- `dailySize`
- `dailyChunks`
- `dailySupply`
- `dailyTransactions`
- `dailyBlockInterval` measures the block interval between blocks throughout a given day.

> All of these fields also apply to `HourlySnapshot`

What was removed?

- The rolling `blocksPerDay` field was removed because it is essentially the same as `dailyBlocks` and this is not an intended use case.
- A field will be null when it is not available for a given network.

<details>
<summary>Deprecated: Schema 1.0.0</summary>
<br>

- `blockHeight` is the current block height
- `dailyBlocks` is the number of blocks mined per day
- `dailyMeanDifficulty` = `dailyDifficulty` / `dailyBlocks`
  - Difficulty is the amount of effort required to mine a block
  - `dailyMeanGasUsed` = `dailyGasUsed` / `dailyBlocks`
    - Gas used is the amount of gas used in a block for all of the transactions
  - `dailyMeanGasLimit` = `dailyGasLimit` / `dailyBlocks`
    - Gas limit is the maximum amount of gas that can be used in a block
  - `dailyBlockUtilization` = `dailyGasUsed` / `dailGasLimit`
    - Block utilization is the percentage of the block's gas limit that was used
  - `dailyMeanRewards` = `dailyRewards` / `dailyBlocks`
    - Rewards is the amount of native currency rewarded to the author for mining a block (used more for non-PoW networks)
- `dailyMeanBlockInterval` = `dailyBlocks` / (`timestamp` - `firstTimestamp`)
- `dailyMeanBlockSize` = `dailySize` / `dailyBlocks`
  - The size is the amount of data in a block in bytes (in the case of ethereum)
- Chunks are the number of shards in a single block. This is used in networks where computation is parallelized into shards

</details>

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
     indepHash: Bytes, // block hash
     nonce: Bytes,
     previousBlock: Bytes,
     diff: Bytes,
     hash: Bytes,
     txRoot: Bytes,
     txs: Bytes[],
     walletList: Bytes,
     rewardAddr: Bytes, // miner address
     tags: Tag[],
     rewardPool: Bytes, // total rewards to be distributed to miners
     weaveSize: Bytes, // total data size in Bytes
     blockSize: Bytes, // block size in Bytes
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
      balanceBurnt: BigInt, // also the fee
  }

class Block {
      author: string,
      header: BlockHeader,
      chunks: Array<ChunkHeader>,
  }
```

## Development Notes

- `juno` is not yet supported on the graph (as of 7/21/2022)
- `cronos` needs to have a startBlock of 1 to work, so I had to keep it seperate from the evm chains
  - Also, the hosted service does not support `cronos` so you have to deploy here: https://portal.cronoslabs.com/
- explain how eth rewards can be calculated using subgraph data
- `aurora` will take ~3 months to fully sync
- `optimism` blocks are actually transactions. There is no way to get blocks.

## Resources and Links

<details>
<summary>Reference subgraphs</summary>
<br>

- https://github.com/stakewise/subgraphs/tree/main/subgraphs/ethereum
- https://github.com/graphprotocol/example-subgraph
- https://thegraph.com/explorer/subgraph?id=3WFXNz46rk4iuVgsBybcGtxMa4cbHkBLfuSjUvvqs2MD&view=Overview
- Arweave: https://github.com/hepnerthomas/arweave-revenues
- Near: https://github.com/linear-protocol/linear-subgraph
- Cosmos: https://github.com/graphprotocol/example-subgraph/tree/cosmos-block-filtering

</details>

<details>
<summary>Resources</summary>
<br>

- https://ethereum.org/en/developers/docs/gas/
- https://docs.near.org/docs/develop/basics/getting-started

</details>
