import { 
    BigInt, 
    BigDecimal, 
    Address,
    ethereum,
    log
} from "@graphprotocol/graph-ts";

import { 
    ZERO_BI, 
    ONE_BI,
} from "./constants"


export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
    /* Get the denominator to convert a token amount to BigDecimal */
    let bd = BigDecimal.fromString('1')
    for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
      bd = bd.times(BigDecimal.fromString('10'))
    }
    return bd
}

export function convertTokenToDecimal(tokenAmount: BigInt, decimals: BigInt): BigDecimal {
    /* Convert a BigInt tokenAmount to BigDecimal */
    if (decimals == ZERO_BI) {
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
  