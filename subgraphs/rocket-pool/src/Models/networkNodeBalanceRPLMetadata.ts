import { BigInt } from "@graphprotocol/graph-ts";

/**
 * Everything that is needed to calculate the network summaries (e.g. average) regarding RPL for a network node balance checkpoint.
 */
export class NetworkNodeBalanceRPLMetadata {
  totalNodesWithRewardClaim: BigInt;
  totalNodeRewardClaimCount: BigInt;
  totalNodesWithAnODAORewardClaim: BigInt;
  totalODAORewardClaimCount: BigInt;

  constructor() {
    this.totalNodesWithRewardClaim = BigInt.fromI32(0);
    this.totalNodeRewardClaimCount = BigInt.fromI32(0);
    this.totalNodesWithAnODAORewardClaim = BigInt.fromI32(0);
    this.totalODAORewardClaimCount = BigInt.fromI32(0);
  }
}
