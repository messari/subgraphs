import WadRayMath from "./WadRayMath";
import { IMaths } from "./maths.interface";
import { BigInt } from "@graphprotocol/graph-ts";

export class CompoundMath implements IMaths {
  INDEX_ONE(): BigInt {
    return WadRayMath.WAD;
  }

  indexMul(x: BigInt, y: BigInt): BigInt {
    return WadRayMath.wadMul(x, y);
  }

  indexDiv(x: BigInt, y: BigInt): BigInt {
    return WadRayMath.wadDiv(x, y);
  }
}
