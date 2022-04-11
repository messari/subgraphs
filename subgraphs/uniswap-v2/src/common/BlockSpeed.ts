////////////////////////
// NAME: CHRIS STEEGE //
// VERSION 1.0.0      //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// The purpose of this program is to dynamically estimate the blocks generated for the 24 HR period following the most recent update. //  
// It does so by calculating the moving average block rate for an arbitrary length of time preceding the current block.               //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { BigDecimal, BigInt, store } from "@graphprotocol/graph-ts";
import { _Block, _BlockTracker } from "../../generated/schema";
import { BIGDECIMAL_ZERO, INT_ONE, INT_TWO, INT_ZERO } from "./constants";

// export let blocks: i32[][] = []
// export let blockSpeed: BigDecimal = BIGDECIMAL_ZERO
// export let windowStartIndex: i32 = INT_ZERO


// type _BlockTracker @entity {
//     id: ID! 
//     blocks: [_Block!]!
//     blocksPerDay: BigDecimal!
// }

// type _Block @entity {
//   id: ID!
//   blockNumber: Int!
//   timestamp: Int!
// }

export namespace RewardIntervalType {
    export const BLOCK = "BLOCK"
    export const TIMESTAMP = "TIMESTAMP"
  }

// Forecast period. This gives you the time period that you want to estimate count of blocks per interval, based on moving average block speed.
// 86400 = 1 Day
export const RATE_IN_SECONDS = 86400
export const RATE_IN_SECONDS_BD = BigDecimal.fromString(RATE_IN_SECONDS.toString())

// WINDOW_SIZE_SECONDS and BLOCK_STORAGE_INTERVALS can be modified. These are just recommended values - 'somewhat' arbitrary. 

// The window size determines the range of blocks that you track from the current block minus the window size.
// Window of block time used to calculate the moving average.
// Increasing means less deviation but also less sensitivity to changing block speeds.
export const WINDOW_SIZE_SECONDS = 86400
export const WINDOW_SIZE_SECONDS_BD = BigDecimal.fromString(WINDOW_SIZE_SECONDS.toString())

// The storage interval tells you to only store blocks that are space by at least this amount. 
// Increasing this value will mean less blocks stored and less frequently computes blocksSpeed.
export const BLOCK_STORAGE_INTERVAL = 5 as i32

export const BLOCK_TRACKER = "BlockTracker"

// Call this function in event handlers frequently enough so that it updates on most blocks 
/** 
* @param {BigInt} currentTimestamp    - Timestamp for current event
* @param {BigInt} currentBlockNumber  - Block nunmber of current event
* @param {BigInt} rewardRate          - Rate of reward emissions per reward interval
* @returns {BigDecimal}               - Returns estimated blocks for specified rate
*/
export function getRewardsPerDay(currentTimestamp: BigInt, currentBlockNumber: BigInt, rewardRate: BIGDECIMAL_ZERO): BigDecimal {

    let protocol = getOrCreateDex()
    if (protocol.rewardInterval = RewardIntervalType.TIMESTAMP) return rewardRate.times(RATE_IN_SECONDS_BD)

    let blockTracker = getOrCreateBlockTracker()
    let blocks: string[]
    blocks = blockTracker.blocks

    // Create entity for the current block
    let currentTimestampI32 = currentTimestamp.toI32()
    let currentBlockNumberI32 = currentBlockNumber.toI32()
    let currentBlock = getOrCreateBlock(currentTimestampI32, currentBlockNumberI32)


    if (blocks.length == INT_ZERO) {
        blocks.push(currentBlock.id)
        blockTracker.windowStartIndex = INT_ZERO

        blockTracker.save()
        currentBlock.save()

        // return because there is only 1 reference point.
        return BIGDECIMAL_ZERO
    }

    // Add current timestamp and block numnber to array if new block is at least X blocks later than previously stored.
    // Used to save memory and efficiency on array resizing.
    let recentSavedBlock = _Block.load(blocks[blocks.length - INT_ONE])
    if (currentBlockNumberI32 - recentSavedBlock!.blockNumber <= BLOCK_STORAGE_INTERVAL) {
        return blockTracker.blocksPerDay.times(rewardRate)
    }

    blocks.push(currentBlock.id)
    currentBlock.save()

    // The timestamp at the start of the window (default 24 hours in seconds).
    let startTimestamp = currentTimestampI32 - WINDOW_SIZE_SECONDS

    // Make sure you still have 2 blocks to calculate rate (This shouldn't really happen past the beginning).
    while(blocks.length > INT_TWO) {
        let windowStartBlock = _Block.load(blocks[blockTracker.windowStartIndex])

        // Shift the start of the window if the current timestamp moves out of desired rate window
        if (windowStartBlock!.timestamp < startTimestamp) {
            store.remove('_Block', windowStartBlock!.id)
            blockTracker.windowStartIndex = blockTracker.windowStartIndex + INT_ONE
        }
        else break
    }

    let windowStartBlock = _Block.load(blocks[blockTracker.windowStartIndex])
    let oldestBlock = _Block.load(blocks[INT_ZERO])
    // Remove blocks out of window from the front of the array if they become far enough out of window
    let secondsOutOfWindow = windowStartBlock!.timestamp - oldestBlock!.timestamp
    if (secondsOutOfWindow > RATE_IN_SECONDS/INT_TWO) {
        let newBlocks = blocks.slice(blockTracker.windowStartIndex, blocks.length)

        // Make sure the new blocks array still has at least 2 blocks for calculation
        if (newBlocks.length >= INT_TWO) {
            blocks = blocks.slice(blockTracker.windowStartIndex, blocks.length)
            blockTracker.windowStartIndex = INT_ZERO
        }
    }

    // Get the oldest block in the the array.
    let startBlock = _Block.load(blocks[blockTracker.windowStartIndex])

    // Wideness of the window in seconds.
    let windowSecondsCount = BigDecimal.fromString((currentTimestampI32 - startBlock!.timestamp).toString())

    // Wideness of the window in blocks.
    let windowBlocksCount = BigDecimal.fromString((currentBlockNumberI32 - startBlock!.blockNumber).toString())

    // Estimate block speed for the window in seconds.
    let unnormalizedBlockSpeed = (WINDOW_SIZE_SECONDS_BD.div(windowSecondsCount)).times(windowBlocksCount)

    // block speed converted to specified rate.
    let normalizedBlockSpeed = (RATE_IN_SECONDS_BD.div(WINDOW_SIZE_SECONDS_BD)).times(unnormalizedBlockSpeed)
    
    // Update BlockTracker with new values.
    blockTracker.blocksPerDay = normalizedBlockSpeed
    
    return rewardRate.times(blockTracker.blocksPerDay)
}

export function getOrCreateBlockTracker(): _BlockTracker {
    let blockTracker = _BlockTracker.load("BlockTracker")

    if (!blockTracker) {
        blockTracker = new _BlockTracker("BlockTracker")

        blockTracker.blocks = []
        blockTracker.windowStartIndex = INT_ZERO
        blockTracker.blocksPerDay = BIGDECIMAL_ZERO

        blockTracker.save()
    }

    return blockTracker
} 

export function getOrCreateBlock(timestamp: i32, blockNumber: i32): _Block {
    let block = _Block.load(blockNumber.toString()) 
    if (!block) {
        block = new _Block(blockNumber.toString())
        block.blockNumber = blockNumber
        block.timestamp = timestamp
    }
    return block
}