import WadRayMath from "./wadRayMath";
import { IMaths } from "./mathsInterface";
import { BigInt } from "@graphprotocol/graph-ts";

export class AaveMath implements IMaths {
  INDEX_ONE(): BigInt {
    return WadRayMath.RAY;
  }

  indexMul(x: BigInt, y: BigInt): BigInt {
    return WadRayMath.rayMul(x, y);
  }

  indexDiv(x: BigInt, y: BigInt): BigInt {
    return WadRayMath.rayDiv(x, y);
  }
}
