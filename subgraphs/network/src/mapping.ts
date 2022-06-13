import {
  ethereum,
  BigInt,
  BigDecimal,
  arweave,
  cosmos,
  near,
} from "@graphprotocol/graph-ts";
import {
  ActiveAuthor,
  Author,
  Block,
  Network,
  DailySnapshot,
  HourlySnapshot,
} from "../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  IntervalType,
  INT_TWO,
  INT_ZERO,
  METHODOLOGY_VERSION,
  NETWORK_NAME,
  SCHEMA_VERSION,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SUBGRAPH_VERSION,
} from "./constants";
import { exponentToBigDecimal, getBlocksPerDay } from "./utils";

///////////////////////
//// Block Handler ////
///////////////////////

export function handleBlock(block: ethereum.Block): void {
  createBlock(block);

  // update network entity
  let network = updateNetwork(block);

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
    network.cumulativeUniqueAuthors++;
    network.save();
  }
  author.cumulativeBlocksCreated++;
  author.cumulativeDifficulty = author.cumulativeDifficulty.plus(
    block.difficulty
  );
  author.save();

  // create/update daily/hourly metrics
  updateMetrics(block, network);
}

//////////////////
//// Updaters ////
//////////////////

function updateNetwork(block: ethereum.Block): Network {
  let network = getOrCreateNetwork(NETWORK_NAME);
  network.blockHeight = block.number.toI32();
  network.cumulativeDifficulty = block.totalDifficulty;
  network.cumulativeGasUsed = network.cumulativeGasUsed.plus(block.gasUsed);
  network.gasLimit = block.gasLimit;
  if (block.baseFeePerGas) {
    network.cumulativeBurntFees = network.cumulativeBurntFees.plus(
      block.baseFeePerGas!.times(block.gasUsed)
    );
  }
  network.blocksPerDay = getBlocksPerDay(block.timestamp, block.number);
  network.save();

  return network;
}

function updateMetrics(block: ethereum.Block, network: Network): void {
  let dailySnapshot = getOrCreateDailySnapshot(block.timestamp);
  let hourlySnapshot = getOrCreateHourlySnapshot(block.timestamp);

  // update snapshots
  updateDailySnapshot(dailySnapshot, block, network);
  updateHourlySnapshot(hourlySnapshot, block, network);
}

function updateDailySnapshot(
  snapshot: DailySnapshot,
  block: ethereum.Block,
  network: Network
): void {
  // update overlapping fields for snapshot
  snapshot.cumulativeUniqueAuthors = network.cumulativeUniqueAuthors;
  snapshot.blockHeight = network.blockHeight;
  snapshot.timestamp = block.timestamp;
  snapshot.blocksPerDay = network.blocksPerDay;
  snapshot.cumulativeDifficulty = network.cumulativeDifficulty;
  snapshot.cumulativeBurntFees = network.cumulativeBurntFees;
  snapshot.cumulativeRewards = network.cumulativeRewards;

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
  // mean = (timestamp - firstTimestamp) / dailyBlocks
  let timestampDiff = block.timestamp.minus(snapshot.firstTimestamp);
  snapshot.dailyMeanBlockInterval = timestampDiff
    .toBigDecimal()
    .div(dailyBlocksBD);

  snapshot.save();
}

function updateHourlySnapshot(
  snapshot: HourlySnapshot,
  block: ethereum.Block,
  network: Network
): void {
  // update overlapping fields for snapshot
  snapshot.cumulativeUniqueAuthors = network.cumulativeUniqueAuthors;
  snapshot.blockHeight = network.blockHeight;
  snapshot.timestamp = block.timestamp;
  snapshot.blocksPerDay = network.blocksPerDay;
  snapshot.cumulativeDifficulty = network.cumulativeDifficulty;
  snapshot.cumulativeBurntFees = network.cumulativeBurntFees;
  snapshot.cumulativeRewards = network.cumulativeRewards;

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
  // mean = (timestamp - firstTimestamp) / hourlyBlocks
  let timestampDiff = block.timestamp.minus(snapshot.firstTimestamp);
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
    dailySnapshot.network = NETWORK_NAME;
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
    dailySnapshot.cumulativeBurntFees = BIGINT_ZERO;
    dailySnapshot.dailyBurntFees = BIGINT_ZERO;
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
    hourlySnapshot.network = NETWORK_NAME;
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
    hourlySnapshot.cumulativeBurntFees = BIGINT_ZERO;
    hourlySnapshot.hourlyBurntFees = BIGINT_ZERO;
    hourlySnapshot.firstTimestamp = timestamp;
    hourlySnapshot.hourlyMeanBlockInterval = BIGDECIMAL_ZERO;
    hourlySnapshot.hourlyCumulativeSize = BIGINT_ZERO;
    hourlySnapshot.hourlyMeanBlockSize = BIGDECIMAL_ZERO;

    hourlySnapshot.save();
  }
  return hourlySnapshot;
}

function createBlock(block: ethereum.Block): void {
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
}

function getOrCreateNetwork(id: string): Network {
  let network = Network.load(id);
  if (!network) {
    network = new Network(id);
    network.schemaVersion = SCHEMA_VERSION;
    network.subgraphVersion = SUBGRAPH_VERSION;
    network.methodologyVersion = METHODOLOGY_VERSION;
    network.cumulativeUniqueAuthors = INT_ZERO;
    network.blockHeight = INT_ZERO;
    network.cumulativeDifficulty = BIGINT_ZERO;
    network.cumulativeGasUsed = BIGINT_ZERO;
    network.gasLimit = BIGINT_ZERO;
    network.cumulativeBurntFees = BIGINT_ZERO;
    network.blocksPerDay = BIGDECIMAL_ZERO;

    network.save();
  }
  return network;
}
