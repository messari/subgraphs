import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  ActiveAuthor,
  Block,
  DailySnapshot,
  HourlySnapshot,
  Network,
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
import { BlockData, UpdateNetworkData } from "./mapping";
import { exponentToBigDecimal, getBlocksPerDay } from "./utils";

//////////////////
//// Updaters ////
//////////////////

export function updateNetwork(networkData: UpdateNetworkData): Network {
  let network = getOrCreateNetwork(NETWORK_NAME);
  network.blockHeight = networkData.height.toI32();
  network.cumulativeDifficulty = network.cumulativeDifficulty.plus(
    networkData.newDifficulty
  );
  network.cumulativeGasUsed = network.cumulativeGasUsed.plus(
    networkData.newGasUsed
  );
  network.gasLimit = networkData.gasLimit;
  network.cumulativeBurntFees = networkData.newBurntFees
    ? network.cumulativeBurntFees.plus(networkData.newBurntFees)
    : network.cumulativeBurntFees;
  network.cumulativeRewards = networkData.newRewards
    ? network.cumulativeRewards.plus(networkData.newRewards)
    : network.cumulativeRewards;
  network.cumulativeTransactions = networkData.newTransactions
    ? network.cumulativeTransactions.plus(networkData.newTransactions.toI32())
    : network.cumulativeTransactions;
  network.cumulativeSize = networkData.newSize
    ? network.cumulativeSize.plus(networkData.newSize.toI32())
    : network.cumulativeSize;
  network.totalSupply = networkData.totalSupply
    ? networkData.totalSupply
    : network.totalSupply;

  network.blocksPerDay = getBlocksPerDay(
    networkData.height,
    networkData.timestamp
  );

  network.save();
  return network;
}

// update snapshots
export function updateMetrics(blockData: BlockData, network: Network): void {
  updateDailySnapshot(blockData, network);
  updateHourlySnapshot(blockData, network);
}

