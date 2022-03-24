// store common variables

import { 
    BigInt, 
    BigDecimal, 
} from "@graphprotocol/graph-ts"

// BigInt 0 and 1
export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI  = BigInt.fromI32(1)

// BigDecimal 0 and 1
export let ZERO_BD = BigDecimal.fromString("0")
export let ONE_BD  = BigDecimal.fromString("1")

// protocol constants
export const NETWORK_ETHEREUM      = "ETHEREUM"
export const PROTOCOL_TYPE_LENDING = "LENDING"
export const PROTOCOL_NAME         = "Compound v2"
export const PROTOCOL_SLUG         = "compound-v2"
export const PROTOCOL_VERSION      = "1.0.0"

export const DEFAULT_DECIMALS = 18
export const COMPOUND_DECIMALS = 8
export const UNIX_DAY = 86400

// TODO: do I need the names/symbols for each token or is that possible from mapping?

// TODO: don't think this is needed
// Interaction types for snapshot calculations
// export const DEPOSIT_INTERACTION = "DEPOSIT";
// export const WITHDRAW_INTERACTION = "WITHDRAW";
// export const BORROW_INTERACTION = "BORROW";
// export const REWARD_INTERACTION = "REWARD";
// export const REPAY_INTERACTION = "REPAY";