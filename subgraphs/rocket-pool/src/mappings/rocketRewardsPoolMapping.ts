import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  RewardSnapshot,
  rocketRewardsPool,
  RPLTokensClaimed,
} from "../../generated/templates/rocketRewardsPool/rocketRewardsPool";
import { rocketNetworkPrices } from "../../generated/templates/rocketRewardsPool/rocketNetworkPrices";
import {
  RPLRewardInterval,
  Node,
  RPLRewardSubmitted,
} from "../../generated/schema";
import { generalUtilities } from "../checkpoints/generalUtilities";
import { rocketPoolEntityFactory } from "../entityFactory";
import {
  ONE_ETHER_IN_WEI,
  ROCKETPOOL_RPL_REWARD_INTERVAL_ID_PREFIX,
} from "../constants/generalConstants";
import { RocketContractNames } from "../constants/contractConstants";
import {
  RPLREWARDCLAIMERTYPE_PDAO,
  RPLREWARDCLAIMERTYPE_ODAO,
  RPLREWARDCLAIMERTYPE_NODE,
} from "../constants/enumConstants";
import { updateUsageMetrics } from "../updaters/usageMetrics";
import {
  updateSnapshotsTvl,
  updateTotalRewardsMetrics,
} from "../updaters/financialMetrics";
import { getRocketContract } from "../entities/rocketContracts";

/**
 * Occurs when an eligible stakeholder on the protocol claims an RPL reward.
 */
