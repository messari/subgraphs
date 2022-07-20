import { BigDecimal, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  ActiveAuthor,
  Author,
  Block,
  DailySnapshot,
  HourlySnapshot,
  Network,
  STATS,
} from "../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  BIGINT_ONE,
  DataType,
  IntervalType,
  INT_TWO,
  INT_ZERO,
  METHODOLOGY_VERSION,
  NETWORK_NAME,
  SCHEMA_VERSION,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SUBGRAPH_VERSION,
  BIGDECIMAL_TWO,
  BIGINT_MAX,
} from "./constants";
import { BlockData, UpdateNetworkData } from "./mapping";
import { exponentToBigDecimal, getBlocksPerDay } from "./utils";

//////////////////
//// Updaters ////
//////////////////

export function updateNetwork(networkData: UpdateNetworkData): Network {
  let network = getOrCreateNetwork(NETWORK_NAME);
  network.blockHeight = networkData.height.toI32();
  if (networkData.newDifficulty) {
    if (!network.cumulativeDifficulty) {
      network.cumulativeDifficulty = BIGINT_ZERO;
    }
    network.cumulativeDifficulty = network.cumulativeDifficulty!.plus(
      networkData.newDifficulty!
    );
  }
  if (networkData.newGasUsed) {
    if (!network.cumulativeGasUsed) {
      network.cumulativeGasUsed = BIGINT_ZERO;
    }
    network.cumulativeGasUsed = network.cumulativeGasUsed!.plus(
      networkData.newGasUsed!
    );
  }
  network.gasLimit = networkData.gasLimit;
  if (networkData.newBurntFees) {
    if (!network.cumulativeBurntFees) {
      network.cumulativeBurntFees = BIGINT_ZERO;
    }
    network.cumulativeBurntFees = network.cumulativeBurntFees!.plus(
      networkData.newBurntFees!
    );
  }
  if (networkData.newRewards) {
    if (!network.cumulativeRewards) {
      network.cumulativeRewards = BIGINT_ZERO;
    }
    network.cumulativeRewards = network.cumulativeRewards!.plus(
      networkData.newRewards!
    );
  }
  if (networkData.newTransactions) {
    if (!network.cumulativeTransactions) {
      network.cumulativeTransactions = BIGINT_ZERO;
    }
    network.cumulativeTransactions = network.cumulativeTransactions!.plus(
      networkData.newTransactions!
    );
  }
  if (networkData.newSize) {
    if (!network.cumulativeSize) {
      network.cumulativeSize = BIGINT_ZERO;
    }
    network.cumulativeSize = network.cumulativeSize!.plus(networkData.newSize!);
  }
  network.totalSupply = networkData.totalSupply;

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
  // updateHourlySnapshot(blockData, network);
}

