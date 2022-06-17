import {
  ethereum,
  arweave,
  cosmos,
  near,
  log,
  Bytes,
  BigInt,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { Author } from "../generated/schema";
import { BIGINT_ZERO, INT_NINE, INT_ZERO, NETWORK_NAME } from "./constants";
import {
  createBlock,
  getOrCreateNetwork,
  updateMetrics,
  updateNetwork,
} from "./helper";
import { exponentToBigDecimal } from "./utils";

/////////////////
//// Classes ////
/////////////////

export class BlockData {
  height: BigInt;
  hash: Bytes;
  timestamp: BigInt;
  author: Bytes;
  size: BigInt | null;
  baseFeePerGas: BigInt | null;
  difficulty: BigInt | null;
  gasLimit: BigInt | null;
  gasUsed: BigInt | null  ;
  gasPrice: BigInt | null;
  parentHash: Bytes;
  burntFees: BigInt | null;
  chunkCount: BigInt | null;
  transactionCount: BigInt | null;
  rewards: BigInt | null;
  constructor(
    height: BigInt,
    hash: Bytes,
    timestamp: BigInt,
    author: Bytes,
    difficulty: BigInt | null,
    gasLimit: BigInt | null,
    gasUsed: BigInt | null,
    parentHash: Bytes,
    size: BigInt | null,
    gasPrice: BigInt | null,
    baseFeePerGas: BigInt | null,
    burntFees: BigInt | null,
    chunkCount: BigInt | null,
    transactionCount: BigInt | null,
    rewards: BigInt | null
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
    this.parentHash = parentHash;
    this.burntFees = burntFees;
    this.chunkCount = chunkCount;
    this.transactionCount = transactionCount;
    this.rewards = rewards;
  }
}

export class UpdateNetworkData {
  height: BigInt;
  timestamp: BigInt;
  newDifficulty: BigInt | null;
  newGasUsed: BigInt | null;
  gasLimit: BigInt | null;
  newBurntFees: BigInt | null;
  newRewards: BigInt | null;
  newTransactions: BigInt | null;
  newSize: BigInt | null;
  totalSupply: BigInt | null;

  constructor(
    height: BigInt,
    timestamp: BigInt,
    newDifficulty: BigInt | null,
    newGasUsed: BigInt | null,
    gasLimit: BigInt | null,
    newBurntFees: BigInt | null,
    newRewards: BigInt | null,
    newTransactions: BigInt | null,
    newSize: BigInt | null,
    totalSupply: BigInt | null
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
  let blockData = new BlockData(
    BigInt.fromI64(block.height), // TODO
    block.hash,
    block.timestamp,
    block.author,
    block.difficulty,
    block.gasLimit,
    block.gasUsed,
    block.parentHash,
    block.size,
    null,
    block.baseFeePerGas,
    burntFees,
    null,
    null,
    null
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
    null,
    null,
    block.size,
    null
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

export function handleCosmosBlock(block: cosmos.Block): void {
  let header = block.header;

  let blockData = new BlockData(
    BigInt.fromI64(header.height),
    header.hash,
    BigInt.fromI64(header.time.seconds),
    header.validatorsHash,
    null,
    null,
    null,
    header.lastCommitHash,
    null,
    null,
    null,
    null,
    null,
    BigInt.fromI32(block.transactions.length),
    null
  );
  createBlock(blockData);

  // update network entity
  let updateNetworkData = new UpdateNetworkData(
    BigInt.fromI64(header.height),
    BigInt.fromI64(header.time.seconds),
    null,
    null,
    null,
    null,
    null,
    BigInt.fromI32(block.transactions.length),
    null,
    null
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
    ? block.baseFeePerGas.times(block.gasUsed)
    : null;

  let blockData = new BlockData(
    block.number,
    block.hash,
    block.timestamp,
    block.author,
    block.difficulty,
    block.gasLimit,
    block.gasUsed,
    block.parentHash,
    block.size,
    null,
    block.baseFeePerGas,
    burntFees,
    null,
    null,
    null
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
    null,
    null,
    block.size,
    null
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
  let timestampBD = header.timestampNanosec.toBigDecimal().div(exponentToBigDecimal(INT_NINE));
  let timestamp = BigInt.fromString(timestampBD.truncate(0).toString());

  // add up gasLimit / gasUsed / burntFees
  let gasLimit = BIGINT_ZERO;
  let gasUsed = BIGINT_ZERO;
  let burntFees = BIGINT_ZERO;
  for (let chunk of chunks) {
    gasLimit = gasLimit.plus(chunk.gasLimit);
    gasUsed = gasUsed.plus(chunk.gasUsed);
    burntFees = burntFees.plus(chunk.balanceBurnt);
  }

  let blockData = new BlockData(
    BigInt.fromI64(header.height),
    header.hash,
    timestamp,
    Bytes.fromHexString(block.author),
    null,
    gasLimit,
    gasUsed,
    header.prevHash,
    null,
    header.gasPrice,
    null,
    burntFees,
    BigInt.fromI32(chunks.length),
    null,
    null
  );
  createBlock(blockData);

  // update network entity
  let updateNetworkData = new UpdateNetworkData(
    BigInt.fromI64(header.height),
    timestamp,
    null,
    gasUsed,
    gasLimit,
    burntFees,
    null,
    null,
    null,
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
