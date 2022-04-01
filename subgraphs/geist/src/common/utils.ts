import { 
    BigInt, 
    BigDecimal, 
    Address,
    ethereum,
    log,
    dataSource
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

export function convertBigIntToBigDecimal(tokenAmount: BigInt, decimals: BigInt = BigInt.fromI32(18)): BigDecimal {
    /* Convert a BigInt tokenAmount to BigDecimal */
    if (decimals == constants.ZERO_BI) {
      return tokenAmount.toBigDecimal()
    }
    return tokenAmount.toBigDecimal().div(exponentToBigDecimal(decimals))
}

export function getTimeInMillis(time: BigInt): BigInt {
    /* Convert a second time to millisecond time */
    return time.times(BigInt.fromI32(1000));
}

export function getTimestampInMillis(block: ethereum.Block): BigInt {
    /* Convert a event timestamp to millisecond time */
    return block.timestamp.times(BigInt.fromI32(1000));
}

export function bigIntToPercentage(num: BigInt): BigDecimal {
    /* Convert an integer to a percentage out of 100 */
    return num.toBigDecimal().div(BigDecimal.fromString("100"))
}

export function getDaysSinceUnixEpoch(timestamp: BigInt): i64 {
    /* Number of days since the Unix Epoch on Jan 1 1970 */
    return timestamp.toI64() / constants.SECONDS_PER_DAY;
}

export function convertRayToWad(num: BigInt): BigInt {
    /* Ray has 27 decimal places, Wad has 18 decimal places */
    let halfRatio = BigInt.fromI32(10).pow(9).div(BigInt.fromI32(2));
    return halfRatio.plus(num).div(BigInt.fromI32(10).pow(9));
}

export function convertWadToRay(num: BigInt): BigInt {
    /* Ray has 27 decimal places, Wad has 18 decimal places */
    let result = num.times(BigInt.fromI32(10).pow(9));
    return result;
  }

export function getDataFromContext(data: string): string {
    /* Get data using the context, eg. data="lendingPool", "protocolId" etc. */
    let context = dataSource.context();
    return context.getString(data);
}