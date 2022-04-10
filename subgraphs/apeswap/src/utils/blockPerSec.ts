import { BigDecimal, BigInt, store } from "@graphprotocol/graph-ts";
import { _Block, _BlockTracker } from "../../generated/schema";
import { BIGDECIMAL_ZERO, INT_ONE, INT_TWO, INT_ZERO } from "./constant";

export const SECONDS_PER_DAY = 86400
export const SECONDS_PER_DAY_BD = BigDecimal.fromString(SECONDS_PER_DAY.toString())

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
export function updateMovingAverageBlocksPerSecond(currentTimestamp: BigInt, currentBlockNumber: BigInt): BigDecimal {

    let blockTracker = getOrCreateWindowTracker()
    let blocks: string[]
    blocks = blockTracker._blocks

    // Create entity for the current block
    let currentTimestampI32 = currentTimestamp.toI32()
    let currentBlockNumberI32 = currentBlockNumber.toI32()
    let currentBlock = getOrCreateBlock(currentTimestampI32, currentBlockNumberI32)

    if (blocks.length == INT_ZERO) {
        blocks.push(currentBlock.id)
        blockTracker._blocks = blocks

        blockTracker.save()
        currentBlock.save()

        // return because there is only 1 reference point.
        // return
    }

    // Add current timestamp and block numnber to array if new block is at least X blocks later than previously stored.
    // Used to save memory and efficiency on array resizing.
    let recentSavedBlock = _Block.load(blocks[blocks.length - INT_ONE])
    if (currentBlockNumberI32 - recentSavedBlock!._blockNumber > BLOCK_STORAGE_INTERVAL) {
        blocks.push(currentBlock.id)
        currentBlock.save()
    }

    // else return

    // Return 0 incase there is only one element.
    // if (blocks.length < INT_TWO) {
    //     return
    // }

    // The timestamp at the start of the window (default 24 hours in seconds).
    let startTimestamp = currentTimestampI32 - WINDOW_SIZE_SECONDS

    // Make sure you still have 2 blocks to calculate rate (This shouldn't really happen past the beginning).
    while(blocks.length > INT_TWO) {
        let oldestPushedBlock = _Block.load(blocks[INT_ZERO])

        // Remove items from array and storage that were greater than 24 Hours ago.
        if (oldestPushedBlock!._timestamp < startTimestamp) {
            store.remove('_Block', oldestPushedBlock!.id)
            blocks.shift()
        }
        else break
    }

    // Get the oldest block in the the array.
    let startBlock = _Block.load(blocks[INT_ZERO])

    // Wideness of the window in seconds.
    let windowSecondsCount = BigDecimal.fromString((currentBlock._timestamp - startBlock!._timestamp).toString())

    // Wideness of the window in blocks.
    let windowBlocksCount = BigDecimal.fromString((currentBlock._blockNumber - startBlock!._blockNumber).toString())

    // Estimate block speed for the window in seconds.
    let blockSpeed = (WINDOW_SIZE_SECONDS_BD.div(windowSecondsCount)).times(windowBlocksCount)

    // block speed converted to 24 hour period.
    // let blockSpeedPerDay = (SECONDS_PER_DAY_BD.div(WINDOW_SIZE_SECONDS_BD)).times(blockSpeed)

    // Update BlockTracker with new values.
    blockTracker._blocks = blocks
    blockTracker._blocksPerSecond = blockSpeed
    blockTracker.save()  
    
    return blockTracker._blocksPerSecond
}

export function getOrCreateBlock(timestamp: i32, blockNumber: i32): _Block {
    let block = _Block.load(blockNumber.toString()) 
    if (!block) {
        block = new _Block(blockNumber.toString())
        block._blockNumber = blockNumber
        block._timestamp = timestamp
    }
    return block
}

export function getOrCreateWindowTracker(): _BlockTracker {
    let blockTracker = _BlockTracker.load("BlockTracker")

    if (!blockTracker) {
        blockTracker = new _BlockTracker("BlockTracker")

        blockTracker._blocks = []
        blockTracker._blocksPerSecond = BIGDECIMAL_ZERO

        blockTracker.save()
    }

    return blockTracker
}