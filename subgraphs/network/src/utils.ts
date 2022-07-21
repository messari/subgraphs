import { BigDecimal, BigInt, dataSource, log } from "@graphprotocol/graph-ts";
import { _CircularBuffer } from "../generated/schema";
import {
  BIGDECIMAL_ZERO,
  INT_FOUR,
  INT_NEGATIVE_ONE,
  INT_ONE,
  INT_TWO,
  INT_ZERO,
  SECONDS_PER_DAY,
  SubgraphNetwork,
} from "./constants";

///////////////////
//// Utilities ////
///////////////////

export function hexToDecimal(hex: string): BigInt {
  return BigInt.fromI64(parseInt(hex, 16));
}

// turn exponent into a BigDecimal number
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bigDecimal = BigDecimal.fromString("1");
  for (let i = 0; i < decimals; i++) {
    bigDecimal = bigDecimal.times(BigDecimal.fromString("10"));
  }
  return bigDecimal;
}

/////////////////////////
//// Block Rate Calc ////
/////////////////////////

/* Constants needed for block rate calculations */

export const CIRCULAR_BUFFER = "CIRCULAR_BUFFER";

// only store blocks that are seperated by TIME_STORAGE_INTERVAL seconds
export const TIMESTAMP_STORAGE_INTERVAL = 600;

// BUFFER_SIZE is the max number of blocks stored at a time
export const BUFFER_SIZE = 144;

// the time interval we want to calculate rewards for (ie, forecast period)
// here it is 86400 s = 1 day
export const RATE_IN_SECONDS_BD = BigDecimal.fromString(
  SECONDS_PER_DAY.toString()
);

export const STARTING_BLOCKS_PER_DAY = RATE_IN_SECONDS_BD.div(
  getStartingBlockRate()
);

// The window size determines the range of blocks that you track from the current block minus the window size.
// Window of block time used to calculate the moving average.
export const WINDOW_SIZE_SECONDS = SECONDS_PER_DAY;
export const WINDOW_SIZE_SECONDS_BD = BigDecimal.fromString(
  WINDOW_SIZE_SECONDS.toString()
);

// calculate block rate
export function getBlocksPerDay(
  currentTimestamp: BigInt,
  currentBlockNumber: BigInt
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
    return circularBuffer.blocksPerDay;
  }

  // Add current timestamp and block numnber to array if new block is at least X blocks later than previously stored.
  // Used to save memory and efficiency on array resizing.
  let recentSavedTimestamp: i32;
  if (circularBuffer.nextIndex == INT_ZERO) {
    recentSavedTimestamp = blocks[circularBuffer.bufferSize - INT_TWO];
  } else {
    recentSavedTimestamp = blocks[circularBuffer.nextIndex - INT_TWO];
  }

  if (
    currentTimestampI32 - recentSavedTimestamp <=
    TIMESTAMP_STORAGE_INTERVAL
  ) {
    return circularBuffer.blocksPerDay;
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
  while (
    abs(circularBuffer.nextIndex - circularBuffer.windowStartIndex) > INT_FOUR
  ) {
    let windowIndexBlockTimestamp = blocks[circularBuffer.windowStartIndex];

    // Shift the start of the window if the current timestamp moves out of desired rate window
    if (windowIndexBlockTimestamp < startTimestamp) {
      circularBuffer.windowStartIndex =
        circularBuffer.windowStartIndex + INT_TWO;
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
  let unnormalizedBlockSpeed =
    WINDOW_SIZE_SECONDS_BD.div(windowSecondsCount).times(windowBlocksCount);

  // block speed converted to specified rate.
  let normalizedBlockSpeed = RATE_IN_SECONDS_BD.div(
    WINDOW_SIZE_SECONDS_BD
  ).times(unnormalizedBlockSpeed);

  // Update BlockTracker with new values.
  circularBuffer.blocksPerDay = normalizedBlockSpeed;
  circularBuffer.blocks = blocks;

  circularBuffer.save();

  return circularBuffer.blocksPerDay;
}

// get or create the circular buffer
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

// grabs the block rate initially when subgraph is deployed
function getStartingBlockRate(): BigDecimal {
  // Block rates pulled from google searches - rough estimates

  let network = dataSource.network();
  if (network == SubgraphNetwork.ETHEREUM) {
    return BigDecimal.fromString("13.39");
  } else if (network == SubgraphNetwork.ARBITRUM) {
    return BigDecimal.fromString("15");
  } else if (network == SubgraphNetwork.AURORA) {
    return BigDecimal.fromString("1.03");
  } else if (network == SubgraphNetwork.AVALANCHE) {
    return BigDecimal.fromString("1"); // avalanche emits blocks as needed
  } else if (network == SubgraphNetwork.BOBA) {
    return BigDecimal.fromString("38");
  } else if (network == SubgraphNetwork.BSC) {
    return BigDecimal.fromString("5");
  } else if (network == SubgraphNetwork.CELO) {
    return BigDecimal.fromString("5");
  } else if (network == SubgraphNetwork.CLOVER) {
    return BigDecimal.fromString("13");
  } else if (network == SubgraphNetwork.CRONOS) {
    return BigDecimal.fromString("5.7");
  } else if (network == SubgraphNetwork.FANTOM) {
    return BigDecimal.fromString("1");
  } else if (network == SubgraphNetwork.FUSE) {
    return BigDecimal.fromString("5");
  } else if (network == SubgraphNetwork.HARMONY) {
    return BigDecimal.fromString("2");
  } else if (network == SubgraphNetwork.MOONBEAM) {
    return BigDecimal.fromString("12.4");
  } else if (network == SubgraphNetwork.MOONRIVER) {
    return BigDecimal.fromString("13");
  } else if (network == SubgraphNetwork.OPTIMISM) {
    return BigDecimal.fromString("12.5");
  } else if (network == SubgraphNetwork.POLYGON) {
    return BigDecimal.fromString("2");
  } else if (network == SubgraphNetwork.XDAI) {
    return BigDecimal.fromString("5");
  } else if (network == SubgraphNetwork.NEAR) {
    return BigDecimal.fromString("1");
  } else if (network == SubgraphNetwork.COSMOS) {
    return BigDecimal.fromString("1");
  } else if (network == SubgraphNetwork.OSMOSIS) {
    return BigDecimal.fromString("5");
  } else if (network == SubgraphNetwork.JUNO) {
    return BigDecimal.fromString("6.1");
  } else if (network == SubgraphNetwork.OSMOSIS) {
    return BigDecimal.fromString("6");
  } else if (network == SubgraphNetwork.ARWEAVE) {
    return BigDecimal.fromString("360");
  }

  // Blocks are mined as needed
  // else if (network == SubgraphNetwork.AVALANCHE) return BigDecimal.fromString("2.5")
  // else if (dataSource.network() == "cronos") return BigDecimal.fromString("13.39")
  // else if (dataSource.network() == "harmony") return BigDecimal.fromString("13.39")
  // else if (dataSource.network() == SubgraphNetwork.MOONBEAM) return BigDecimal.fromString("13.39")
  // else if (dataSource.network() == SubgraphNetwork.MOONRIVER) return BigDecimal.fromString("13.39")
  else {
    log.warning("getStartingBlockRate(): Network not found", []);
    return BIGDECIMAL_ZERO;
  }
}
