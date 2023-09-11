import WadRayMath from "./wadRayMath";
import { IMaths } from "./mathsInterface";
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
