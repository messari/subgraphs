import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
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
      network.cumulativeTransactions = INT_ZERO;
    }
    network.cumulativeTransactions += networkData.newTransactions!.toI32();
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

  // TODO: update variance and quartiles at the end of a snapshot (howto)
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
// Runtime: O(n logn) average
function insertInOrder(value: BigInt, array: BigInt[]): BigInt[] {
  let lowBound = 0; // left bound of the search section
  let highBound = array.length - 1; // right bound of the search section
  let index = Math.round(array.length / 2);

  array.push(value);
  return array.sort();

  // find position in array
  // while (true) {
  //   let compareVal = array[index];
  //   if (value.equals(compareVal)) {
  //     // found same value, place after and return
  //     return array.splice(index + 1, [value]);
  //   } else if (value.lt(compareVal)) {
  //     // value is less than compareVal, search left side
  //     if (index - lowBound <= 2) {
  //       // insert 1 position before index
  //       array.
  //       return array.splice(index - 1, [value]);
  //     }
  //     highBound = index;
  //     index = Math.round((lowBound + index) / 2); // new index is between lowBound-index
  //   } else {
  //     // value is greater than compareVal, search right side
  //     if (highBound - index <= 2) {
  //       // insert 1 position after index
  //       return array.splice(index + 1, [value]);
  //     }
  //     lowBound = index;
  //     index = Math.round((index + highBound) / 2); // new index is between index-highBound
  //   }
  // }
}

function getMedian(list: BigInt[]): BigDecimal {
  if (list.length % 2 == 1) {
    // list length is odd
    let index = (list.length + 1) / 2;
    return list[index].toBigDecimal();
  } else {
    // list length is even
    let index1 = list.length / 2;
    let index2 = index1 + 1;
    let sum = list[index1].toBigDecimal().plus(list[index2].toBigDecimal());
    return sum.div(BIGDECIMAL_TWO);
  }
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
    dailySnapshot.timestamp = timestamp;

    // dailySnapshot.dailyBlocks = INT_ZERO;
    // dailySnapshot.cumulativeDifficulty = BIGINT_ZERO;
    // dailySnapshot.dailyDifficulty = BIGINT_ZERO;
    // dailySnapshot.dailyMeanDifficulty = BIGDECIMAL_ZERO;
    // dailySnapshot.dailyCumulativeGasUsed = BIGINT_ZERO;
    // dailySnapshot.dailyCumulativeGasLimit = BIGINT_ZERO;
    // dailySnapshot.dailyBlockUtilization = BIGDECIMAL_ZERO;
    // dailySnapshot.dailyMeanGasUsed = BIGDECIMAL_ZERO;
    // dailySnapshot.dailyMeanGasLimit = BIGDECIMAL_ZERO;
    // dailySnapshot.gasPrice = BIGINT_ZERO;
    // dailySnapshot.cumulativeBurntFees = BIGINT_ZERO;
    // dailySnapshot.dailyBurntFees = BIGINT_ZERO;
    // dailySnapshot.dailyRewards = BIGINT_ZERO;
    // dailySnapshot.cumulativeRewards = BIGINT_ZERO;
    // dailySnapshot.dailyMeanRewards = BIGDECIMAL_ZERO;
    // dailySnapshot.totalSupply = originalSupply;
    // dailySnapshot.dailySupplyIncrease = BIGINT_ZERO;
    // dailySnapshot.firstTimestamp = timestamp;
    // dailySnapshot.dailyMeanBlockInterval = BIGDECIMAL_ZERO;
    // dailySnapshot.cumulativeSize = BIGINT_ZERO;
    // dailySnapshot.dailyCumulativeSize = BIGINT_ZERO;
    // dailySnapshot.dailyMeanBlockSize = BIGDECIMAL_ZERO;
    // dailySnapshot.dailyChunkCount = INT_ZERO;
    // dailySnapshot.dailyTransactionCount = INT_ZERO;
    // dailySnapshot.firstSupply = originalSupply;

    dailySnapshot.save();
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
    network.blockHeight = INT_ZERO;
    network.blocksPerDay = BIGDECIMAL_ZERO;
    network.dailyBlocks = getOrCreateStats(id, DataType.BLOCKS).id;

    // network.cumulativeUniqueAuthors = INT_ZERO;
    // network.blockHeight = INT_ZERO;
    // network.cumulativeDifficulty = BIGINT_ZERO;
    // network.cumulativeGasUsed = BIGINT_ZERO;
    // network.gasLimit = BIGINT_ZERO;
    // network.cumulativeBurntFees = BIGINT_ZERO;
    // network.cumulativeRewards = BIGINT_ZERO;
    // network.cumulativeTransactions = INT_ZERO;
    // network.cumulativeSize = BIGINT_ZERO;
    // network.totalSupply = BIGINT_ZERO;
    // network.blocksPerDay = BIGDECIMAL_ZERO;

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
    stats.min = BIGINT_ZERO;
    stats.variance = BIGDECIMAL_ZERO;
    stats.q3 = BIGDECIMAL_ZERO;
    stats.q1 = BIGDECIMAL_ZERO;
    stats.values = [];
    stats.sum = BIGINT_ZERO;
    stats.save();
  }

  return stats;
}
