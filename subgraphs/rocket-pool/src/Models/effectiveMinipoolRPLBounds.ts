import { BigInt } from "@graphprotocol/graph-ts";

export class EffectiveMinipoolRPLBounds {
  minimum: BigInt;
  maximum: BigInt;

  constructor() {
    this.minimum = BigInt.fromI32(0);
    this.maximum = BigInt.fromI32(0);
  }
}
