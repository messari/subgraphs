import { ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import {
  NetworkNodeBalanceCheckpoint,
  Node,
  RocketPoolProtocol,
} from "../../generated/schema";
import { generalUtilities } from "./generalUtilities";
import { NetworkNodeBalanceMinipoolMetadata } from "../models/networkNodeBalanceMinipoolMetadata";
import { ONE_ETHER_IN_WEI } from "../constants/generalConstants";
import { NetworkNodeBalanceRPLMetadata } from "../models/networkNodeBalanceRPLMetadata";

class NodeUtilities {
  /**
   * Checks if there is already an indexed network node balance checkpoint for the given event.
   */
  public hasNetworkNodeBalanceCheckpointHasBeenIndexed(
    protocol: RocketPoolProtocol,
    event: ethereum.Event
  ): boolean {
    // If this specific event has been handled, then return true.
    if (
      NetworkNodeBalanceCheckpoint.load(
        generalUtilities.extractIdForEntity(event)
      ) !== null
    )
      return true;

    // No indexed protocol means there is no latest network node balance checkpoint.
    if (protocol === null) return false;

    /*
    Retrieve the latest network balance checkpoint.
    If there is none at the moment, return false because this hasnt been handled yet.
  */
    const latestNetworkNodeBalanceCheckpointId =
      protocol.lastNetworkNodeBalanceCheckPoint;
    if (latestNetworkNodeBalanceCheckpointId === null) return false;
    const latestNetworkNodeBalanceCheckpoint =
      NetworkNodeBalanceCheckpoint.load(latestNetworkNodeBalanceCheckpointId);
    if (
      latestNetworkNodeBalanceCheckpoint === null ||
      latestNetworkNodeBalanceCheckpoint.blockTime == BigInt.fromI32(0)
    )
      return false;

    // Get the date of the network node balance event candidate and the latest network node balance checkpoint.
    const dateOfNewNetworkNodeBalanceCheckpoint = new Date(
      event.block.timestamp.toI32() * 1000
    );
    const dateOfLatestNetworkNodeBalanceCheckpoint = new Date(
      latestNetworkNodeBalanceCheckpoint.blockTime.toI32() * 1000
    );

    // If the latest network node balance checkpoint and the candidate match in terms of day/month/year, then return false.
    return (
      dateOfNewNetworkNodeBalanceCheckpoint.getUTCFullYear() ==
        dateOfLatestNetworkNodeBalanceCheckpoint.getUTCFullYear() &&
      dateOfNewNetworkNodeBalanceCheckpoint.getUTCMonth() ==
        dateOfLatestNetworkNodeBalanceCheckpoint.getUTCMonth() &&
      dateOfNewNetworkNodeBalanceCheckpoint.getUTCDate() ==
        dateOfLatestNetworkNodeBalanceCheckpoint.getUTCDate()
    );
  }

  /**
   * Calculates and returns the minimum RPL a node operator needs as collateral for a minipool.
   */
  public getMinimumRPLForNewMinipool(
    nodeDepositAmount: BigInt,
    minimumEthCollateralRatio: BigInt,
    rplPrice: BigInt
  ): BigInt {
    if (
      nodeDepositAmount == BigInt.fromI32(0) ||
      minimumEthCollateralRatio == BigInt.fromI32(0) ||
      rplPrice == BigInt.fromI32(0)
    )
      return BigInt.fromI32(0);
    return nodeDepositAmount.times(minimumEthCollateralRatio).div(rplPrice);
  }

  /**
   * Calculates and returns the maximum RPL a node operator needs as collateral for a minipool.
   */
  public getMaximumRPLForNewMinipool(
    nodeDepositAmount: BigInt,
    maximumETHCollateralRatio: BigInt,
    rplPrice: BigInt
  ): BigInt {
    if (
      nodeDepositAmount == BigInt.fromI32(0) ||
      maximumETHCollateralRatio == BigInt.fromI32(0) ||
      rplPrice == BigInt.fromI32(0)
    )
      return BigInt.fromI32(0);
    return nodeDepositAmount.times(maximumETHCollateralRatio).div(rplPrice);
  }

  /**
   * Updates the network checkpoint based on the state of the node.
   * E.g. Increment running total (effective) RPL staked for this network checkpoint, ...
   */
  public updateNetworkNodeBalanceCheckpointForNode(
    networkCheckpoint: NetworkNodeBalanceCheckpoint,
    node: Node
  ): void {
    // Update total number of nodes registered.
    networkCheckpoint.nodesRegistered = networkCheckpoint.nodesRegistered.plus(
      BigInt.fromI32(1)
    );

    // Update total number of oracle nodes registered if needed.
    if (node.isOracleNode) {
      networkCheckpoint.oracleNodesRegistered =
        networkCheckpoint.oracleNodesRegistered.plus(BigInt.fromI32(1));
    }

    // Update total (effective) RPL staked.
    networkCheckpoint.rplStaked = networkCheckpoint.rplStaked.plus(
      node.rplStaked
    );
    networkCheckpoint.effectiveRPLStaked =
      networkCheckpoint.effectiveRPLStaked.plus(node.effectiveRPLStaked);

    // Update the total ETH RPL Slashed up to this checkpoint.
    networkCheckpoint.totalRPLSlashed = networkCheckpoint.totalRPLSlashed.plus(
      node.totalRPLSlashed
    );

    // Update total RPL rewards claimed up to this checkpoint.
    networkCheckpoint.totalODAORewardsClaimed =
      networkCheckpoint.totalODAORewardsClaimed.plus(
        node.totalODAORewardsClaimed
      );
    networkCheckpoint.totalNodeRewardsClaimed =
      networkCheckpoint.totalNodeRewardsClaimed.plus(
        node.totalNodeRewardsClaimed
      );

    // Update total number of minipools per state.
    networkCheckpoint.queuedMinipools = networkCheckpoint.queuedMinipools.plus(
      node.queuedMinipools
    );
    networkCheckpoint.stakingMinipools =
      networkCheckpoint.stakingMinipools.plus(node.stakingMinipools);
    networkCheckpoint.stakingUnbondedMinipools =
      networkCheckpoint.stakingUnbondedMinipools.plus(
        node.stakingUnbondedMinipools
      );
    networkCheckpoint.withdrawableMinipools =
      networkCheckpoint.withdrawableMinipools.plus(node.withdrawableMinipools);
    networkCheckpoint.totalFinalizedMinipools =
      networkCheckpoint.totalFinalizedMinipools.plus(
        node.totalFinalizedMinipools
      );

    networkCheckpoint.save();
  }

  /**
   * Updates the metadata with the relevant state from the node.
   */
  public updateMinipoolMetadataWithNode(
    minipoolMetadata: NetworkNodeBalanceMinipoolMetadata,
    node: Node
  ): void {
    // We need this to calculate the averages on the network level.
    if (node.averageFeeForActiveMinipools > BigInt.fromI32(0)) {
      minipoolMetadata.totalAverageFeeForAllActiveMinipools =
        minipoolMetadata.totalAverageFeeForAllActiveMinipools.plus(
          node.averageFeeForActiveMinipools.divDecimal(
            BigDecimal.fromString(ONE_ETHER_IN_WEI.toString())
          )
        );
      minipoolMetadata.totalNodesWithActiveMinipools =
        minipoolMetadata.totalNodesWithActiveMinipools.plus(BigInt.fromI32(1));
    }

    // Update thte total minimum/maximum effective RPL grand total for the current network node balance checkpoint.
    minipoolMetadata.totalMinimumEffectiveRPL =
      minipoolMetadata.totalMinimumEffectiveRPL.plus(node.minimumEffectiveRPL);
    minipoolMetadata.totalMaximumEffectiveRPL =
      minipoolMetadata.totalMaximumEffectiveRPL.plus(node.maximumEffectiveRPL);
  }

  /**
   * Updates the metadata with the relevant state from the node.
   */
  public updateRPLMetadataWithNode(
    rplMetadata: NetworkNodeBalanceRPLMetadata,
    node: Node
  ): void {
    // We need these to calculate the averages on the network level.
    if (node.totalODAORewardsClaimed > BigInt.fromI32(0)) {
      rplMetadata.totalNodesWithAnODAORewardClaim =
        rplMetadata.totalNodesWithAnODAORewardClaim.plus(BigInt.fromI32(1));
    }

    if (node.odaoRewardClaimCount > BigInt.fromI32(0)) {
      rplMetadata.totalODAORewardClaimCount =
        rplMetadata.totalODAORewardClaimCount.plus(node.odaoRewardClaimCount);
    }

    if (node.totalNodeRewardsClaimed > BigInt.fromI32(0)) {
      rplMetadata.totalNodesWithRewardClaim =
        rplMetadata.totalNodesWithRewardClaim.plus(BigInt.fromI32(1));
    }

    if (node.nodeRewardClaimCount > BigInt.fromI32(0)) {
      rplMetadata.totalNodeRewardClaimCount =
        rplMetadata.totalNodeRewardClaimCount.plus(node.nodeRewardClaimCount);
    }
  }

  /**
   * Updates the network node balance checkpoint based on the given minipool metadata.
   * E.G. Calculate the average node fee for the active minipools, ...
   */
  public updateNetworkNodeBalanceCheckpointForMinipoolMetadata(
    checkpoint: NetworkNodeBalanceCheckpoint,
    minipoolMetadata: NetworkNodeBalanceMinipoolMetadata
  ): void {
    // Calculate the network fee average for active minipools if possible.
    if (
      minipoolMetadata.totalNodesWithActiveMinipools > BigInt.fromI32(0) &&
      minipoolMetadata.totalAverageFeeForAllActiveMinipools >
        BigDecimal.fromString("0")
    ) {
      // Store this in WEI.
      checkpoint.averageFeeForActiveMinipools = BigInt.fromString(
        minipoolMetadata.totalAverageFeeForAllActiveMinipools
          .div(
            BigDecimal.fromString(
              minipoolMetadata.totalNodesWithActiveMinipools.toString()
            )
          )
          .times(BigDecimal.fromString(ONE_ETHER_IN_WEI.toString()))
          .truncate(0)
          .toString()
      );
    }

    // Calculate total RPL needed to min/max collateralize the staking minipools at this checkpoint.
    checkpoint.minimumEffectiveRPL = minipoolMetadata.totalMinimumEffectiveRPL;
    checkpoint.maximumEffectiveRPL = minipoolMetadata.totalMaximumEffectiveRPL;

    checkpoint.save();
  }

  /**
   * Updates the network node balance checkpoint based on the given rpl metadata.
   * E.G. Calculate the average RPL reward claims
   */
  public updateNetworkNodeBalanceCheckpointForRPLMetadata(
    checkpoint: NetworkNodeBalanceCheckpoint,
    rplMetadata: NetworkNodeBalanceRPLMetadata
  ): void {
    // Calculate the network RPL claim averages if possible.
    if (
      rplMetadata.totalNodesWithAnODAORewardClaim > BigInt.fromI32(0) &&
      checkpoint.totalODAORewardsClaimed > BigInt.fromI32(0)
    ) {
      // Store this in WEI.
      checkpoint.averageTotalODAORewardsClaimed =
        checkpoint.totalODAORewardsClaimed.div(
          rplMetadata.totalNodesWithAnODAORewardClaim
        );
    }

    if (
      rplMetadata.totalODAORewardClaimCount > BigInt.fromI32(0) &&
      checkpoint.totalODAORewardsClaimed > BigInt.fromI32(0)
    ) {
      checkpoint.averageODAORewardClaim =
        checkpoint.totalODAORewardsClaimed.div(
          rplMetadata.totalODAORewardClaimCount
        );
    }

    if (
      rplMetadata.totalNodesWithRewardClaim > BigInt.fromI32(0) &&
      checkpoint.totalNodeRewardsClaimed > BigInt.fromI32(0)
    ) {
      // Store this in WEI.
      checkpoint.averageNodeTotalRewardsClaimed =
        checkpoint.totalNodeRewardsClaimed.div(
          rplMetadata.totalNodesWithRewardClaim
        );
    }

    if (
      rplMetadata.totalNodeRewardClaimCount > BigInt.fromI32(0) &&
      checkpoint.totalNodeRewardsClaimed > BigInt.fromI32(0)
    ) {
      checkpoint.averageNodeRewardClaim =
        checkpoint.totalNodeRewardsClaimed.div(
          rplMetadata.totalNodeRewardClaimCount
        );
    }

    checkpoint.save();
  }

  /**
   * If the running totals of the given checkpoint are 0, then we can take it from the previous one.
   */
  public coerceRunningTotalsBasedOnPreviousCheckpoint(
    checkpoint: NetworkNodeBalanceCheckpoint,
    previousCheckpoint: NetworkNodeBalanceCheckpoint | null
  ): void {
    if (previousCheckpoint === null) return;

    // If for some reason our total claimed RPL rewards (per type) up to this checkpoint was 0, then we try to set it based on the previous checkpoint.
    if (
      checkpoint.totalODAORewardsClaimed == BigInt.fromI32(0) &&
      previousCheckpoint.totalODAORewardsClaimed > BigInt.fromI32(0)
    ) {
      checkpoint.totalODAORewardsClaimed =
        previousCheckpoint.totalODAORewardsClaimed;
    }

    if (
      checkpoint.totalNodeRewardsClaimed == BigInt.fromI32(0) &&
      previousCheckpoint.totalNodeRewardsClaimed > BigInt.fromI32(0)
    ) {
      checkpoint.totalNodeRewardsClaimed =
        previousCheckpoint.totalNodeRewardsClaimed;
    }

    if (
      checkpoint.averageODAORewardClaim == BigInt.fromI32(0) &&
      previousCheckpoint.averageODAORewardClaim > BigInt.fromI32(0)
    ) {
      checkpoint.averageODAORewardClaim =
        previousCheckpoint.averageODAORewardClaim;
    }

    if (
      checkpoint.averageTotalODAORewardsClaimed == BigInt.fromI32(0) &&
      previousCheckpoint.averageTotalODAORewardsClaimed > BigInt.fromI32(0)
    ) {
      checkpoint.averageTotalODAORewardsClaimed =
        previousCheckpoint.averageTotalODAORewardsClaimed;
    }

    if (
      checkpoint.averageNodeRewardClaim == BigInt.fromI32(0) &&
      previousCheckpoint.averageNodeRewardClaim > BigInt.fromI32(0)
    ) {
      checkpoint.averageNodeRewardClaim =
        previousCheckpoint.averageNodeRewardClaim;
    }

    if (
      checkpoint.averageNodeTotalRewardsClaimed == BigInt.fromI32(0) &&
      previousCheckpoint.averageNodeTotalRewardsClaimed > BigInt.fromI32(0)
    ) {
      checkpoint.averageNodeTotalRewardsClaimed =
        previousCheckpoint.averageNodeTotalRewardsClaimed;
    }

    // If for some reason our total slashed RPL rewards up to this checkpoint was 0, then we try to set it based on the previous checkpoint.
    if (
      checkpoint.totalRPLSlashed == BigInt.fromI32(0) &&
      previousCheckpoint.totalRPLSlashed > BigInt.fromI32(0)
    ) {
      checkpoint.totalRPLSlashed = previousCheckpoint.totalRPLSlashed;
    }

    // If for some reason our total finalized minipools up to this checkpoint was 0, then we try to set it based on the previous checkpoint.
    if (
      checkpoint.totalFinalizedMinipools == BigInt.fromI32(0) &&
      previousCheckpoint.totalFinalizedMinipools > BigInt.fromI32(0)
    ) {
      checkpoint.totalFinalizedMinipools =
        previousCheckpoint.totalFinalizedMinipools;
    }

    checkpoint.save();
  }
}

export const nodeUtilities = new NodeUtilities();
