/* eslint-disable @typescript-eslint/no-magic-numbers */
import { BigInt } from "@graphprotocol/graph-ts";
import { BIGINT_ONE, BIGINT_TWO } from "../../constants";

const BASE_PERCENT: BigInt = BigInt.fromI32(10_000);
const HALF_PERCENT: BigInt = BASE_PERCENT.div(BIGINT_TWO);

class PercentMath {
  static BASE_PERCENT: BigInt = BASE_PERCENT;
  static HALF_PERCENT: BigInt = HALF_PERCENT;

  static percentMul(x: BigInt, percent: BigInt): BigInt {
    if (x.isZero() || percent.isZero()) return BigInt.zero();
    return x.times(percent).plus(this.HALF_PERCENT).div(this.BASE_PERCENT);
  }

  static percentDiv(x: BigInt, percent: BigInt): BigInt {
    if (x.isZero() || percent.isZero()) return BigInt.zero();
    return x
      .times(this.BASE_PERCENT)
      .plus(percent.div(BIGINT_TWO))
      .div(percent);
  }

  static weiToPercent(weiNumber: BigInt): BigInt {
    const tenExponent14 = BigInt.fromI32(10).pow(14);
    return weiNumber
      .times(this.BASE_PERCENT)
      .div(tenExponent14)
      .plus(this.HALF_PERCENT)
      .div(this.BASE_PERCENT);
  }

  static percentDivUp(x: BigInt, percent: BigInt): BigInt {
    return x
      .times(this.BASE_PERCENT)
      .plus(percent.minus(BIGINT_ONE))
      .div(percent);
  }

  static weightedAvg(x: BigInt, y: BigInt, percent: BigInt): BigInt {
    const z = this.BASE_PERCENT.minus(percent);
    return x
      .times(z)
      .plus(y.times(percent))
      .plus(this.HALF_PERCENT)
      .div(this.BASE_PERCENT);
  }
}

export default PercentMath;
