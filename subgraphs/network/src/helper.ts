import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  ActiveAuthor,
  Author,
  Block,
  DailySnapshot,
  HourlySnapshot,
  Network,
  Stat,
} from "../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  BIGINT_ONE,
  DataType,
  IntervalType,
  INT_TWO,
  INT_ZERO,
  NETWORK_NAME,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  BIGINT_MAX,
} from "./constants";
import { BlockData, UpdateNetworkData } from "./mapping";
import { exponentToBigDecimal } from "./utils";
import { Versions } from "./versions";

//////////////////
//// Updaters ////
//////////////////

export function updateNetwork(networkData: UpdateNetworkData): Network {
  const network = getOrCreateNetwork(NETWORK_NAME);
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

  network.save();
  return network;
}

// update snapshots
export function updateMetrics(blockData: BlockData, network: Network): void {
  updateDailySnapshot(blockData, network);
  updateHourlySnapshot(blockData, network);
}

function updateDailySnapshot(blockData: BlockData, network: Network): void {
  const snapshotId = (blockData.timestamp.toI64() / SECONDS_PER_DAY).toString();
  const snapshot = getOrCreateDailySnapshot(blockData.timestamp);

  // grab block interval before updating timestamp
  // newTimestamp - oldTimestamp = interval
  const blockInterval = blockData.timestamp.minus(snapshot.timestamp);

  // update overlapping fields for snapshot
  snapshot.blockHeight = network.blockHeight;
  snapshot.dailyBlocks++;
  snapshot.timestamp = blockData.timestamp;

  // update statistical analysis fields
  snapshot.cumulativeUniqueAuthors = network.cumulativeUniqueAuthors;
  if (blockData.author) {
    // check for new hourly authors
    const id = Bytes.fromUTF8(
      IntervalType.DAILY +
        "-" +
        blockData.author!.toHexString() +
        "-" +
        snapshot.id.toString()
    );
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

function updateHourlySnapshot(blockData: BlockData, network: Network): void {
  const snapshotId = (
    blockData.timestamp.toI64() / SECONDS_PER_HOUR
  ).toString();
  const snapshot = getOrCreateHourlySnapshot(blockData.timestamp);

  // grab block interval before updating timestamp
  const blockInterval = blockData.timestamp.minus(snapshot.timestamp);

  // update overlapping fields for snapshot
  snapshot.blockHeight = network.blockHeight;
  snapshot.hourlyBlocks++;
  snapshot.timestamp = blockData.timestamp;

  // update statistical analysis fields
  snapshot.cumulativeUniqueAuthors = network.cumulativeUniqueAuthors;
  if (blockData.author) {
    // check for new hourly authors
    const id = Bytes.fromUTF8(
      IntervalType.HOURLY +
        "-" +
        blockData.author!.toHexString() +
        "-" +
        snapshot.id.toString()
    );
    let activeAuthor = ActiveAuthor.load(id);
    if (!activeAuthor) {
      activeAuthor = new ActiveAuthor(id);
      activeAuthor.save();

      snapshot.hourlyUniqueAuthors = updateStats(
        snapshotId,
        DataType.AUTHORS,
        BIGINT_ONE
      ); // TODO: check for new hourly author
    }
  }

  snapshot.cumulativeDifficulty = network.cumulativeDifficulty;
  if (blockData.difficulty) {
    snapshot.hourlyDifficulty = updateStats(
      snapshotId,
      DataType.DIFFICULTY,
      blockData.difficulty!
    );
  }

  snapshot.cumulativeGasUsed = network.cumulativeGasUsed;
  if (blockData.gasUsed) {
    snapshot.hourlyGasUsed = updateStats(
      snapshotId,
      DataType.GAS_USED,
      blockData.gasUsed!
    );
  }

  snapshot.cumulativeBurntFees = network.cumulativeBurntFees;
  if (blockData.burntFees) {
    snapshot.hourlyBurntFees = updateStats(
      snapshotId,
      DataType.BURNT_FEES,
      blockData.burntFees!
    );
  }

  snapshot.cumulativeRewards = network.cumulativeRewards;
  if (blockData.rewards) {
    snapshot.hourlyRewards = updateStats(
      snapshotId,
      DataType.REWARDS,
      blockData.rewards!
    );
  }

  snapshot.cumulativeSize = network.cumulativeSize;
  if (blockData.size) {
    snapshot.hourlySize = updateStats(
      snapshotId,
      DataType.SIZE,
      blockData.size!
    );
  }

  if (blockData.chunkCount) {
    snapshot.hourlyChunks = updateStats(
      snapshotId,
      DataType.CHUNKS,
      blockData.chunkCount!
    );
  }

  snapshot.totalSupply = network.totalSupply;
  if (blockData.newSupply) {
    snapshot.hourlySupply = updateStats(
      snapshotId,
      DataType.SUPPLY,
      blockData.newSupply!
    );
  }

  snapshot.cumulativeTransactions = network.cumulativeTransactions;
  if (blockData.transactionCount) {
    snapshot.hourlyTransactions = updateStats(
      snapshotId,
      DataType.TRANSACTIONS,
      blockData.transactionCount!
    );
  }

  snapshot.hourlyBlockInterval = updateStats(
    snapshotId,
    DataType.BLOCK_INTERVAL,
    blockInterval
  );

  snapshot.gasPrice = blockData.gasPrice;
  if (blockData.gasPrice) {
    snapshot.hourlyGasPrice = updateStats(
      snapshotId,
      DataType.GAS_PRICE,
      blockData.gasPrice!
    );
  }

  snapshot.save();
}

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
// Update Stat entity and return the id
// calculate the variance, q1, q3 once the daily/hourly snapshot is done
function updateStats(id: string, dataType: string, value: BigInt): Bytes {
  const stats = getOrCreateStats(id, dataType);

  // basic fields
  stats.count++;
  stats.sum = stats.sum.plus(value);

  // max/min
  stats.max = value.gt(stats.max) ? value : stats.max;
  stats.min = value.lt(stats.min) ? value : stats.min;

  // update mean
  const delta = value.toBigDecimal().minus(stats.mean);
  stats.mean = stats.mean.plus(
    delta.div(BigDecimal.fromString(stats.count.toString()))
  );

  // update rolling variance
  // Using the Welford's online algorithm
  const delta2 = value.toBigDecimal().minus(stats.mean);
  stats._meanSquared = stats._meanSquared!.plus(delta.times(delta2));
  stats.variance = updateVariance(stats._meanSquared!, stats.count);

  stats.save();
  return stats.id;
}

//
//
// Gets new variance using Welford's online algorithm
// This algorithm properly calcs variance for a stream of data
function updateVariance(meanSquared: BigDecimal, count: i32): BigDecimal {
  if (count < 2) {
    return BIGDECIMAL_ZERO;
  }

  return meanSquared.div(BigDecimal.fromString((count - 1).toString()));
}

/////////////////
//// Getters ////
/////////////////

function getOrCreateDailySnapshot(timestamp: BigInt): DailySnapshot {
  const id = Bytes.fromI32(timestamp.toI32() / SECONDS_PER_DAY);
  let dailySnapshot = DailySnapshot.load(id);
  if (!dailySnapshot) {
    dailySnapshot = new DailySnapshot(id);
    dailySnapshot.network = NETWORK_NAME;
    dailySnapshot.blockHeight = INT_ZERO;
    dailySnapshot.dailyBlocks = INT_ZERO;
    dailySnapshot.timestamp = timestamp;
    dailySnapshot.cumulativeUniqueAuthors = INT_ZERO;

    dailySnapshot.save();
  }
  return dailySnapshot;
}

function getOrCreateHourlySnapshot(timestamp: BigInt): HourlySnapshot {
  const id = Bytes.fromI32(timestamp.toI32() / SECONDS_PER_HOUR);
  let hourlySnapshot = HourlySnapshot.load(id);
  if (!hourlySnapshot) {
    hourlySnapshot = new HourlySnapshot(id);
    hourlySnapshot.network = NETWORK_NAME;
    hourlySnapshot.blockHeight = INT_ZERO;
    hourlySnapshot.hourlyBlocks = INT_ZERO;
    hourlySnapshot.timestamp = timestamp;
    hourlySnapshot.cumulativeUniqueAuthors = INT_ZERO;

    hourlySnapshot.save();
  }
  return hourlySnapshot;
}

export function createBlock(blockData: BlockData): void {
  const block = new Block(Bytes.fromI32(blockData.height.toI32()));

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

  if (block.gasLimit && block.gasLimit! > BIGINT_ZERO && block.gasUsed) {
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
    network.cumulativeUniqueAuthors = INT_ZERO;
    network.blockHeight = INT_ZERO;
    network.dailyBlocks = getOrCreateStats(id, DataType.BLOCKS).id;
  }

  network.schemaVersion = Versions.getSchemaVersion();
  network.subgraphVersion = Versions.getSubgraphVersion();
  network.methodologyVersion = Versions.getMethodologyVersion();

  network.save();

  return network;
}

function getOrCreateStats(snapshot: string, dataType: string): Stat {
  const id = Bytes.fromUTF8(snapshot.concat("-").concat(dataType));
  let stats = Stat.load(id);
  if (!stats) {
    stats = new Stat(id);
    stats.count = INT_ZERO;
    stats.mean = BIGDECIMAL_ZERO;
    stats.max = BIGINT_ZERO;
    stats.min = BIGINT_MAX;
    stats.variance = BIGDECIMAL_ZERO;
    stats.q3 = BIGDECIMAL_ZERO;
    stats.q1 = BIGDECIMAL_ZERO;
    stats.sum = BIGINT_ZERO;
    stats._meanSquared = BIGDECIMAL_ZERO;
    stats.save();
  }

  return stats;
}
