/////////////////////
// VERSION 1.0.3 ////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// The purpose of this program is to dynamically estimate the blocks generated for the 24 HR period following the most recent update. //
// It does so by calculating the moving average block rate for an arbitrary length of time preceding the current block.               //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import * as utils from "./utils";
import * as constants from "./constants";
import { _CircularBuffer } from "../../generated/schema";
import { log, BigDecimal, BigInt, dataSource } from "@graphprotocol/graph-ts";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WINDOW_SIZE_SECONDS, TIMESTAMP_STORAGE_INTERVALS, and BUFFER_SIZE can be modified. These are just recommended values - 'somewhat' arbitrary. //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// The storage interval tells you to only store blocks where the timestamps are separated by at least this amount.
// Increasing this value will mean less blocks stored and less frequently computes blocksSpeed.
export const TIMESTAMP_STORAGE_INTERVAL = 600;

// The window size determines the range of blocks that you track from the current block minus the window size.
// Window of block time used to calculate the moving average.
// Increasing means less deviation but also less sensitivity to changing block speeds.
export const WINDOW_SIZE_SECONDS = 86400;

// BUFFER_SIZE determined the size of the array
// Makes the buffer the maximum amount of blocks that can be stored given the block rate and storage interval
// Recommended value is (RATE_IN_SECODNDS / TIMESTAMP_STORAGE_INTERVAL) * 2 - > Round up to nearest even integer
export const BUFFER_SIZE = 288;

// Add this entity to the schema.

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const CIRCULAR_BUFFER = "CIRCULAR_BUFFER";

// Describes whether the interval for which rewards are emitted is done by block or timestamp

// Forecast period. This gives you the time period that you want to estimate count of blocks per interval, based on moving average block speed.
// 86400 = 1 Day
export const RATE_IN_SECONDS = 86400;
export const RATE_IN_SECONDS_BD = BigDecimal.fromString(
  RATE_IN_SECONDS.toString()
);

// Estimated seconds per block of the protocol
export const STARTING_BLOCKS_PER_DAY = RATE_IN_SECONDS_BD.div(
  getStartingBlockRate()
);

export const WINDOW_SIZE_SECONDS_BD = BigDecimal.fromString(
  WINDOW_SIZE_SECONDS.toString()
);

// Call this function in event handlers frequently enough so that it calls on blocks frequently enough
/**
 * @param {BigInt} currentTimestamp    - Timestamp for current event
 * @param {BigInt} currentBlockNumber  - Block nunmber of current event
 * @param {BigInt} rewardRate          - Rate of reward emissions per reward interval
 * @param {BigInt} rewardType          - Describes whether rewards are given per block or timestamp
 * @returns {BigDecimal}               - Returns estimated blocks for specified rate
 */
