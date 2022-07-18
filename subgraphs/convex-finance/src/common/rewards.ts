/////////////////////
// VERSION 1.0.3 ////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// The purpose of this program is to dynamically estimate the blocks generated for the 24 HR period following the most recent update. //
// It does so by calculating the moving average block rate for an arbitrary length of time preceding the current block.               //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import * as constants from "./constants";
import { _CircularBuffer } from "../../generated/schema";
import { log, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

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
  let circularBuffer = getOrCreateCircularBuffer();

  // Create entity for the current block
  let currentTimestampI32 = currentTimestamp.toI32();
  let currentBlockNumberI32 = currentBlockNumber.toI32();

  let blocks = circularBuffer.blocks;

  // Interval between index and the index of the start of the window block
  let windowWidth = abs(
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
  let startTimestamp = currentTimestampI32 - WINDOW_SIZE_SECONDS;

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
    let windowIndexBlockTimestamp = blocks[circularBuffer.windowStartIndex];

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
  let windowSecondsCount = BigDecimal.fromString(
    (currentTimestampI32 - blocks[circularBuffer.windowStartIndex]).toString()
  );

  // Wideness of the window in blocks.
  let windowBlocksCount = BigDecimal.fromString(
    (
      currentBlockNumberI32 - blocks[circularBuffer.windowStartIndex + 1]
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

    let blocks = new Array<i32>(BUFFER_SIZE);
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
  // returns  mainnet block rate

  return BigDecimal.fromString("13.39");
}
