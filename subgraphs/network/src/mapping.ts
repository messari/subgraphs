import { ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import {
  ActiveAuthor,
  Author,
  Block,
  Blockchain,
  DailySnapshot,
  HourlySnapshot,
} from "../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  BLOCKCHAIN_NAME,
  INITIAL_SUPPLY,
  IntervalType,
  INT_NEGATIVE_ONE,
  INT_TWO,
  INT_ZERO,
  MAX_SUPPLY,
  METHODOLOGY_VERSION,
  NATIVE_TOKEN,
  NATIVE_TOKEN_DECIMALS,
  SCHEMA_VERSION,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SUBGRAPH_VERSION,
} from "./constants";
import { exponentToBigDecimal, getBlocksPerDay } from "./utils";

export function handleBlock(block: ethereum.Block): void {
  let blockEntity = createBlock(block);

  // update blockchain entity
  let blockchain = updateBlockchain(block);

  // update author entity
  let authorId = block.author.toHexString();
  let author = Author.load(authorId);
  if (!author) {
    author = new Author(authorId);
    author.cumulativeBlocksCreated = INT_ZERO;
    author.cumulativeDifficulty = BIGINT_ZERO;
    author.cumulativeRewards = BIGINT_ZERO;
    author.save();

    // update unique authors
    blockchain.cumulativeUniqueAuthors++;
    blockchain.save();
  }
  author.cumulativeBlocksCreated++;
  author.cumulativeDifficulty = author.cumulativeDifficulty.plus(
    block.difficulty
  );
  author.save();

  // create/update daily/hourly metrics
  updateMetrics(block, blockchain);
}

//////////////////
//// Updaters ////
//////////////////

function updateBlockchain(block: ethereum.Block): Blockchain {
  let blockchain = getOrCreateBlockchain(NATIVE_TOKEN);
  blockchain.blockHeight = block.number.toI32();
  blockchain.cumulativeDifficulty = block.totalDifficulty;
  blockchain.cumulativeGasUsed = blockchain.cumulativeGasUsed.plus(
    block.gasUsed
  );
  blockchain.gasLimit = block.gasLimit;
  if (block.baseFeePerGas) {
    blockchain.cumulativeBurntFees = blockchain.cumulativeBurntFees.plus(
      block.baseFeePerGas!.times(block.gasUsed)
    );
  }
  blockchain.blocksPerDay = getBlocksPerDay(block.timestamp, block.number);
  blockchain.save();

  return blockchain;
}

function updateMetrics(block: ethereum.Block, blockchain: Blockchain): void {
  let dailySnapshot = getOrCreateDailySnapshot(block.timestamp);
  let hourlySnapshot = getOrCreateHourlySnapshot(block.timestamp);

  // update snapshots
  updateDailySnapshot(dailySnapshot, block, blockchain);
  updateHourlySnapshot(hourlySnapshot, block, blockchain);
}

function updateDailySnapshot(
  snapshot: DailySnapshot,
  block: ethereum.Block,
  blockchain: Blockchain
): void {
  // update overlapping fields for snapshot
  snapshot.cumulativeUniqueAuthors = blockchain.cumulativeUniqueAuthors;
  snapshot.blockHeight = blockchain.blockHeight;
  snapshot.timestamp = block.timestamp;
  snapshot.blocksPerDay = blockchain.blocksPerDay;
  snapshot.cumulativeDifficulty = blockchain.cumulativeDifficulty;
  snapshot.cumulativeBurntFees = blockchain.cumulativeBurntFees;
  snapshot.cumulativeRewards = blockchain.cumulativeRewards;
  snapshot.supply = blockchain.supply;

  // check for new author
  let id =
    IntervalType.DAILY + "-" + block.author.toHexString() + "-" + snapshot.id;
  let activeAuthor = ActiveAuthor.load(id);
  if (!activeAuthor) {
    activeAuthor = new ActiveAuthor(id);
    activeAuthor.save();
    snapshot.dailyActiveAuthors++;
  }

  // update daily metrics
  snapshot.dailyBlocks++;
  let dailyBlocksBD = BigDecimal.fromString(snapshot.dailyBlocks.toString());

  snapshot.dailyDifficulty = snapshot.dailyDifficulty.plus(block.difficulty);
  snapshot.dailyMeanDifficulty = snapshot.dailyDifficulty
    .toBigDecimal()
    .div(dailyBlocksBD);
  snapshot.dailyCumulativeGasUsed = snapshot.dailyCumulativeGasUsed.plus(
    block.gasUsed
  );
  snapshot.dailyCumulativeGasLimit = snapshot.dailyCumulativeGasLimit.plus(
    block.gasLimit
  );
  snapshot.dailyMeanGasUsed = snapshot.dailyCumulativeGasUsed
    .toBigDecimal()
    .div(dailyBlocksBD);
  snapshot.dailyMeanGasLimit = snapshot.dailyCumulativeGasLimit
    .toBigDecimal()
    .div(dailyBlocksBD);
  if (block.baseFeePerGas) {
    snapshot.dailyBurntFees = snapshot.dailyBurntFees.plus(
      block.baseFeePerGas!.times(block.gasUsed)
    );
  }
  if (block.size) {
    snapshot.dailyCumulativeSize = snapshot.dailyCumulativeSize.plus(
      block.size!
    );
  }
  snapshot.dailyMeanBlockSize = snapshot.dailyCumulativeSize
    .toBigDecimal()
    .div(dailyBlocksBD);

  // calc mean block interval
  // mean = (firstTimestamp - timestamp) / dailyBlocks
  let timestampDiff = snapshot.firstTimestamp.minus(block.timestamp);
  snapshot.dailyMeanBlockInterval = timestampDiff
    .toBigDecimal()
    .div(dailyBlocksBD);

  snapshot.save();
}

