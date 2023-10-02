import { BigInt } from "@graphprotocol/graph-ts";
import {
  RAY_BI,
  WAD_BI,
  BIGINT_ONE,
  BIGINT_TWO,
  HALF_RAY_BI,
  HALF_WAD_BI,
  WAD_RAY_RATIO,
  HALF_WAD_RAY_RATIO,
} from "../../constants";

class WadRayMath {
  static WAD: BigInt = WAD_BI;
  static halfWAD: BigInt = HALF_WAD_BI;
  static RAY: BigInt = RAY_BI;
  static halfRAY: BigInt = HALF_RAY_BI;

  static wadMul(x: BigInt, y: BigInt): BigInt {
    if (x.isZero() || y.isZero()) return BigInt.zero();
    return this.halfWAD.plus(x.times(y)).div(this.WAD);
  }

  static wadDiv(x: BigInt, y: BigInt): BigInt {
    return x.times(this.WAD).plus(y.div(BIGINT_TWO)).div(y);
  }

  static rayMul(x: BigInt, y: BigInt): BigInt {
    if (x.isZero() || y.isZero()) return BigInt.zero();
    return this.halfRAY.plus(x.times(y)).div(this.RAY);
  }

  static rayDiv(x: BigInt, y: BigInt): BigInt {
    return x.times(this.RAY).plus(y.div(BIGINT_TWO)).div(y);
  }

  static rayToWad(x: BigInt): BigInt {
    const y = x.div(WAD_RAY_RATIO);
    // If x % RAY_WAD_RATIO >= HALF_RAY_WAD_RATIO, round up.
    return y.plus(
      x.mod(WAD_RAY_RATIO).ge(HALF_WAD_RAY_RATIO)
        ? HALF_WAD_RAY_RATIO
        : BigInt.zero()
    );
  }

  static wadToRay(x: BigInt): BigInt {
    return x.times(WAD_RAY_RATIO);
  }

  static wadDivUp(x: BigInt, y: BigInt): BigInt {
    return x.times(this.WAD).plus(y.minus(BIGINT_ONE)).div(y);
  }

  static rayDivUp(x: BigInt, y: BigInt): BigInt {
    return x.times(this.RAY).plus(y.minus(BIGINT_ONE)).div(y);
  }
}

export default WadRayMath;