export function handleRPLTokensClaimed(event: RPLTokensClaimed): void {
  if (
    event === null ||
    event.params === null ||
    event.params.claimingAddress === null ||
    event.params.claimingContract === null ||
    event.block === null
  )
    return;

  // Protocol entity should exist, if not, then we attempt to create it.
  let protocol = generalUtilities.getRocketPoolProtocolEntity();
  if (protocol === null || protocol.id == null) {
    protocol = rocketPoolEntityFactory.createRocketPoolProtocol();
  }
  if (protocol === null) return;

  // We will need the rocketvault smart contract state to get specific addresses.
  // We will need the rocket rewards pool contract to get its smart contract state.
  const rocketRewardPoolContract = rocketRewardsPool.bind(event.address);

  // We need to retrieve the last RPL rewards interval so we can compare it to the current state in the smart contracts.
  let activeIndexedRewardInterval: RPLRewardInterval | null = null;
  const lastRPLRewardIntervalId = protocol.lastRPLRewardInterval;
  if (lastRPLRewardIntervalId != null) {
    activeIndexedRewardInterval = RPLRewardInterval.load(
      <string>lastRPLRewardIntervalId
    );
  }

  // Determine claimer type based on the claiming contract and/or claiming address.
  const rplRewardClaimerType: string | null = getRplRewardClaimerType(
    event.params.claimingContract,
    event.params.claimingAddress
  );

  // Something is wrong; the contract associated with this claim couldn't be processed.
  // Maybe this implementation needs to be updated as a result of a contract upgrade of RocketPool.
  if (rplRewardClaimerType == null) return;

  // If we don't have an indexed RPL Reward interval,
  // or if the last indexed RPL Reward interval isn't equal to the current one in the smart contracts:
  const claimIntervalTimeStartCall =
    rocketRewardPoolContract.try_getClaimIntervalTimeStart();
  if (claimIntervalTimeStartCall.reverted) return;
  const smartContractCurrentRewardIntervalStartTime =
    claimIntervalTimeStartCall.value;
  let previousActiveIndexedRewardInterval: RPLRewardInterval | null = null;
  let previousActiveIndexedRewardIntervalId: string | null = null;
  if (
    activeIndexedRewardInterval === null ||
    activeIndexedRewardInterval.intervalStartTime !=
      smartContractCurrentRewardIntervalStartTime
  ) {
    // If there was an indexed RPL Reward interval which has a different start time then the interval in the smart contracts.
    if (activeIndexedRewardInterval !== null) {
      // We need to close our indexed RPL Rewards interval.
      activeIndexedRewardInterval.intervalClosedTime = event.block.timestamp;
      activeIndexedRewardInterval.isClosed = true;
      activeIndexedRewardInterval.intervalDurationActual =
        event.block.timestamp.minus(
          activeIndexedRewardInterval.intervalStartTime
        );
      if (
        activeIndexedRewardInterval.intervalDurationActual!.lt(
          BigInt.fromI32(0)
        )
      ) {
        activeIndexedRewardInterval.intervalDurationActual =
          activeIndexedRewardInterval.intervalDuration;
      }
      previousActiveIndexedRewardInterval = activeIndexedRewardInterval;
      previousActiveIndexedRewardIntervalId =
        previousActiveIndexedRewardInterval.id;
    }

    // Create a new RPL Reward interval so we can add this first claim to it.
    const claimIntervalRewardsTotalCall =
      rocketRewardPoolContract.try_getClaimIntervalRewardsTotal();
    if (claimIntervalRewardsTotalCall.reverted) return;

    const claimIntervalTimeCall =
      rocketRewardPoolContract.try_getClaimIntervalTime();
    if (claimIntervalTimeCall.reverted) return;

    activeIndexedRewardInterval =
      rocketPoolEntityFactory.createRPLRewardInterval(
        ROCKETPOOL_RPL_REWARD_INTERVAL_ID_PREFIX +
          generalUtilities.extractIdForEntity(event),
        previousActiveIndexedRewardIntervalId,
        claimIntervalRewardsTotalCall.value,
        getClaimingContractAllowance(RPLREWARDCLAIMERTYPE_PDAO, event.address),
        getClaimingContractAllowance(RPLREWARDCLAIMERTYPE_ODAO, event.address),
        getClaimingContractAllowance(RPLREWARDCLAIMERTYPE_NODE, event.address),
        previousActiveIndexedRewardInterval !== null &&
          previousActiveIndexedRewardInterval.claimableRewards >
            BigInt.fromI32(0)
          ? previousActiveIndexedRewardInterval.claimableRewards.minus(
              previousActiveIndexedRewardInterval.totalRPLClaimed
            )
          : BigInt.fromI32(0),
        smartContractCurrentRewardIntervalStartTime,
        claimIntervalTimeCall.value,
        event.block.number,
        event.block.timestamp
      );
    if (activeIndexedRewardInterval === null) return;
    protocol.lastRPLRewardInterval = activeIndexedRewardInterval.id;

    if (previousActiveIndexedRewardInterval !== null) {
      previousActiveIndexedRewardInterval.nextIntervalId =
        activeIndexedRewardInterval.id;
    }
  }
  if (activeIndexedRewardInterval === null) return;

  // We need this to determine the current RPL/ETH price based on the smart contracts.
  // If for some reason this fails, something is horribly wrong and we need to stop indexing.
  const networkPricesContractEntity = getRocketContract(
    RocketContractNames.ROCKET_NETWORK_PRICES
  );
  const networkPricesContract = rocketNetworkPrices.bind(
    Address.fromBytes(networkPricesContractEntity.latestAddress)
  );
  const rplPriceCall = networkPricesContract.try_getRPLPrice();
  if (rplPriceCall.reverted) return;
  const rplETHExchangeRate = rplPriceCall.value;
  let rplRewardETHAmount = BigInt.fromI32(0);
  if (rplETHExchangeRate > BigInt.fromI32(0)) {
    rplRewardETHAmount = event.params.amount
      .times(rplETHExchangeRate)
      .div(ONE_ETHER_IN_WEI);
  }

  // Create a new reward claim.
  const rplRewardClaim = rocketPoolEntityFactory.createRPLRewardClaim(
    generalUtilities.extractIdForEntity(event),
    activeIndexedRewardInterval.id,
    event.params.claimingAddress.toHexString(),
    <string>rplRewardClaimerType,
    event.params.amount,
    rplRewardETHAmount,
    event.transaction.hash.toHexString(),
    event.block.number,
    event.block.timestamp
  );
  if (rplRewardClaim === null) return;

  // If the claimer was a node..
  const associatedNode = Node.load(event.params.claimingAddress.toHexString());
  if (
    associatedNode !== null &&
    (rplRewardClaimerType == RPLREWARDCLAIMERTYPE_ODAO ||
      rplRewardClaimerType == RPLREWARDCLAIMERTYPE_NODE)
  ) {
    // Depending on if the node is an oracle node..
    if (rplRewardClaimerType == RPLREWARDCLAIMERTYPE_ODAO) {
      // Update state for node & this ODAO reward claim.
      associatedNode.totalODAORewardsClaimed =
        associatedNode.totalODAORewardsClaimed.plus(event.params.amount);
      associatedNode.odaoRewardClaimCount =
        associatedNode.odaoRewardClaimCount.plus(BigInt.fromI32(1));
      associatedNode.averageODAORewardClaim =
        associatedNode.totalODAORewardsClaimed.div(
          associatedNode.odaoRewardClaimCount
        );

      // Update state for active interval & this ODAO reward claim.
      activeIndexedRewardInterval.totalODAORewardsClaimed =
        activeIndexedRewardInterval.totalODAORewardsClaimed.plus(
          event.params.amount
        );
      activeIndexedRewardInterval.odaoRewardClaimCount =
        activeIndexedRewardInterval.odaoRewardClaimCount.plus(
          BigInt.fromI32(1)
        );
    } else {
      // Update state for node & this regular reward claim.
      associatedNode.totalNodeRewardsClaimed =
        associatedNode.totalNodeRewardsClaimed.plus(event.params.amount);
      associatedNode.nodeRewardClaimCount =
        associatedNode.nodeRewardClaimCount.plus(BigInt.fromI32(1));
      associatedNode.averageNodeRewardClaim =
        associatedNode.totalNodeRewardsClaimed.div(
          associatedNode.nodeRewardClaimCount
        );

      // Update state for active interval & this regular reward claim.
      activeIndexedRewardInterval.totalNodeRewardsClaimed =
        activeIndexedRewardInterval.totalNodeRewardsClaimed.plus(
          event.params.amount
        );
      activeIndexedRewardInterval.nodeRewardClaimCount =
        activeIndexedRewardInterval.nodeRewardClaimCount.plus(
          BigInt.fromI32(1)
        );
    }
  } else if (rplRewardClaimerType == RPLREWARDCLAIMERTYPE_PDAO) {
    // If the claim was made by the PDAO, increment the total on the active interval.
    activeIndexedRewardInterval.totalPDAORewardsClaimed =
      activeIndexedRewardInterval.totalPDAORewardsClaimed.plus(
        event.params.amount
      );
  }

  // Update the grand total claimed of the current interval.
  activeIndexedRewardInterval.totalRPLClaimed =
    activeIndexedRewardInterval.totalRPLClaimed.plus(rplRewardClaim.amount);

  // Update the averages claimed of the current interval per contract type.
  if (
    activeIndexedRewardInterval.totalODAORewardsClaimed > BigInt.fromI32(0) &&
    activeIndexedRewardInterval.odaoRewardClaimCount > BigInt.fromI32(0)
  ) {
    activeIndexedRewardInterval.averageODAORewardClaim =
      activeIndexedRewardInterval.totalODAORewardsClaimed.div(
        activeIndexedRewardInterval.odaoRewardClaimCount
      );
  }

  if (
    activeIndexedRewardInterval.totalNodeRewardsClaimed > BigInt.fromI32(0) &&
    activeIndexedRewardInterval.nodeRewardClaimCount > BigInt.fromI32(0)
  ) {
    activeIndexedRewardInterval.averageNodeRewardClaim =
      activeIndexedRewardInterval.totalNodeRewardsClaimed.div(
        activeIndexedRewardInterval.nodeRewardClaimCount
      );
  }

  // Add this reward claim to the current interval
  const currentRPLRewardClaims = activeIndexedRewardInterval.rplRewardClaims;
  currentRPLRewardClaims.push(rplRewardClaim.id);
  activeIndexedRewardInterval.rplRewardClaims = currentRPLRewardClaims;

  // Index changes to the (new/previous) interval and claim.
  rplRewardClaim.save();
  if (associatedNode !== null) associatedNode.save();
  if (previousActiveIndexedRewardInterval !== null)
    previousActiveIndexedRewardInterval.save();
  activeIndexedRewardInterval.save();

  // Index the protocol changes.
  protocol.save();

  updateUsageMetrics(event.block, event.params.claimingAddress);
  updateTotalRewardsMetrics(event.block, event.params.amount);
  updateSnapshotsTvl(event.block);
}

