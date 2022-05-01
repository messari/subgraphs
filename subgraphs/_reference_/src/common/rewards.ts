
/////////////////////
// VERSION 1.0.2 ////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// The purpose of this program is to dynamically estimate the blocks generated for the 24 HR period following the most recent update. //
// It does so by calculating the moving average block rate for an arbitrary length of time preceding the current block.               //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { log, BigDecimal, BigInt, dataSource } from "@graphprotocol/graph-ts";
import { _CircularBuffer } from "../../generated/schema";
import {
    Network,
    BIGINT_TEN_TO_EIGHTEENTH,
    SECONDS_PER_DAY
} from "./constants";
import {
  BIGDECIMAL_ZERO,
  INT_FOUR,
  INT_NEGATIVE_ONE,
  INT_ONE,
  INT_TWO,
  INT_ZERO,
} from "./constants";

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
// Recommended value is (RATE_IN_SECODNDS / TIMESTAMP_STORAGE_INTERVAL) - > Round up to nearest even integer
export const BUFFER_SIZE = 144;

// Add this entity to the schema.
// type _CircularBuffer @entity {
//   " 'CIRCULAR_BUFFER' " 
//   id: ID! 

//   " Array of sorted block numbers sorted continuously "
//   blocks: [Int!]!

//   " The index in the blocks array which will be used with the newest block to calculate block speed (Usally set to about a day before newest block) "
//   windowStartIndex: Int!

//   " The next index in the blocks array that will be replaced with the newest block "
//   nextIndex: Int!

//   " This determines the size of the blocks array. Should be set to contain at least a days worth of blocks according to a 1 day window for measuring speed"
//   bufferSize: Int!

//   " The current calculated number of blocks per day based on calculated block speed "
//   blocksPerDay: BigDecimal!
// }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const CIRCULAR_BUFFER = "CIRCULAR_BUFFER";

// Describes whether the interval for which rewards are emitted is done by block or timestamp
export namespace RewardIntervalType {
  export const BLOCK = "BLOCK";
  export const TIMESTAMP = "TIMESTAMP";
}

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
  let circularBuffer = getOrCreateCircularBuffer();

  // Create entity for the current block
  let currentTimestampI32 = currentTimestamp.toI32();
  let currentBlockNumberI32 = currentBlockNumber.toI32();

  let blocks = circularBuffer.blocks;

  // Interval between index and the index of the start of the window block
  let windowWidth = abs(
    circularBuffer.windowStartIndex - circularBuffer.nextIndex
  );
  if (windowWidth == INT_ZERO) {
    if (circularBuffer.nextIndex >= circularBuffer.bufferSize) {
      blocks[INT_ZERO] = currentTimestampI32;
      blocks[INT_ONE] = currentBlockNumberI32;
      circularBuffer.nextIndex = INT_TWO;
    } else {
      blocks[circularBuffer.nextIndex] = currentTimestampI32;
      blocks[circularBuffer.nextIndex + INT_ONE] = currentBlockNumberI32;
      circularBuffer.nextIndex += INT_TWO;
    }

    circularBuffer.save();

    // return because there is only 1 reference point.
    if (rewardType == RewardIntervalType.TIMESTAMP) {
      return rewardRate.times(RATE_IN_SECONDS_BD);
    } else {
      return circularBuffer.blocksPerDay.times(rewardRate);
    }
  }

  // Add current timestamp and block numnber to array if new block is at least X blocks later than previously stored.
  // Used to save memory and efficiency on array resizing.
  let recentSavedTimestamp: i32;
  if (circularBuffer.nextIndex == INT_ZERO) {
    recentSavedTimestamp = blocks[circularBuffer.bufferSize - INT_TWO];
  } else {
    recentSavedTimestamp = blocks[circularBuffer.nextIndex - INT_TWO];
  }
  
  if (currentTimestampI32 - recentSavedTimestamp <= TIMESTAMP_STORAGE_INTERVAL) {
    if (rewardType == RewardIntervalType.TIMESTAMP) {
      return rewardRate.times(RATE_IN_SECONDS_BD);
    } else {
      return circularBuffer.blocksPerDay.times(rewardRate);
    }
  }

  blocks[circularBuffer.nextIndex] = currentTimestampI32;
  blocks[circularBuffer.nextIndex + INT_ONE] = currentBlockNumberI32;
  if (circularBuffer.nextIndex >= BUFFER_SIZE - INT_TWO) {
    circularBuffer.nextIndex = INT_ZERO;
  } else {
    circularBuffer.nextIndex += INT_TWO;
  }
  // The timestamp at the start of the window (default 24 hours in seconds).
  let startTimestamp = currentTimestampI32 - WINDOW_SIZE_SECONDS;

  // Make sure to still have 2 blocks to calculate rate (This shouldn't happen past the beginning).
  while (abs(circularBuffer.nextIndex - circularBuffer.windowStartIndex) > INT_FOUR) {
    let windowIndexBlockTimestamp = blocks[circularBuffer.windowStartIndex];

    // Shift the start of the window if the current timestamp moves out of desired rate window
    if (windowIndexBlockTimestamp < startTimestamp) {
      circularBuffer.windowStartIndex = circularBuffer.windowStartIndex + INT_TWO;
      if (circularBuffer.windowStartIndex >= circularBuffer.bufferSize) {
        circularBuffer.windowStartIndex = INT_ZERO;
      }
    } else {
      break;
    }
  }

  // Wideness of the window in seconds.
  let windowSecondsCount = BigDecimal.fromString(
    (currentTimestampI32 - blocks[circularBuffer.windowStartIndex]).toString()
  );

  // Wideness of the window in blocks.
  let windowBlocksCount = BigDecimal.fromString(
    (
      currentBlockNumberI32 - blocks[circularBuffer.windowStartIndex + INT_ONE]
    ).toString()
  );

  // Estimate block speed for the window in seconds.
  let unnormalizedBlockSpeed = WINDOW_SIZE_SECONDS_BD.div(
    windowSecondsCount
  ).times(windowBlocksCount);

  // block speed converted to specified rate.
  let normalizedBlockSpeed = RATE_IN_SECONDS_BD.div(
    WINDOW_SIZE_SECONDS_BD
  ).times(unnormalizedBlockSpeed);

  // Update BlockTracker with new values.
  circularBuffer.blocksPerDay = normalizedBlockSpeed;
  circularBuffer.blocks = blocks;

  circularBuffer.save();

  if (rewardType == RewardIntervalType.TIMESTAMP) {
    return rewardRate.times(RATE_IN_SECONDS_BD);
  } else {
    return rewardRate.times(circularBuffer.blocksPerDay);
  }
}

