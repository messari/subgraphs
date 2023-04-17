import * as constants from "./constants";
import { ERC20 } from "../../../../generated/MapleGlobals/ERC20";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";

export function readValue<T>(callResult: ethereum.CallResult<T>, defaultValue: T): T {
    return callResult.reverted ? defaultValue : callResult.value;
}

export function getTokenDecimals(tokenAddr: Address): BigInt {
    const token = ERC20.bind(tokenAddr);

    const decimals = BigInt.fromI32(readValue<i32>(token.try_decimals(), constants.DEFAULT_DECIMALS.toI32()));

    return decimals;
}
