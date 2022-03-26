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
export const PROTOCOL_TYPE         = "LENDING"
export const LENDING_TYPE          = "CDP" // TODO: guess - look more into this to verify
export const PROTOCOL_RISK_TYPE    = "ISOLATED" // TODO: ensure this is accurate
export const PROTOCOL_NAME         = "Compound v2"
export const PROTOCOL_SLUG         = "compound-v2"
export const REWARD_TOKEN_TYPE     = "DEPOSIT" // TODO: check - seems like both
export const PROTOCOL_VERSION      = "1.1.3"

export const COMPOUND_DECIMALS = 8
export const USDC_DECIMALS = 6
export const UNIX_DAY = 86400