export function getRewardsPerDay(
  currentTimestamp: BigInt,
  currentBlockNumber: BigInt,
  rewardRate: BigDecimal,
  rewardType: string
): BigDecimal {
  const circularBuffer = getOrCreateCircularBuffer();

  // Create entity for the current block
  const currentTimestampI32 = currentTimestamp.toI32();
  const currentBlockNumberI32 = currentBlockNumber.toI32();

  const blocks = circularBuffer.blocks;

  // Interval between index and the index of the start of the window block
  const windowWidth = abs(
    circularBuffer.windowStartIndex - circularBuffer.nextIndex
  );
  if (windowWidth == 0) {
    if (circularBuffer.nextIndex >= circularBuffer.bufferSize) {
      blocks[0] = currentTimestampI32;
      blocks[1] = currentBlockNumberI32;
      circularBuffer.nextIndex = 2;
    } else {
      blocks[circularBuffer.nextIndex] = currentTimestampI32;
      blocks[circularBuffer.nextIndex + 1] = currentBlockNumberI32;
      circularBuffer.nextIndex += 2;
    }

    circularBuffer.save();

    // return because there is only 1 reference point.
    if (rewardType == constants.RewardIntervalType.TIMESTAMP) {
      return rewardRate.times(RATE_IN_SECONDS_BD);
    } else {
      return circularBuffer.blocksPerDay.times(rewardRate);
    }
  }

  // Add current timestamp and block numnber to array if new block is at least X blocks later than previously stored.
  // Used to save memory and efficiency on array resizing.
  let recentSavedTimestamp: i32;
  if (circularBuffer.nextIndex == 0) {
    recentSavedTimestamp = blocks[circularBuffer.bufferSize - 2];
  } else {
    recentSavedTimestamp = blocks[circularBuffer.nextIndex - 2];
  }

  if (
    currentTimestampI32 - recentSavedTimestamp <=
    TIMESTAMP_STORAGE_INTERVAL
  ) {
    if (rewardType == constants.RewardIntervalType.TIMESTAMP) {
      return rewardRate.times(RATE_IN_SECONDS_BD);
    } else {
      return circularBuffer.blocksPerDay.times(rewardRate);
    }
  }

  blocks[circularBuffer.nextIndex] = currentTimestampI32;
  blocks[circularBuffer.nextIndex + 1] = currentBlockNumberI32;
  if (circularBuffer.nextIndex >= BUFFER_SIZE - 2) {
    circularBuffer.nextIndex = 0;
  } else {
    circularBuffer.nextIndex += 2;
  }
  // The timestamp at the start of the window (default 24 hours in seconds).
  const startTimestamp = currentTimestampI32 - WINDOW_SIZE_SECONDS;

  // Make sure to still have 2 blocks to calculate rate (This shouldn't happen past the beginning).
  while (true) {
    if (circularBuffer.nextIndex > circularBuffer.windowStartIndex) {
      if (circularBuffer.nextIndex - circularBuffer.windowStartIndex <= 4) {
        break;
      }
    } else {
      if (
        BUFFER_SIZE -
          circularBuffer.windowStartIndex +
          circularBuffer.nextIndex <=
        4
      ) {
        break;
      }
    }
    const windowIndexBlockTimestamp = blocks[circularBuffer.windowStartIndex];

    // Shift the start of the window if the current timestamp moves out of desired rate window
    if (windowIndexBlockTimestamp < startTimestamp) {
      circularBuffer.windowStartIndex = circularBuffer.windowStartIndex + 2;
      if (circularBuffer.windowStartIndex >= circularBuffer.bufferSize) {
        circularBuffer.windowStartIndex = 0;
      }
    } else {
      break;
    }
  }

  // Wideness of the window in seconds.
  const windowSecondsCount = BigDecimal.fromString(
    (currentTimestampI32 - blocks[circularBuffer.windowStartIndex]).toString()
  );

  // Wideness of the window in blocks.
  const windowBlocksCount = BigDecimal.fromString(
    (
      currentBlockNumberI32 - blocks[circularBuffer.windowStartIndex + 1]
    ).toString()
  );

  // Estimate block speed for the window in seconds.
  const unnormalizedBlockSpeed =
    WINDOW_SIZE_SECONDS_BD.div(windowSecondsCount).times(windowBlocksCount);

  // block speed converted to specified rate.
  const normalizedBlockSpeed = RATE_IN_SECONDS_BD.div(
    WINDOW_SIZE_SECONDS_BD
  ).times(unnormalizedBlockSpeed);

  // Update BlockTracker with new values.
  circularBuffer.blocksPerDay = normalizedBlockSpeed;
  circularBuffer.blocks = blocks;

  circularBuffer.save();

  if (rewardType == constants.RewardIntervalType.TIMESTAMP) {
    return rewardRate.times(RATE_IN_SECONDS_BD);
  } else {
    return rewardRate.times(circularBuffer.blocksPerDay);
  }
}

function getOrCreateCircularBuffer(): _CircularBuffer {
  let circularBuffer = _CircularBuffer.load(CIRCULAR_BUFFER);

  if (!circularBuffer) {
    circularBuffer = new _CircularBuffer(CIRCULAR_BUFFER);

    const blocks = new Array<i32>(BUFFER_SIZE);
    for (let i = 0; i < BUFFER_SIZE; i += 2) {
      blocks[i] = -1;
      blocks[i + 1] = -1;
    }

    circularBuffer.blocks = blocks;
    circularBuffer.windowStartIndex = 0;
    circularBuffer.nextIndex = 0;
    circularBuffer.bufferSize = BUFFER_SIZE;
    circularBuffer.blocksPerDay = STARTING_BLOCKS_PER_DAY;

    circularBuffer.save();
  }

  return circularBuffer;
}

function getStartingBlockRate(): BigDecimal {
  // Block rates pulled from google searches - rough estimates

  if (utils.equalsIgnoreCase(dataSource.network(), constants.Network.MAINNET)) {
    return BigDecimal.fromString("13.39");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.ARBITRUM_ONE)
  ) {
    return BigDecimal.fromString("15");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.AURORA)
  ) {
    return BigDecimal.fromString("1.03");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.BSC)
  ) {
    return BigDecimal.fromString("5");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.CELO)
  ) {
    return BigDecimal.fromString("5");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.FANTOM)
  ) {
    return BigDecimal.fromString("1");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.FUSE)
  ) {
    return BigDecimal.fromString("1");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.OPTIMISM)
  ) {
    return BigDecimal.fromString("12.5");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.MATIC)
  ) {
    return BigDecimal.fromString("2");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.XDAI)
  ) {
    return BigDecimal.fromString("5");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.MOONBEAM)
  ) {
    return BigDecimal.fromString("13.39");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.MOONRIVER)
  ) {
    return BigDecimal.fromString("13.39");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.AVALANCHE)
  ) {
    return BigDecimal.fromString("13.39");
  } else if (
    utils.equalsIgnoreCase(dataSource.network(), constants.Network.CRONOS)
  ) {
    return BigDecimal.fromString("5.5");
  }

  // else if (network == SubgraphNetwork.AVALANCHE) return BigDecimal.fromString("2.5")
  // else if (dataSource.network() == "harmony") return BigDecimal.fromString("13.39")
  else {
    log.warning("getStartingBlockRate(): Network not found", []);
    return constants.BIGDECIMAL_ZERO;
  }
}
