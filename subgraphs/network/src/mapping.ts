import {
  ethereum,
  arweave,
  cosmos,
  near,
  Bytes,
  BigInt,
  BigDecimal,
  log,
} from "@graphprotocol/graph-ts";
import { Author, Chunk } from "../generated/schema";
import { BIGINT_ZERO, INT_NINE, INT_ZERO } from "./constants";
import { createBlock, updateMetrics, updateNetwork } from "./helper";
import { exponentToBigDecimal } from "./utils";

/////////////////
//// Classes ////
/////////////////

export class BlockData {
  height: BigInt;
  hash: Bytes;
  timestamp: BigInt;
  author: Bytes;
  size: BigInt;
  baseFeePerGas: BigInt;
  difficulty: BigInt;
  gasLimit: BigInt;
  gasUsed: BigInt;
  gasPrice: BigInt;
  burntFees: BigInt;
  chunkCount: BigInt;
  transactionCount: BigInt;
  rewards: BigInt;
  constructor(
    height: BigInt,
    hash: Bytes,
    timestamp: BigInt,
    author: Bytes,
    difficulty: BigInt,
    gasLimit: BigInt,
    gasUsed: BigInt,
    size: BigInt,
    gasPrice: BigInt,
    baseFeePerGas: BigInt,
    burntFees: BigInt,
    chunkCount: BigInt,
    transactionCount: BigInt,
    rewards: BigInt
  ) {
    this.height = height;
    this.hash = hash;
    this.timestamp = timestamp;
    this.author = author;
    this.size = size;
    this.baseFeePerGas = baseFeePerGas;
    this.difficulty = difficulty;
    this.gasLimit = gasLimit;
    this.gasUsed = gasUsed;
    this.gasPrice = gasPrice;
    this.burntFees = burntFees;
    this.chunkCount = chunkCount;
    this.transactionCount = transactionCount;
    this.rewards = rewards;
  }
}

export class UpdateNetworkData {
  height: BigInt;
  timestamp: BigInt;
  newDifficulty: BigInt;
  newGasUsed: BigInt;
  gasLimit: BigInt;
  newBurntFees: BigInt;
  newRewards: BigInt;
  newTransactions: BigInt;
  newSize: BigInt;
  totalSupply: BigInt;

  constructor(
    height: BigInt,
    timestamp: BigInt,
    newDifficulty: BigInt,
    newGasUsed: BigInt,
    gasLimit: BigInt,
    newBurntFees: BigInt,
    newRewards: BigInt,
    newTransactions: BigInt,
    newSize: BigInt,
    totalSupply: BigInt
  ) {
    this.height = height;
    this.timestamp = timestamp;
    this.newDifficulty = newDifficulty;
    this.newGasUsed = newGasUsed;
    this.gasLimit = gasLimit;
    this.newBurntFees = newBurntFees;
    this.newRewards = newRewards;
    this.newTransactions = newTransactions;
    this.newSize = newSize;
    this.totalSupply = totalSupply;
  }
}

////////////////////////
//// Block Handlers ////
////////////////////////

export function handleArweaveBlock(block: arweave.Block): void {
  // TODO: check in subgraph to ensure correctness
  let blockDifficulty = BigInt.fromString(
    BigDecimal.fromString(parseInt(block.diff.toHexString(), 16).toString())
      .truncate(0)
      .toString()
  );

  let blockSize = BigInt.fromString(
    BigDecimal.fromString(
      parseInt(block.blockSize.toHexString(), 16).toString()
    )
      .truncate(0)
      .toString()
  );
  let blockRewards = BigInt.fromString(
    BigDecimal.fromString(
      parseInt(block.rewardPool.toHexString(), 16).toString()
    )
      .truncate(0)
      .toString()
  );

  let blockData = new BlockData(
    BigInt.fromI64(block.height),
    block.indepHash,
    BigInt.fromI64(block.timestamp),
    block.rewardAddr,
    blockDifficulty,
    BIGINT_ZERO,
    BIGINT_ZERO,
    blockSize,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BigInt.fromI32(block.txs.length),
    blockRewards
  );
  createBlock(blockData);

  // update network entity
  let updateNetworkData = new UpdateNetworkData(
    BigInt.fromI64(block.height),
    BigInt.fromI64(block.timestamp),
    blockDifficulty,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    blockRewards,
    BigInt.fromI32(block.txs.length),
    blockSize,
    BIGINT_ZERO
  );
  let network = updateNetwork(updateNetworkData);

  // update author entity
  let authorId = block.rewardAddr;
  let author = Author.load(authorId);
  if (!author) {
    author = new Author(authorId);
    author.cumulativeBlocksCreated = INT_ZERO;
    author.cumulativeDifficulty = BIGINT_ZERO;
    author.save();

    // update unique authors
    network.cumulativeUniqueAuthors++;
    network.save();
  }
  author.cumulativeBlocksCreated++;
  author.cumulativeDifficulty =
    author.cumulativeDifficulty.plus(blockDifficulty);
  author.save();

  // create/update daily/hourly metrics
  updateMetrics(blockData, network);
}