function updateHourlySnapshot(
  snapshot: HourlySnapshot,
  block: ethereum.Block,
  blockchain: Blockchain
): void {
  // update overlapping fields for snapshot
  snapshot.cumulativeUniqueAuthors = blockchain.cumulativeUniqueAuthors;
  snapshot.blockHeight = blockchain.blockHeight;
  snapshot.timestamp = block.timestamp;
  snapshot.blocksPerDay = blockchain.blocksPerDay;
  snapshot.cumulativeDifficulty = blockchain.cumulativeDifficulty;
  snapshot.cumulativeBurntFees = blockchain.cumulativeBurntFees;
  snapshot.cumulativeRewards = blockchain.cumulativeRewards;
  snapshot.supply = blockchain.supply;

  // check for new author
  let id =
    IntervalType.HOURLY + "-" + block.author.toHexString() + "-" + snapshot.id;
  let activeAuthor = ActiveAuthor.load(id);
  if (!activeAuthor) {
    activeAuthor = new ActiveAuthor(id);
    activeAuthor.save();
    snapshot.hourlyActiveAuthors++;
  }

  // update hourly metrics
  snapshot.hourlyBlocks++;
  let hourlyBlocksBD = BigDecimal.fromString(snapshot.hourlyBlocks.toString());

  snapshot.hourlyDifficulty = snapshot.hourlyDifficulty.plus(block.difficulty);
  snapshot.hourlyMeanDifficulty = snapshot.hourlyDifficulty
    .toBigDecimal()
    .div(hourlyBlocksBD);
  snapshot.hourlyCumulativeGasUsed = snapshot.hourlyCumulativeGasUsed.plus(
    block.gasUsed
  );
  snapshot.hourlyCumulativeGasLimit = snapshot.hourlyCumulativeGasLimit.plus(
    block.gasLimit
  );
  snapshot.hourlyMeanGasUsed = snapshot.hourlyCumulativeGasUsed
    .toBigDecimal()
    .div(hourlyBlocksBD);
  snapshot.hourlyMeanGasLimit = snapshot.hourlyCumulativeGasLimit
    .toBigDecimal()
    .div(hourlyBlocksBD);
  if (block.baseFeePerGas) {
    snapshot.hourlyBurntFees = snapshot.hourlyBurntFees.plus(
      block.baseFeePerGas!.times(block.gasUsed)
    );
  }
  if (block.size) {
    snapshot.hourlyCumulativeSize = snapshot.hourlyCumulativeSize.plus(
      block.size!
    );
  }
  snapshot.hourlyMeanBlockSize = snapshot.hourlyCumulativeSize
    .toBigDecimal()
    .div(hourlyBlocksBD);

  // calc mean block interval
  // mean = (firstTimestamp - timestamp) / hourlyBlocks
  let timestampDiff = snapshot.firstTimestamp.minus(block.timestamp);
  snapshot.hourlyMeanBlockInterval = timestampDiff
    .toBigDecimal()
    .div(hourlyBlocksBD);

  snapshot.save();
}

/////////////////
//// Getters ////
/////////////////

function getOrCreateDailySnapshot(timestamp: BigInt): DailySnapshot {
  let id = (timestamp.toI64() / SECONDS_PER_DAY).toString();
  let dailySnapshot = DailySnapshot.load(id);
  if (!dailySnapshot) {
    dailySnapshot = new DailySnapshot(id);
    dailySnapshot.blockchain = NATIVE_TOKEN;
    dailySnapshot.cumulativeUniqueAuthors = INT_ZERO;
    dailySnapshot.dailyActiveAuthors = INT_ZERO;
    dailySnapshot.blockHeight = INT_ZERO;
    dailySnapshot.timestamp = timestamp;
    dailySnapshot.dailyBlocks = INT_ZERO;
    dailySnapshot.blocksPerDay = BIGDECIMAL_ZERO;
    dailySnapshot.cumulativeDifficulty = BIGINT_ZERO;
    dailySnapshot.dailyDifficulty = BIGINT_ZERO;
    dailySnapshot.dailyMeanDifficulty = BIGDECIMAL_ZERO;
    dailySnapshot.dailyCumulativeGasUsed = BIGINT_ZERO;
    dailySnapshot.dailyCumulativeGasLimit = BIGINT_ZERO;
    dailySnapshot.dailyMeanGasUsed = BIGDECIMAL_ZERO;
    dailySnapshot.dailyMeanGasLimit = BIGDECIMAL_ZERO;
    dailySnapshot.firstTimestamp = timestamp;
    dailySnapshot.dailyMeanBlockInterval = BIGDECIMAL_ZERO;
    dailySnapshot.dailyCumulativeSize = BIGINT_ZERO;
    dailySnapshot.dailyMeanBlockSize = BIGDECIMAL_ZERO;

    dailySnapshot.save();
  }
  return dailySnapshot;
}

