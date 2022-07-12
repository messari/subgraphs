import {
  ethereum,
  arweave,
  cosmos,
  near,
  Bytes,
  BigInt,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { Author, Chunk } from "../generated/schema";
import { BIGINT_ZERO, INT_NINE, INT_ZERO } from "./constants";
import { createBlock, updateMetrics, updateNetwork } from "./helper";
import { exponentToBigDecimal } from "./utils";

/////////////////
//// Classes ////
/////////////////

export class BlockData {
  constructor(
    public readonly height: BigInt,
    public readonly hash: Bytes,
    public readonly timestamp: BigInt,
    public readonly author: Bytes | null,
    public readonly difficulty: BigInt,
    public readonly gasLimit: BigInt,
    public readonly gasUsed: BigInt,
    public readonly size: BigInt,
    public readonly gasPrice: BigInt | null,
    public readonly baseFeePerGas: BigInt,
    public readonly burntFees: BigInt,
    public readonly chunkCount: BigInt,
    public readonly transactionCount: BigInt,
    public readonly rewards: BigInt
  ) {}
}

export class UpdateNetworkData {
  constructor(
    public readonly height: BigInt,
    public readonly timestamp: BigInt,
    public readonly newDifficulty: BigInt,
    public readonly newGasUsed: BigInt,
    public readonly gasLimit: BigInt,
    public readonly newBurntFees: BigInt,
    public readonly newRewards: BigInt,
    public readonly newTransactions: BigInt,
    public readonly newSize: BigInt,
    public readonly totalSupply: BigInt
  ) {}
}

////////////////////////
//// Block Handlers ////
////////////////////////

export function handleArweaveBlock(block: arweave.Block): void {
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
    BIGINT_ZERO // the "rewards" in the blockhandler is a pool of rewards ready to distribute
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
    BIGINT_ZERO,
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
    null,
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