function updateDailySnapshot(blockData: BlockData, network: Network): void {
  let snapshotId = (blockData.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let snapshot = getOrCreateDailySnapshot(blockData.timestamp);

  // grab block interval before updating timestamp
  let blockInterval = blockData.timestamp.minus(snapshot.timestamp);

  // update overlapping fields for snapshot
  snapshot.blockHeight = network.blockHeight;
  snapshot.dailyBlocks++;
  snapshot.timestamp = blockData.timestamp;

  // update statistical analysis fields
  snapshot.cumulativeUniqueAuthors = network.cumulativeUniqueAuthors;
  if (blockData.author) {
    // check for new hourly authors
    let id =
      IntervalType.DAILY +
      "-" +
      blockData.author!.toHexString() +
      "-" +
      snapshot.id;
    let activeAuthor = ActiveAuthor.load(id);
    if (!activeAuthor) {
      activeAuthor = new ActiveAuthor(id);
      activeAuthor.save();

      snapshot.dailyUniqueAuthors = updateStats(
        snapshotId,
        DataType.AUTHORS,
        BIGINT_ONE
      ); // TODO: check for new daily author
    }
  }

  snapshot.cumulativeDifficulty = network.cumulativeDifficulty;
  if (blockData.difficulty) {
    snapshot.dailyDifficulty = updateStats(
      snapshotId,
      DataType.DIFFICULTY,
      blockData.difficulty!
    );
  }

  snapshot.cumulativeGasUsed = network.cumulativeGasUsed;
  if (blockData.gasUsed) {
    snapshot.dailyGasUsed = updateStats(
      snapshotId,
      DataType.GAS_USED,
      blockData.gasUsed!
    );
  }

  snapshot.cumulativeBurntFees = network.cumulativeBurntFees;
  if (blockData.burntFees) {
    snapshot.dailyBurntFees = updateStats(
      snapshotId,
      DataType.BURNT_FEES,
      blockData.burntFees!
    );
  }

  snapshot.cumulativeRewards = network.cumulativeRewards;
  if (blockData.rewards) {
    snapshot.dailyRewards = updateStats(
      snapshotId,
      DataType.REWARDS,
      blockData.rewards!
    );
  }

  snapshot.cumulativeSize = network.cumulativeSize;
  if (blockData.size) {
    snapshot.dailySize = updateStats(
      snapshotId,
      DataType.SIZE,
      blockData.size!
    );
  }

  if (blockData.chunkCount) {
    snapshot.dailyChunks = updateStats(
      snapshotId,
      DataType.CHUNKS,
      blockData.chunkCount!
    );
  }

  snapshot.totalSupply = network.totalSupply;
  if (blockData.newSupply) {
    snapshot.dailySupply = updateStats(
      snapshotId,
      DataType.SUPPLY,
      blockData.newSupply!
    );
  }

  snapshot.cumulativeTransactions = network.cumulativeTransactions;
  if (blockData.transactionCount) {
    snapshot.dailyTransactions = updateStats(
      snapshotId,
      DataType.TRANSACTIONS,
      blockData.transactionCount!
    );
  }

  snapshot.dailyBlockInterval = updateStats(
    snapshotId,
    DataType.BLOCK_INTERVAL,
    blockInterval
  );

  snapshot.gasPrice = blockData.gasPrice;
  if (blockData.gasPrice) {
    snapshot.dailyGasPrice = updateStats(
      snapshotId,
      DataType.GAS_PRICE,
      blockData.gasPrice!
    );
  }

  snapshot.save();
}

// function updateHourlySnapshot(blockData: BlockData, network: Network): void {
//   let snapshot = getOrCreateHourlySnapshot(
//     blockData.timestamp,
//     network.totalSupply
//   );

//   // update overlapping fields for snapshot
//   snapshot.cumulativeUniqueAuthors = network.cumulativeUniqueAuthors;
//   snapshot.blockHeight = network.blockHeight;
//   snapshot.timestamp = blockData.timestamp;
//   snapshot.cumulativeDifficulty = network.cumulativeDifficulty;
//   snapshot.cumulativeBurntFees = network.cumulativeBurntFees;
//   snapshot.cumulativeRewards = network.cumulativeRewards;
//   snapshot.cumulativeBurntFees = network.cumulativeBurntFees;
//   snapshot.cumulativeRewards = network.cumulativeRewards;
//   snapshot.totalSupply = network.totalSupply;
//   snapshot.cumulativeSize = network.cumulativeSize;
//   snapshot.gasPrice = blockData.gasPrice ? blockData.gasPrice : BIGINT_ZERO;

//   // check for new hourly authors
//   let id =
//     IntervalType.HOURLY +
//     "-" +
//     blockData.author.toHexString() +
//     "-" +
//     snapshot.id;
//   let activeAuthor = ActiveAuthor.load(id);
//   if (!activeAuthor) {
//     activeAuthor = new ActiveAuthor(id);
//     activeAuthor.save();
//     snapshot.hourlyActiveAuthors++;
//   }

//   // update hourly metrics
//   snapshot.hourlyBlocks++;
//   let hourlyBlocksBD = BigDecimal.fromString(snapshot.hourlyBlocks.toString());

//   snapshot.hourlyDifficulty = snapshot.hourlyDifficulty.plus(
//     blockData.difficulty
//   );
//   snapshot.hourlyMeanDifficulty = snapshot.hourlyDifficulty
//     .toBigDecimal()
//     .div(hourlyBlocksBD);
//   snapshot.hourlyCumulativeGasUsed = snapshot.hourlyCumulativeGasUsed.plus(
//     blockData.gasUsed
//   );
//   snapshot.hourlyCumulativeGasLimit = snapshot.hourlyCumulativeGasLimit.plus(
//     blockData.gasLimit
//   );
//   snapshot.hourlyMeanGasUsed = snapshot.hourlyCumulativeGasUsed
//     .toBigDecimal()
//     .div(hourlyBlocksBD);
//   snapshot.hourlyMeanGasLimit = snapshot.hourlyCumulativeGasLimit
//     .toBigDecimal()
//     .div(hourlyBlocksBD);
//   snapshot.hourlyBurntFees = snapshot.hourlyBurntFees.plus(blockData.burntFees);
//   snapshot.hourlyRewards = snapshot.hourlyRewards.plus(blockData.rewards);
//   snapshot.hourlyMeanRewards = snapshot.hourlyRewards
//     .toBigDecimal()
//     .div(hourlyBlocksBD);
//   snapshot.hourlyMeanBlockSize = snapshot.hourlyCumulativeSize
//     .toBigDecimal()
//     .div(hourlyBlocksBD);
//   snapshot.hourlyCumulativeSize = snapshot.hourlyCumulativeSize.plus(
//     blockData.size
//   );
//   snapshot.hourlyMeanBlockSize = snapshot.hourlyCumulativeSize
//     .toBigDecimal()
//     .div(hourlyBlocksBD);
//   snapshot.hourlyChunkCount += blockData.chunkCount.toI32();
//   snapshot.hourlyTransactionCount += blockData.transactionCount.toI32();

//   if (snapshot.hourlyCumulativeGasLimit != BIGINT_ZERO) {
//     snapshot.hourlyBlockUtilization = snapshot.hourlyCumulativeGasUsed
//       .toBigDecimal()
//       .div(snapshot.hourlyCumulativeGasLimit.toBigDecimal())
//       .times(exponentToBigDecimal(INT_TWO));
//   } else {
//     snapshot.hourlyBlockUtilization = BIGDECIMAL_ZERO;
//   }

//   if (network.totalSupply != BIGINT_ZERO) {
//     // calculate new supply emitted this block
//     let newSupply = network.totalSupply.minus(snapshot.firstSupply);
//     snapshot.hourlySupplyIncrease = newSupply;
//   }

//   // calculate mean block interval
//   // mean = (timestamp - firstTimestamp) / hourlyBlocks
//   let timestampDiff = blockData.timestamp.minus(snapshot.firstTimestamp);
//   snapshot.hourlyMeanBlockInterval = timestampDiff
//     .toBigDecimal()
//     .div(hourlyBlocksBD);

//   snapshot.save();

//   snapshot.save();
// }

export function updateAuthors(
  authorId: Bytes,
  network: Network,
  difficulty: BigInt | null
): void {
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
  if (difficulty) {
    if (!author.cumulativeDifficulty) {
      author.cumulativeDifficulty = BIGINT_ZERO;
    }
    author.cumulativeDifficulty = author.cumulativeDifficulty!.plus(difficulty);
  }
  author.save();
}

//
// Update STATS entity and return the id
// calculate the variance, q1, q3 once the daily/hourly snapshot is done
function updateStats(id: string, dataType: string, value: BigInt): string {
  let stats = getOrCreateStats(id, dataType);

  // basic fields
  stats.count++;
  stats.sum = stats.sum.plus(value);

  // max/min
  stats.max = value.gt(stats.max) ? value : stats.max;
  stats.min = value.lt(stats.min) ? value : stats.min;

  // update mean / median
  stats.values = insertInOrder(value, stats.values);
  stats.mean = stats.sum
    .toBigDecimal()
    .div(BigDecimal.fromString(stats.count.toString()));
  stats.median = getMedian(stats.values);

  stats.save();
  return stats.id;
}

//
// insert value into array and keep numerical order
// Algo: quicksort modification
// Runtime: cannot be specified (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
function insertInOrder(value: BigInt, array: BigInt[]): BigInt[] {
  array.push(value);
  return array.sort();
}

function getMedian(list: BigInt[]): BigDecimal {
  // base case - error catching
  if (list.length == 0) {
    return BIGDECIMAL_ZERO;
  }
  if (list.length == 1) {
    return list[0].toBigDecimal();
  }
  if (list.length == 2) {
    return list[0].plus(list[1]).toBigDecimal().div(BIGDECIMAL_TWO);
  }

  if (list.length % 2 == 1) {
    // list length is odd
    let index = (list.length - 1) / 2;
    return list[index].toBigDecimal();
  } else {
    // list length is even
    let index1 = list.length / 2;
    let index2 = index1 + 1;
    let sum = list[index1].toBigDecimal().plus(list[index2].toBigDecimal());
    return sum.div(BIGDECIMAL_TWO);
  }
}

//
//
// update the previous snapshots statistical data
function updatePreviousSnapshot(snapshot: DailySnapshot): void {
  let network = getOrCreateNetwork(NETWORK_NAME);

  // update network dailyBlock stats
  updateStats(
    network.id,
    DataType.BLOCKS,
    BigInt.fromI32(snapshot.dailyBlocks)
  );
  updateStatisicalData(getOrCreateStats(network.id, DataType.BLOCKS));

  // calculate var, q1, and q3 for prev snapshots
  if (snapshot.dailyUniqueAuthors) {
    updateStatisicalData(getOrCreateStats(snapshot.id, DataType.AUTHORS));
  }
  if (snapshot.dailyDifficulty) {
    updateStatisicalData(getOrCreateStats(snapshot.id, DataType.DIFFICULTY));
  }
  if (snapshot.dailyGasUsed) {
    updateStatisicalData(getOrCreateStats(snapshot.id, DataType.GAS_USED));
  }
  if (snapshot.dailyGasLimit) {
    updateStatisicalData(getOrCreateStats(snapshot.id, DataType.GAS_LIMIT));
  }
  if (snapshot.dailyBurntFees) {
    updateStatisicalData(getOrCreateStats(snapshot.id, DataType.BURNT_FEES));
  }
  if (snapshot.dailyRewards) {
    updateStatisicalData(getOrCreateStats(snapshot.id, DataType.REWARDS));
  }
  if (snapshot.dailySize) {
    updateStatisicalData(getOrCreateStats(snapshot.id, DataType.SIZE));
  }
  if (snapshot.dailyChunks) {
    updateStatisicalData(getOrCreateStats(snapshot.id, DataType.CHUNKS));
  }
  if (snapshot.dailySupply) {
    updateStatisicalData(getOrCreateStats(snapshot.id, DataType.SUPPLY));
  }
  if (snapshot.dailyTransactions) {
    updateStatisicalData(getOrCreateStats(snapshot.id, DataType.TRANSACTIONS));
  }
  if (snapshot.dailyGasPrice) {
    updateStatisicalData(getOrCreateStats(snapshot.id, DataType.GAS_PRICE));
  }
}

//
//
// This function updates a snapshots variance, q1, and q3
function updateStatisicalData(statsEntity: STATS): void {
  // find variance
  statsEntity.variance = findVariance(statsEntity.mean, statsEntity.values);

  // find first and second half arrays
  let firstHalf: BigInt[];
  let secondHalf: BigInt[];
  let middleIndex = Math.round(statsEntity.values.length / 2) as i32;

  if (statsEntity.values.length % 2 == 1) {
    // list length is odd
    firstHalf = statsEntity.values.slice(0, middleIndex - 2);
    secondHalf = statsEntity.values.slice(middleIndex);
  } else {
    // list length is even
    firstHalf = statsEntity.values.slice(0, middleIndex - 1);
    secondHalf = statsEntity.values.slice(middleIndex);
  }

  statsEntity.q1 = getMedian(firstHalf);
  statsEntity.q3 = getMedian(secondHalf);
  statsEntity.save();
}

//
//
// Finds the variance of a list of numbers with the mean already supplied
// Variance = Sum( (x - mean)^2 ) / N
function findVariance(mean: BigDecimal, values: BigInt[]): BigDecimal {
  let sumOfDeviationSquared = BIGDECIMAL_ZERO;

  for (let i = 0; i < values.length; i++) {
    let value = values[i].toBigDecimal();
    let deviation = value.minus(mean);
    let deviationSquared = deviation.times(deviation);
    sumOfDeviationSquared = sumOfDeviationSquared.plus(deviationSquared);
  }

  return sumOfDeviationSquared.div(
    BigDecimal.fromString(values.length.toString())
  );
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
    dailySnapshot.blockHeight = INT_ZERO;
    dailySnapshot.dailyBlocks = INT_ZERO;
    dailySnapshot.timestamp = timestamp;
    dailySnapshot.cumulativeUniqueAuthors = INT_ZERO;

    dailySnapshot.save();

    // update variance, q1, q3 of previous snapshot
    // update dailyBlocks stats in network
    // we know that the previous snapshot exists because we are handling every block
    let previousSnapshotId = (
      timestamp.toI64() -
      SECONDS_PER_DAY -
      1
    ).toString();
    let previousSnapshot = DailySnapshot.load(previousSnapshotId);
    if (!previousSnapshot) {
      log.warning(
        "[getOrCreateDailySnapshot] previous snapshot not found at timestamp: {}",
        [timestamp.toString()]
      );
    } else {
      // snapshot exists
      updatePreviousSnapshot(previousSnapshot);
    }
  }
  return dailySnapshot;
}

