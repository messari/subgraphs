import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

/**
 * Everything that is needed to calculate the network summaries (e.g. average) for a network node balance checkpoint.
 */
export class NetworkNodeBalanceMinipoolMetadata {
  totalNodesWithActiveMinipools: BigInt;
  totalAverageFeeForAllActiveMinipools: BigDecimal;
  totalMinimumEffectiveRPL: BigInt;
  totalMaximumEffectiveRPL: BigInt;

  constructor() {
    this.totalNodesWithActiveMinipools = BigInt.fromI32(0);
    this.totalAverageFeeForAllActiveMinipools = BigDecimal.fromString("0");
    this.totalMinimumEffectiveRPL = BigInt.fromI32(0);
    this.totalMaximumEffectiveRPL = BigInt.fromI32(0);
  }
}
