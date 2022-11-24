import { BigInt } from "@graphprotocol/graph-ts";
import { BIGINT_ZERO } from "../utils/constants";

export class EffectiveMinipoolRPLBounds {
  minimum: BigInt;
  maximum: BigInt;

  constructor() {
    this.minimum = BIGINT_ZERO;
    this.maximum = BIGINT_ZERO;
  }
}