export function handleRewardSnapshot(event: RewardSnapshot): void {
  let _RPLRewardSubmitted = RPLRewardSubmitted.load(
    event.params.submission.rewardIndex.toString()
  );

  if (!_RPLRewardSubmitted) {
    _RPLRewardSubmitted = new RPLRewardSubmitted(
      event.params.submission.rewardIndex.toString()
    );
    _RPLRewardSubmitted.rewardIndex = event.params.submission.rewardIndex;
    _RPLRewardSubmitted.executionBlock = event.params.submission.executionBlock;
    _RPLRewardSubmitted.consensusBlock = event.params.submission.consensusBlock;
    _RPLRewardSubmitted.merkleRoot = event.params.submission.merkleRoot;
    _RPLRewardSubmitted.merkleTreeCID = event.params.submission.merkleTreeCID;
    _RPLRewardSubmitted.intervalsPassed =
      event.params.submission.intervalsPassed;
    _RPLRewardSubmitted.treasuryRPL = event.params.submission.treasuryRPL;
    _RPLRewardSubmitted.trustedNodeRPL = event.params.submission.trustedNodeRPL;
    _RPLRewardSubmitted.nodeRPL = event.params.submission.nodeRPL;
    _RPLRewardSubmitted.nodeETH = event.params.submission.nodeETH;
    _RPLRewardSubmitted.userETH = event.params.submission.userETH;
    _RPLRewardSubmitted.block = event.block.number;
    _RPLRewardSubmitted.blockTime = event.block.timestamp;

    _RPLRewardSubmitted.save();
  }
}
/**
 * Determine the claimer type for a specific RPL reward claim event.
 */