export function handleCosmosBlock(block: cosmos.Block): void {
  let header = block.header;

  let blockData = new BlockData(
    BigInt.fromI64(header.height),
    header.hash,
    BigInt.fromI64(header.time.seconds),
    header.validatorsHash,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BigInt.fromI32(block.transactions.length),
    BIGINT_ZERO
  );
  createBlock(blockData);

  // update network entity
  let updateNetworkData = new UpdateNetworkData(
    BigInt.fromI64(header.height),
    BigInt.fromI64(header.time.seconds),
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BigInt.fromI32(block.transactions.length),
    BIGINT_ZERO,
    BIGINT_ZERO
  );
  let network = updateNetwork(updateNetworkData);

  // update author entity
  let authorId = header.validatorsHash;
  let author = Author.load(authorId);
  if (!author) {
    author = new Author(authorId);
    author.cumulativeBlocksCreated = INT_ZERO;
    author.cumulativeDifficulty = BIGINT_ZERO;
    author.save();

    // update unique authors
    network.cumulativeUniqueAuthors++;
    network.save();
  }
  author.cumulativeBlocksCreated++;
  author.save();

  // create/update daily/hourly metrics
  updateMetrics(blockData, network);
}

export function handleEvmBlock(block: ethereum.Block): void {
  let burntFees = block.baseFeePerGas
    ? block.baseFeePerGas!.times(block.gasUsed)
    : BIGINT_ZERO;

  let blockData = new BlockData(
    block.number,
    block.hash,
    block.timestamp,
    block.author,
    block.difficulty,
    block.gasLimit,
    block.gasUsed,
    block.size ? block.size! : BIGINT_ZERO,
    BIGINT_ZERO,
    block.baseFeePerGas ? block.baseFeePerGas! : BIGINT_ZERO,
    burntFees,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO
  );
  createBlock(blockData);

  // update network entity
  let updateNetworkData = new UpdateNetworkData(
    block.number,
    block.timestamp,
    block.difficulty,
    block.gasUsed,
    block.gasLimit,
    burntFees,
    BIGINT_ZERO,
    BIGINT_ZERO,
    block.size ? block.size! : BIGINT_ZERO,
    BIGINT_ZERO
  );
  let network = updateNetwork(updateNetworkData);

  // update author entity
  let authorId = block.author;
  let author = Author.load(authorId);
  if (!author) {
    author = new Author(authorId);
    author.cumulativeBlocksCreated = INT_ZERO;
    author.cumulativeDifficulty = BIGINT_ZERO;
    author.save();

    // update unique authors
    network.cumulativeUniqueAuthors++;
    network.save();
  }
  author.cumulativeBlocksCreated++;
  author.cumulativeDifficulty = author.cumulativeDifficulty.plus(
    block.difficulty
  );
  author.save();

  // create/update daily/hourly metrics
  updateMetrics(blockData, network);
}

export function handleNearBlock(block: near.Block): void {
  let chunks = block.chunks;
  let header = block.header;

  // get timestamp in seconds (from nano seconds)
  let timestampBD = BigDecimal.fromString(
    header.timestampNanosec.toString()
  ).div(exponentToBigDecimal(INT_NINE));
  let timestamp = BigInt.fromString(timestampBD.truncate(0).toString());

  // add up gasLimit / gasUsed / burntFees
  let gasLimit = BIGINT_ZERO;
  let gasUsed = BIGINT_ZERO;
  let burntFees = BIGINT_ZERO;
  for (let i = 0; i < chunks.length; i++) {
    let chunk = new Chunk(chunks[i].chunkHash);
    chunk.block = header.height.toString();
    chunk.gasUsed = BigInt.fromI64(chunks[i].gasUsed);
    chunk.gasLimit = BigInt.fromI64(chunks[i].gasLimit);
    chunk.burntFees = chunks[i].balanceBurnt;
    chunk.save();

    gasLimit = gasLimit.plus(chunk.gasLimit);
    gasUsed = gasUsed.plus(chunk.gasUsed);
    burntFees = burntFees.plus(chunk.burntFees);
  }

  let blockData = new BlockData(
    BigInt.fromI64(header.height),
    header.hash,
    timestamp,
    Bytes.fromHexString(block.author),
    BIGINT_ZERO,
    gasLimit,
    gasUsed,
    BIGINT_ZERO,
    header.gasPrice,
    BIGINT_ZERO,
    burntFees,
    BigInt.fromI32(chunks.length),
    BIGINT_ZERO,
    BIGINT_ZERO
  );
  createBlock(blockData);

  // update network entity
  let updateNetworkData = new UpdateNetworkData(
    BigInt.fromI64(header.height),
    timestamp,
    BIGINT_ZERO,
    gasUsed,
    gasLimit,
    burntFees,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    header.totalSupply
  );
  let network = updateNetwork(updateNetworkData);

  // update author entity
  let authorId = Bytes.fromHexString(block.author);
  let author = Author.load(authorId);
  if (!author) {
    author = new Author(authorId);
    author.cumulativeBlocksCreated = INT_ZERO;
    author.cumulativeDifficulty = BIGINT_ZERO;
    author.save();

    // update unique authors
    network.cumulativeUniqueAuthors++;
    network.save();
  }
  author.cumulativeBlocksCreated++;
  author.save();

  // create/update daily/hourly metrics
  updateMetrics(blockData, network);
}
