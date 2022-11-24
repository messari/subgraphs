import { BigInt } from "@graphprotocol/graph-ts";
import { BIGINT_ZERO } from "../utils/constants";

export class StakerBalance {
  currentRETHBalance: BigInt;
  currentETHBalance: BigInt;
  previousRETHBalance: BigInt;
  previousETHBalance: BigInt;

  constructor() {
    this.currentRETHBalance = BIGINT_ZERO;
    this.currentETHBalance = BIGINT_ZERO;
    this.previousRETHBalance = BIGINT_ZERO;
    this.previousETHBalance = BIGINT_ZERO;
  }
}