function getRplRewardClaimerType(
  claimingContract: Address,
  claimingAddress: Address
): string | null {
  let rplRewardClaimerType: string | null = null;
  if (claimingContract === null || claimingAddress === null)
    return rplRewardClaimerType;

  // #1: Could be the PDAO.
  const claimDaoContractEntity = getRocketContract(
    RocketContractNames.ROCKET_CLAIM_DAO
  );
  if (
    claimingContract.toHexString() ==
    Address.fromBytes(claimDaoContractEntity.latestAddress).toHexString()
  ) {
    rplRewardClaimerType = RPLREWARDCLAIMERTYPE_PDAO;
  }

  // #2: Could be an oracle node.
  const claimTrustedNodeContractEntity = getRocketContract(
    RocketContractNames.ROCKET_CLAIM_TRUSTED_NODE
  );
  if (
    claimingContract.toHexString() ==
    Address.fromBytes(
      claimTrustedNodeContractEntity.latestAddress
    ).toHexString()
  ) {
    rplRewardClaimerType = RPLREWARDCLAIMERTYPE_ODAO;
  }

  // #3: if the claimer type is still null, it **should** be a regular node.
  if (rplRewardClaimerType == null) {
    // Load the associated regular node.
    const associatedNode = Node.load(claimingAddress.toHexString());
    if (associatedNode !== null) {
      rplRewardClaimerType = RPLREWARDCLAIMERTYPE_NODE;
    }
  }

  return rplRewardClaimerType;
}

/**
 * Gets the current claiming contract allowance for the given RPL reward claim type from the smart contracts.
 */
function getClaimingContractAllowance(
  rplRewardClaimType: string,
  rewardsPoolAddress: Address
): BigInt {
  const rocketRewardsContract = rocketRewardsPool.bind(rewardsPoolAddress);

  if (rplRewardClaimType == RPLREWARDCLAIMERTYPE_PDAO) {
    const claimingContractAllowanceCall =
      rocketRewardsContract.try_getClaimingContractAllowance(
        RocketContractNames.ROCKET_CLAIM_DAO
      );
    if (claimingContractAllowanceCall.reverted) return BigInt.fromI32(0);
    return claimingContractAllowanceCall.value;
  } else if (rplRewardClaimType == RPLREWARDCLAIMERTYPE_ODAO) {
    const claimingContractAllowanceCall =
      rocketRewardsContract.try_getClaimingContractAllowance(
        RocketContractNames.ROCKET_CLAIM_TRUSTED_NODE
      );
    if (claimingContractAllowanceCall.reverted) return BigInt.fromI32(0);
    return claimingContractAllowanceCall.value;
  } else if (rplRewardClaimType == RPLREWARDCLAIMERTYPE_NODE) {
    const claimingContractAllowanceCall =
      rocketRewardsContract.try_getClaimingContractAllowance(
        RocketContractNames.ROCKET_CLAIM_NODE
      );
    if (claimingContractAllowanceCall.reverted) return BigInt.fromI32(0);
    return claimingContractAllowanceCall.value;
  } else {
    return BigInt.fromI32(0);
  }
}
