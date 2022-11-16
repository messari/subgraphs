import { BigInt } from "@graphprotocol/graph-ts";

export class StakerBalance {
  currentRETHBalance: BigInt;
  currentETHBalance: BigInt;
  previousRETHBalance: BigInt;
  previousETHBalance: BigInt;

  constructor() {
    this.currentRETHBalance = BigInt.fromI32(0);
    this.currentETHBalance = BigInt.fromI32(0);
    this.previousRETHBalance = BigInt.fromI32(0);
    this.previousETHBalance = BigInt.fromI32(0);
  }
}
