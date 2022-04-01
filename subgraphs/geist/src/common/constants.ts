import { 
    BigInt, 
    BigDecimal,
    Address,
} from "@graphprotocol/graph-ts";

// BigInt 0 and 1
export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);

// BigDecimal 0 and 1
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");

export let ZERO_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000")

// Set Protocol ID to the registry address
export const PROTOCOL_ID = "0x4CF8E50A5ac16731FA2D8D9591E195A285eCaA82";
export const NETWORK_FANTOM = "FANTOM";
export const PROTOCOL_TYPE_LENDING = "LENDING";

export const DEFAULT_DECIMALS = 18;
export const SECONDS_PER_DAY = 86400;

// Types of reward tokens
export const REWARD_TYPE_DEPOSIT = "DEPOSIT";
export const REWARD_TYPE_BORROW = "BORROW";


// Interaction types for snapshot calculations
export const DEPOSIT_INTERACTION = "DEPOSIT";
export const WITHDRAW_INTERACTION = "WITHDRAW";
export const BORROW_INTERACTION = "BORROW";
export const REWARD_INTERACTION = "REWARD";
export const REPAY_INTERACTION = "REPAY";
export const STAKE_INTERACTION = "STAKE";
export const UNSTAKE_INTERACTION = "UNSTAKE";
export const LIQUIDATION_INTERACTION = "LIQUIDATION";

// Protocol lending type
export const LENDING_TYPE_POOLED = "POOLED";
export const LENDING_TYPE_CDP = "CDP";

// Protocol risk type
export const RISK_TYPE_GLOBAL = "GLOBAL";
export const RISK_TYPE_ISOLATED = "ISOLATED";