function getOrCreateHourlySnapshot(timestamp: BigInt): HourlySnapshot {
  let id = (timestamp.toI64() / SECONDS_PER_HOUR).toString();
  let hourlySnapshot = HourlySnapshot.load(id);
  if (!hourlySnapshot) {
    hourlySnapshot = new HourlySnapshot(id);
    hourlySnapshot.blockchain = NATIVE_TOKEN;
    hourlySnapshot.cumulativeUniqueAuthors = INT_ZERO;
    hourlySnapshot.hourlyActiveAuthors = INT_ZERO;
    hourlySnapshot.blockHeight = INT_ZERO;
    hourlySnapshot.timestamp = timestamp;
    hourlySnapshot.hourlyBlocks = INT_ZERO;
    hourlySnapshot.blocksPerDay = BIGDECIMAL_ZERO;
    hourlySnapshot.cumulativeDifficulty = BIGINT_ZERO;
    hourlySnapshot.hourlyDifficulty = BIGINT_ZERO;
    hourlySnapshot.hourlyMeanDifficulty = BIGDECIMAL_ZERO;
    hourlySnapshot.hourlyCumulativeGasUsed = BIGINT_ZERO;
    hourlySnapshot.hourlyCumulativeGasLimit = BIGINT_ZERO;
    hourlySnapshot.hourlyMeanGasUsed = BIGDECIMAL_ZERO;
    hourlySnapshot.hourlyMeanGasLimit = BIGDECIMAL_ZERO;
    hourlySnapshot.firstTimestamp = timestamp;
    hourlySnapshot.hourlyMeanBlockInterval = BIGDECIMAL_ZERO;
    hourlySnapshot.hourlyCumulativeSize = BIGINT_ZERO;
    hourlySnapshot.hourlyMeanBlockSize = BIGDECIMAL_ZERO;

    hourlySnapshot.save();
  }
  return hourlySnapshot;
}

function createBlock(block: ethereum.Block): Block {
  let blockEntity = new Block(block.number.toString());

  blockEntity.hash = block.hash.toHexString();
  blockEntity.timestamp = block.timestamp;
  blockEntity.author = block.author.toHexString();
  blockEntity.size = block.size;
  blockEntity.baseFeePerGas = block.baseFeePerGas;
  blockEntity.difficulty = block.difficulty;
  blockEntity.cumulativeDifficulty = block.totalDifficulty;
  blockEntity.gasLimit = block.gasLimit;
  blockEntity.gasUsed = block.gasUsed;
  blockEntity.gasFilledPercentage = block.gasUsed
    .toBigDecimal()
    .div(block.gasLimit.toBigDecimal())
    .times(exponentToBigDecimal(INT_TWO));
  blockEntity.parentHash = block.parentHash.toHexString();
  if (block.baseFeePerGas) {
    blockEntity.burntFees = block.baseFeePerGas!.times(block.gasUsed);
  } else {
    blockEntity.burntFees = BIGINT_ZERO;
  }
  blockEntity.day = (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  blockEntity.hour = (block.timestamp.toI64() / SECONDS_PER_HOUR).toString();
  blockEntity.save();

  return blockEntity;
}

function getOrCreateBlockchain(id: string): Blockchain {
  let blockchain = Blockchain.load(id);
  if (!blockchain) {
    blockchain = new Blockchain(id);
    blockchain.schemaVersion = SCHEMA_VERSION;
    blockchain.subgraphVersion = SUBGRAPH_VERSION;
    blockchain.methodologyVersion = METHODOLOGY_VERSION;
    blockchain.decimals = NATIVE_TOKEN_DECIMALS;
    blockchain.name = BLOCKCHAIN_NAME;
    if (MAX_SUPPLY != BIGINT_ZERO) {
      blockchain.maxSupply = MAX_SUPPLY;
    }
    if (INITIAL_SUPPLY != INT_NEGATIVE_ONE) {
      blockchain.supply = BigInt.fromI32(INITIAL_SUPPLY);
    }
    blockchain.blockHeight = INT_ZERO;
    blockchain.cumulativeDifficulty = BIGINT_ZERO;
    blockchain.cumulativeGasUsed = BIGINT_ZERO;
    blockchain.gasLimit = BIGINT_ZERO;
    blockchain.cumulativeBurntFees = BIGINT_ZERO;
    blockchain.blocksPerDay = BIGDECIMAL_ZERO;

    blockchain.save();
  }
  return blockchain;
}

/////////////////
//// Helpers ////
/////////////////