function getOrCreateCircularBuffer(): _CircularBuffer {
  let circularBuffer = _CircularBuffer.load(CIRCULAR_BUFFER);

  if (!circularBuffer) {
    circularBuffer = new _CircularBuffer(CIRCULAR_BUFFER);

    let blocks = new Array<i32>(BUFFER_SIZE);
    for (let i = INT_ZERO; i < BUFFER_SIZE; i += INT_TWO) {
      blocks[i] = INT_NEGATIVE_ONE;
      blocks[i + INT_ONE] = INT_NEGATIVE_ONE;
    }

    circularBuffer.blocks = blocks;
    circularBuffer.windowStartIndex = INT_ZERO;
    circularBuffer.nextIndex = INT_ZERO;
    circularBuffer.bufferSize = BUFFER_SIZE;
    circularBuffer.blocksPerDay = STARTING_BLOCKS_PER_DAY;

    circularBuffer.save();
  }

  return circularBuffer;
}

function getStartingBlockRate(): BigDecimal {
  // Block rates pulled from google searches - rough estimates

  let network = dataSource.network();
  if (network == Network.MAINNET.toLowerCase()) {
    return BigDecimal.fromString("13.39");
  } else if (network == Network.ARBITRUM_ONE.toLowerCase()) {
    return BigDecimal.fromString("15");
  } else if (network == Network.AURORA.toLowerCase()) {
    return BigDecimal.fromString("1.03");
  } else if (network == Network.BSC.toLowerCase()) {
    return BigDecimal.fromString("5");
  } else if (network == Network.CELO.toLowerCase()) {
    return BigDecimal.fromString("5");
  } else if (network == Network.FANTOM.toLowerCase()) {
    return BigDecimal.fromString("1");
  } else if (network == Network.OPTIMISM.toLowerCase()) {
    return BigDecimal.fromString("12.5");
  } else if (network == Network.MATIC.toLowerCase()) {
    return BigDecimal.fromString("2");
  } else if (network == Network.XDAI.toLowerCase()) {
    return BigDecimal.fromString("5");
  }
  // Blocks are mined as needed
  // else if (network == Network.AVALANCHE.toLowerCase()) return BigDecimal.fromString("2.5")
  // else if (dataSource.network() == "cronos") return BigDecimal.fromString("13.39")
  // else if (dataSource.network() == "harmony") return BigDecimal.fromString("13.39")
  // else if (dataSource.network() == SubgraphNetwork.MOONBEAM.toLowerCase()) return BigDecimal.fromString("13.39")
  // else if (dataSource.network() == SubgraphNetwork.MOONRIVER.toLowerCase()) return BigDecimal.fromString("13.39")
  else {
    log.warning("getStartingBlockRate(): Network not found", []);
    return BIGDECIMAL_ZERO;
  }
}

export function emissionsPerDay(rewardRatePerSecond: BigInt): BigInt {
    // Take the reward rate per second, divide out the decimals and get the emissions per day
    const BIGINT_SECONDS_PER_DAY = BigInt.fromI32(<i32>SECONDS_PER_DAY);
    return rewardRatePerSecond.times(BIGINT_SECONDS_PER_DAY).div(BIGINT_TEN_TO_EIGHTEENTH);
  }
