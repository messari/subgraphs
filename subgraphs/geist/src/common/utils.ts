import { 
    BigInt, 
    BigDecimal, 
    Address,
    ethereum,
    log
} from "@graphprotocol/graph-ts";

import * as constants from "../common/constants"


export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
    /* Get the denominator to convert a token amount to BigDecimal */
    let bd = BigDecimal.fromString('1')
    for (let i = constants.ZERO_BI; i.lt(decimals as BigInt); i = i.plus(constants.ONE_BI)) {
      bd = bd.times(BigDecimal.fromString('10'))
    }
    return bd
}

export function convertTokenToDecimal(tokenAmount: BigInt, decimals: BigInt): BigDecimal {
    /* Convert a BigInt tokenAmount to BigDecimal */
    if (decimals == constants.ZERO_BI) {
      return tokenAmount.toBigDecimal()
    }
    return tokenAmount.toBigDecimal().div(exponentToBigDecimal(decimals))
}

export function getTimeInMillis(time: BigInt): BigInt {
    return time.times(BigInt.fromI32(1000));
}

export function getTimestampInMillis(block: ethereum.Block): BigInt {
    return block.timestamp.times(BigInt.fromI32(1000));
}

export function bigIntToPercentage(n: BigInt): BigDecimal {
    return n.toBigDecimal().div(BigDecimal.fromString("100"))
}

export function getDaysSinceUnixEpoch(timestamp: BigInt): i64 {
    return timestamp.toI64() / constants.SECONDS_PER_DAY;
}