function updateDailySnapshot(blockData: BlockData, network: Network): void {
  let snapshot = getOrCreateDailySnapshot(blockData.timestamp);

  // update overlapping fields for snapshot
  snapshot.cumulativeUniqueAuthors = network.cumulativeUniqueAuthors;
  snapshot.blockHeight = network.blockHeight;
  snapshot.timestamp = blockData.timestamp;
  snapshot.cumulativeDifficulty = network.cumulativeDifficulty;
  snapshot.cumulativeBurntFees = network.cumulativeBurntFees;
  snapshot.cumulativeRewards = network.cumulativeRewards;

  // check for new author
  let id =
    IntervalType.DAILY +
    "-" +
    blockData.author.toHexString() +
    "-" +
    snapshot.id;
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

function updateHourlySnapshot(blockData: BlockData, network: Network): void {
  let snapshot = getOrCreateHourlySnapshot(blockData.timestamp);

  // update overlapping fields for snapshot
  snapshot.cumulativeUniqueAuthors = network.cumulativeUniqueAuthors;
  snapshot.blockHeight = network.blockHeight;
  snapshot.timestamp = blockData.timestamp;
  snapshot.cumulativeDifficulty = network.cumulativeDifficulty;
  snapshot.cumulativeBurntFees = network.cumulativeBurntFees;
  snapshot.cumulativeRewards = network.cumulativeRewards;

  // check for new author
  let id =
    IntervalType.HOURLY +
    "-" +
    blockData.author.toHexString() +
    "-" +
    snapshot.id;
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
    dailySnapshot.cumulativeDifficulty = BIGINT_ZERO;
    dailySnapshot.dailyDifficulty = BIGINT_ZERO;
    dailySnapshot.dailyMeanDifficulty = BIGDECIMAL_ZERO;
    dailySnapshot.dailyCumulativeGasUsed = BIGINT_ZERO;
    dailySnapshot.dailyCumulativeGasLimit = BIGINT_ZERO;
    dailySnapshot.dailyBlockUtilization = BIGDECIMAL_ZERO;
    dailySnapshot.dailyMeanGasUsed = BIGDECIMAL_ZERO;
    dailySnapshot.dailyMeanGasLimit = BIGDECIMAL_ZERO;
    dailySnapshot.gasPrice = BIGDECIMAL_ZERO;
    dailySnapshot.cumulativeBurntFees = BIGINT_ZERO;
    dailySnapshot.dailyBurntFees = BIGINT_ZERO;
    dailySnapshot.dailyRewards = BIGINT_ZERO;
    dailySnapshot.cumulativeRewards = BIGINT_ZERO;
    dailySnapshot.dailyMeanRewards = BIGDECIMAL_ZERO;
    dailySnapshot.totalSupply = BIGINT_ZERO;
    dailySnapshot.dailySupplyIncrease = BIGINT_ZERO;
    dailySnapshot.firstTimestamp = timestamp;
    dailySnapshot.dailyMeanBlockInterval = BIGDECIMAL_ZERO;
    dailySnapshot.dailyCumulativeSize = BIGINT_ZERO;
    dailySnapshot.dailyMeanBlockSize = BIGDECIMAL_ZERO;
    dailySnapshot.dailyChunkCount = INT_ZERO;
    dailySnapshot.dailyTransactionCount = INT_ZERO;

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
    hourlySnapshot.cumulativeDifficulty = BIGINT_ZERO;
    hourlySnapshot.hourlyDifficulty = BIGINT_ZERO;
    hourlySnapshot.hourlyMeanDifficulty = BIGDECIMAL_ZERO;
    hourlySnapshot.hourlyCumulativeGasUsed = BIGINT_ZERO;
    hourlySnapshot.hourlyCumulativeGasLimit = BIGINT_ZERO;
    hourlySnapshot.hourlyBlockUtilization = BIGDECIMAL_ZERO;
    hourlySnapshot.hourlyMeanGasUsed = BIGDECIMAL_ZERO;
    hourlySnapshot.hourlyMeanGasLimit = BIGDECIMAL_ZERO;
    hourlySnapshot.gasPrice = BIGDECIMAL_ZERO;
    hourlySnapshot.cumulativeBurntFees = BIGINT_ZERO;
    hourlySnapshot.hourlyBurntFees = BIGINT_ZERO;
    hourlySnapshot.hourlyRewards = BIGINT_ZERO;
    hourlySnapshot.cumulativeRewards = BIGINT_ZERO;
    hourlySnapshot.hourlyMeanRewards = BIGDECIMAL_ZERO;
    hourlySnapshot.totalSupply = BIGINT_ZERO;
    hourlySnapshot.hourlySupplyIncrease = BIGINT_ZERO;
    hourlySnapshot.firstTimestamp = timestamp;
    hourlySnapshot.hourlyMeanBlockInterval = BIGDECIMAL_ZERO;
    hourlySnapshot.hourlyCumulativeSize = BIGINT_ZERO;
    hourlySnapshot.hourlyMeanBlockSize = BIGDECIMAL_ZERO;
    hourlySnapshot.hourlyChunkCount = INT_ZERO;
    hourlySnapshot.hourlyTransactionCount = INT_ZERO;

    hourlySnapshot.save();
  }
  return hourlySnapshot;
}

export function createBlock(blockData: BlockData): void {
  let block = new Block(blockData.height.toString());

  block.hash = blockData.hash;
  block.timestamp = blockData.timestamp;
  block.author = blockData.author;
  block.size = blockData.size;
  block.baseFeePerGas = blockData.baseFeePerGas;
  block.difficulty = blockData.difficulty;
  block.gasLimit = blockData.gasLimit;
  block.gasUsed = blockData.gasUsed;
  block.parentHash = blockData.parentHash;
  block.burntFees = blockData.burntFees;
  block.chunkCount = blockData.chunkCount?.toI32();
  block.transactionCount = blockData.transactionCount?.toI32();
  block.rewards = blockData.rewards;

  if (block.gasLimit && block.gasLimit != BIGINT_ZERO) {
    block.blockUtilization = block.gasUsed
      .toBigDecimal()
      .div(block.gasLimit.toBigDecimal())
      .times(exponentToBigDecimal(INT_TWO));
  } else {
    block.blockUtilization = BIGDECIMAL_ZERO;
  }

  block.save();
}

export function getOrCreateNetwork(id: string): Network {
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
    network.cumulativeRewards = BIGINT_ZERO;
    network.cumulativeTransactions = INT_ZERO;
    network.cumulativeSize = BIGINT_ZERO;
    network.totalSupply = BIGINT_ZERO;
    network.blocksPerDay = BIGDECIMAL_ZERO;

    network.save();
  }
  return network;
}
