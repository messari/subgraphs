import { BigInt } from "@graphprotocol/graph-ts";
import { BIGINT_ZERO } from "../utils/constants";

/**
 * Everything that is needed to calculate the network summaries (e.g. average) regarding RPL for a network node balance checkpoint.
 */
export class NetworkNodeBalanceRPLMetadata {
  totalNodesWithRewardClaim: BigInt;
  totalNodeRewardClaimCount: BigInt;
  totalNodesWithAnODAORewardClaim: BigInt;
  totalODAORewardClaimCount: BigInt;

  constructor() {
    this.totalNodesWithRewardClaim = BIGINT_ZERO;
    this.totalNodeRewardClaimCount = BIGINT_ZERO;
    this.totalNodesWithAnODAORewardClaim = BIGINT_ZERO;
    this.totalODAORewardClaimCount = BIGINT_ZERO;
  }
}