function getOrCreateHourlySnapshot(
  timestamp: BigInt,
  originalSupply: BigInt
): HourlySnapshot {
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
    hourlySnapshot.gasPrice = BIGINT_ZERO;
    hourlySnapshot.cumulativeBurntFees = BIGINT_ZERO;
    hourlySnapshot.hourlyBurntFees = BIGINT_ZERO;
    hourlySnapshot.hourlyRewards = BIGINT_ZERO;
    hourlySnapshot.cumulativeRewards = BIGINT_ZERO;
    hourlySnapshot.hourlyMeanRewards = BIGDECIMAL_ZERO;
    hourlySnapshot.totalSupply = BIGINT_ZERO;
    hourlySnapshot.hourlySupplyIncrease = BIGINT_ZERO;
    hourlySnapshot.firstTimestamp = timestamp;
    hourlySnapshot.hourlyMeanBlockInterval = BIGDECIMAL_ZERO;
    hourlySnapshot.cumulativeSize = BIGINT_ZERO;
    hourlySnapshot.hourlyCumulativeSize = BIGINT_ZERO;
    hourlySnapshot.hourlyMeanBlockSize = BIGDECIMAL_ZERO;
    hourlySnapshot.hourlyChunkCount = INT_ZERO;
    hourlySnapshot.hourlyTransactionCount = INT_ZERO;
    hourlySnapshot.firstSupply = originalSupply;

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
  block.gasPrice = blockData.gasPrice;
  block.burntFees = blockData.burntFees;
  block.chunkCount = blockData.chunkCount;
  block.transactionCount = blockData.transactionCount;
  block.rewards = blockData.rewards;

  if (block.gasLimit && block.gasLimit != BIGINT_ZERO && block.gasUsed) {
    block.blockUtilization = block
      .gasUsed!.toBigDecimal()
      .div(block.gasLimit!.toBigDecimal())
      .times(exponentToBigDecimal(INT_TWO));
  } else {
    block.blockUtilization = BIGDECIMAL_ZERO;
  }

  block.save();
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
    network.blocksPerDay = BIGDECIMAL_ZERO;
    network.dailyBlocks = getOrCreateStats(id, DataType.BLOCKS).id;

    network.save();
  }
  return network;
}

function getOrCreateStats(snapshot: string, dataType: string): STATS {
  let id = snapshot.concat("-").concat(dataType);
  let stats = STATS.load(id);
  if (!stats) {
    stats = new STATS(id);
    stats.count = INT_ZERO;
    stats.mean = BIGDECIMAL_ZERO;
    stats.median = BIGDECIMAL_ZERO;
    stats.max = BIGINT_ZERO;
    stats.min = BIGINT_MAX;
    stats.variance = BIGDECIMAL_ZERO;
    stats.q3 = BIGDECIMAL_ZERO;
    stats.q1 = BIGDECIMAL_ZERO;
    stats.values = [];
    stats.sum = BIGINT_ZERO;
    stats.save();
  }

  return stats;
}
