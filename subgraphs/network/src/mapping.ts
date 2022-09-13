import {
  ethereum,
  arweave,
  cosmos,
  near,
  Bytes,
  BigInt,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import { Chunk } from "../generated/schema";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  INT_NINE,
  NETWORK_NAME,
  SubgraphNetwork,
} from "./constants";
import {
  createBlock,
  updateAuthors,
  updateMetrics,
  updateNetwork,
} from "./helper";
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
    public readonly difficulty: BigInt | null,
    public readonly gasLimit: BigInt | null,
    public readonly gasUsed: BigInt | null,
    public readonly size: BigInt | null,
    public readonly gasPrice: BigInt | null,
    public readonly baseFeePerGas: BigInt | null,
    public readonly burntFees: BigInt | null,
    public readonly chunkCount: BigInt | null,
    public readonly transactionCount: BigInt | null,
    public readonly rewards: BigInt | null,
    public readonly newSupply: BigInt | null
  ) {}
}

export class UpdateNetworkData {
  constructor(
    public readonly height: BigInt,
    public readonly timestamp: BigInt,
    public readonly newDifficulty: BigInt | null,
    public readonly newGasUsed: BigInt | null,
    public readonly gasLimit: BigInt | null,
    public readonly newBurntFees: BigInt | null,
    public readonly newRewards: BigInt | null,
    public readonly newTransactions: BigInt | null,
    public readonly newSize: BigInt | null,
    public readonly totalSupply: BigInt | null
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
    null,
    null,
    blockSize,
    null,
    null,
    null,
    null,
    BigInt.fromI32(block.txs.length),
    null, // the "rewards" in the blockhandler is a pool of rewards ready to distribute
    null
  );
  createBlock(blockData);

  // update network entity
  let updateNetworkData = new UpdateNetworkData(
    BigInt.fromI64(block.height),
    BigInt.fromI64(block.timestamp),
    blockDifficulty,
    null,
    null,
    null,
    null,
    BigInt.fromI32(block.txs.length),
    blockSize,
    null
  );
  let network = updateNetwork(updateNetworkData);

  // update author entity
  updateAuthors(block.rewardAddr, network, blockDifficulty);

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
    null,
    null,
    null,
    null,
    null,
    BigInt.fromI32(block.transactions.length),
    null,
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
  updateAuthors(header.validatorsHash, network, null);

  // create/update daily/hourly metrics
  updateMetrics(blockData, network);
}

export function handleEvmBlock(block: ethereum.Block): void {
  let burntFees = block.baseFeePerGas
    ? block.baseFeePerGas!.times(block.gasUsed)
    : null;

  let blockData = new BlockData(
    block.number,
    block.hash,
    block.timestamp,
    block.author,
    block.difficulty,
    block.gasLimit,
    block.gasUsed,
    block.size,
    null,
    block.baseFeePerGas,
    burntFees,
    null,
    NETWORK_NAME == SubgraphNetwork.OPTIMISM ? BIGINT_ONE : null, // optimism "blocks" are actually transactions
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
  updateAuthors(block.author, network, block.difficulty);

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
    chunk.chunkUtilization = chunk
      .gasUsed!.toBigDecimal()
      .div(chunk.gasLimit!.toBigDecimal());
    chunk.save();

    gasLimit = gasLimit.plus(chunk.gasLimit!);
    gasUsed = gasUsed.plus(chunk.gasUsed!);
    burntFees = burntFees.plus(chunk.burntFees!);
  }

  let blockData = new BlockData(
    BigInt.fromI64(header.height),
    header.hash,
    timestamp,
    Bytes.fromHexString(block.author),
    null,
    gasLimit,
    gasUsed,
    null,
    header.gasPrice,
    null,
    burntFees,
    BigInt.fromI32(chunks.length),
    null,
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
  updateAuthors(Bytes.fromHexString(block.author), network, null);

  // create/update daily/hourly metrics
  updateMetrics(blockData, network);
}
