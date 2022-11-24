import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { BIGINT_ZERO, BIGDECIMAL_ZERO } from "../utils/constants";

/**
 * Everything that is needed to calculate the network summaries (e.g. average) for a network node balance checkpoint.
 */
export class NetworkNodeBalanceMinipoolMetadata {
  totalNodesWithActiveMinipools: BigInt;
  totalAverageFeeForAllActiveMinipools: BigDecimal;
  totalMinimumEffectiveRPL: BigInt;
  totalMaximumEffectiveRPL: BigInt;

  constructor() {
    this.totalNodesWithActiveMinipools = BIGINT_ZERO;
    this.totalAverageFeeForAllActiveMinipools = BIGDECIMAL_ZERO;
    this.totalMinimumEffectiveRPL = BIGINT_ZERO;
    this.totalMaximumEffectiveRPL = BIGINT_ZERO;
  }
}
