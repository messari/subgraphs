////////////////////////
// NAME: CHRIS STEEGE //
// VERSION 1.0.0      //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// The purpose of this program is to dynamically estimate the blocks generated for the 24 HR period following the most recent update. //  
// It does so by calculating the moving average block rate for an arbitrary length of time preceding the current block.               //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Schema entities necessary for getting moving average block speed

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

import { BigDecimal, ethereum, store } from "@graphprotocol/graph-ts";
import { _Block, _BlockTracker } from "../../generated/schema";
import { BIGDECIMAL_ZERO, INT_ONE, INT_TWO, INT_ZERO } from "./constants";

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
// Increasing this value will mean less blocks stored and less frequently computes blocksPerDay.
export const BLOCK_STORAGE_INTERVAL = 5 as i32

// Paramaters: [event.block.timestamp, event.block.number]
// Call this function in event handlers frequently enough so that it updates on most blocks 
export function updateMovingAverageBlockSpeedForecast(event: ethereum): void {

    let blockTracker = getOrCreateWindowTracker()
    let blocks: string[]
    blocks = blockTracker.blocks

    // Create entity for the current block
    let currentTimestamp = event.block.timestamp.toI32()
    let currentBlockNumber = event.block.number.toI32()
    let currentBlock = getOrCreateBlock(currentTimestamp, currentBlockNumber)

    if (blocks.length == INT_ZERO) {
        blocks.push(currentBlock.id)
        blockTracker.blocks = blocks

        blockTracker.save()
        currentBlock.save()

        // return because there is only 1 reference point.
        return
    }

    // Add current timestamp and block numnber to array if new block is at least X blocks later than previously stored.
    // Used to save memory and efficiency on array resizing.
    let recentSavedBlock = _Block.load(blocks[blocks.length - INT_ONE])
    if (currentBlockNumber - recentSavedBlock!.blockNumber > BLOCK_STORAGE_INTERVAL) {
        blocks.push(currentBlock.id)
        currentBlock.save()
    }

    else return

    // Return 0 incase there is only one element.
    if (blocks.length < INT_TWO) {
        return
    }

    // The timestamp at the start of the window (default 24 hours in seconds).
    let startTimestamp = currentTimestamp - WINDOW_SIZE_SECONDS

    // Make sure you still have 2 blocks to calculate rate (This shouldn't really happen past the beginning).
    while(blocks.length > INT_TWO) {
        let oldestPushedBlock = _Block.load(blocks[INT_ZERO])

        // Remove items from array and storage that were greater than 24 Hours ago.
        if (oldestPushedBlock!.timestamp < startTimestamp) {
            store.remove('_Block', oldestPushedBlock!.id)
            blocks.shift()
        }
        else break
    }

    // Get the oldest block in the the array.
    let startBlock = _Block.load(blocks[INT_ZERO])

    // Wideness of the window in seconds.
    let windowSecondsCount = BigDecimal.fromString((currentBlock.timestamp - startBlock!.timestamp).toString())

    // Wideness of the window in blocks.
    let windowBlocksCount = BigDecimal.fromString((currentBlock.blockNumber - startBlock!.blockNumber).toString())

    // Estimate block speed for the window in seconds.
    let blockSpeed = (WINDOW_SIZE_SECONDS_BD.div(windowSecondsCount)).times(windowBlocksCount)

    // block speed converted to 24 hour period.
    let blockSpeedPerDay = (RATE_IN_SECONDS_BD.div(WINDOW_SIZE_SECONDS_BD)).times(blockSpeed)

    // Update BlockTracker with new values.
    blockTracker.blocks = blocks
    blockTracker.blocksPerDay = blockSpeedPerDay
    blockTracker.save()    
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

export function getOrCreateWindowTracker(): _BlockTracker {
    let blockTracker = _BlockTracker.load("BlockTracker")

    if (!blockTracker) {
        blockTracker = new _BlockTracker("BlockTracker")

        blockTracker.blocks = []
        blockTracker.blocksPerDay = BIGDECIMAL_ZERO

        blockTracker.save()
    }

    return blockTracker
}