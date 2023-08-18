import { ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  Staker,
  Node,
  RocketETHTransaction,
  NetworkStakerBalanceCheckpoint,
  RocketPoolProtocol,
  StakerBalanceCheckpoint,
  NetworkNodeTimezone,
  NodeRPLStakeTransaction,
  RPLRewardInterval,
  RPLRewardClaim,
  NetworkNodeBalanceCheckpoint,
  NodeBalanceCheckpoint,
  Minipool,
} from "../generated/schema";
import { BalancesUpdated } from "../generated/templates/rocketNetworkBalances/rocketNetworkBalances";
import { ROCKETPOOL_PROTOCOL_ROOT_ID } from "./constants/generalConstants";

class RocketPoolEntityFactory {
  /**
   * Should only every be created once.
   */
  public createRocketPoolProtocol(): RocketPoolProtocol {
    const protocol = new RocketPoolProtocol(ROCKETPOOL_PROTOCOL_ROOT_ID);
    protocol.activeStakers = new Array<string>(0);
    protocol.stakersWithETHRewards = new Array<string>(0);
    protocol.stakers = new Array<string>(0);
    protocol.lastNetworkStakerBalanceCheckPoint = null;
    protocol.nodes = new Array<string>(0);
    protocol.nodeTimezones = new Array<string>(0);
    protocol.lastRPLRewardInterval = null;
    protocol.lastNetworkNodeBalanceCheckPoint = null;
    protocol.networkNodeBalanceCheckpoints = new Array<string>(0);
    return protocol;
  }

  /**
   * Attempts to create a new RocketETHTransaction.
   */
  public createRocketETHTransaction(
    id: string,
    from: Staker,
    to: Staker,
    amount: BigInt,
    event: ethereum.Event
  ): RocketETHTransaction | null {
    if (
      id == null ||
      from === null ||
      from.id == null ||
      to === null ||
      to.id == null ||
      event === null ||
      event.block === null ||
      event.transaction === null
    )
      return null;

    const rocketETHTransaction = new RocketETHTransaction(id);
    rocketETHTransaction.from = from.id;
    rocketETHTransaction.amount = amount;
    rocketETHTransaction.to = to.id;
    rocketETHTransaction.block = event.block.number;
    rocketETHTransaction.blockTime = event.block.timestamp;
    rocketETHTransaction.transactionHash = event.transaction.hash;

    return rocketETHTransaction;
  }

  /**
   * Attempts to create a new NetworkStakerBalanceCheckpoint.
   */
  public createNetworkStakerBalanceCheckpoint(
    id: string,
    previousCheckpointId: string | null,
    event: BalancesUpdated,
    stakerETHWaitingInDepositPool: BigInt,
    stakerETHInRocketEthContract: BigInt,
    rEthExchangeRate: BigInt
  ): NetworkStakerBalanceCheckpoint | null {
    if (
      id == null ||
      event === null ||
      event.block === null ||
      event.params === null
    ) {
      return null;
    }

    const networkBalance = new NetworkStakerBalanceCheckpoint(id);
    networkBalance.previousCheckpointId = previousCheckpointId;
    networkBalance.nextCheckpointId = null;
    networkBalance.stakerETHActivelyStaking = event.params.stakingEth;
    networkBalance.stakerETHWaitingInDepositPool =
      stakerETHWaitingInDepositPool;
    networkBalance.stakerETHInRocketETHContract = stakerETHInRocketEthContract;
    networkBalance.stakerETHInProtocol = event.params.totalEth;
    networkBalance.totalRETHSupply = event.params.rethSupply;
    networkBalance.averageStakerETHRewards = BigInt.fromI32(0);
    networkBalance.rETHExchangeRate = rEthExchangeRate;
    networkBalance.block = event.block.number;
    networkBalance.blockTime = event.block.timestamp;
    networkBalance.totalStakersWithETHRewards = BigInt.fromI32(0);
    networkBalance.stakersWithAnRETHBalance = BigInt.fromI32(0);
    networkBalance.totalStakerETHRewards = BigInt.fromI32(0);

    return networkBalance;
  }

  /**
   * Attempts to create a new Staker.
   */
  public createStaker(
    id: string,
    blockNumber: BigInt,
    blockTime: BigInt
  ): Staker | null {
    if (id == null) return null;

    const staker = new Staker(id);
    staker.rETHBalance = BigInt.fromI32(0);
    staker.ethBalance = BigInt.fromI32(0);
    staker.totalETHRewards = BigInt.fromI32(0);
    staker.lastBalanceCheckpoint = null;
    staker.hasAccruedETHRewardsDuringLifecycle = false;
    staker.block = blockNumber;
    staker.blockTime = blockTime;

    return staker;
  }

  /**
   * Attempts to create a new staker balance checkpoint for the given values.
   */
  public createStakerBalanceCheckpoint(
    id: string,
    staker: Staker | null,
    networkStakerBalanceCheckpoint: NetworkStakerBalanceCheckpoint | null,
    ethBalance: BigInt,
    rEthBalance: BigInt,
    totalETHRewards: BigInt,
    blockNumber: BigInt,
    blockTime: BigInt
  ): StakerBalanceCheckpoint | null {
    if (
      id == null ||
      staker === null ||
      staker.id == null ||
      networkStakerBalanceCheckpoint === null ||
      networkStakerBalanceCheckpoint.id == null
    )
      return null;

    const stakerBalanceCheckpoint = new StakerBalanceCheckpoint(id);
    stakerBalanceCheckpoint.stakerId = staker.id;
    stakerBalanceCheckpoint.networkStakerBalanceCheckpointId =
      networkStakerBalanceCheckpoint.id;
    stakerBalanceCheckpoint.ethBalance = ethBalance;
    stakerBalanceCheckpoint.rETHBalance = rEthBalance;
    stakerBalanceCheckpoint.totalETHRewards = totalETHRewards;
    stakerBalanceCheckpoint.block = blockNumber;
    stakerBalanceCheckpoint.blockTime = blockTime;

    return stakerBalanceCheckpoint;
  }

  /**
   * Attempts to create a node timezone.
   */
  public createNodeTimezone(timezoneId: string): NetworkNodeTimezone {
    const timezone = new NetworkNodeTimezone(timezoneId);
    timezone.totalRegisteredNodes = BigInt.fromI32(0);
    return timezone;
  }

  /**
   * Attempts to create a new Node.
   */
  public createNode(
    id: string,
    timezoneId: string,
    blockNumber: BigInt,
    blockTime: BigInt
  ): Node | null {
    if (id == null) return null;

    const node = new Node(id);
    node.timezone = timezoneId;
    node.isOracleNode = false;
    node.oracleNodeBlockTime = BigInt.fromI32(0);
    node.oracleNodeRPLBond = BigInt.fromI32(0);
    node.rplStaked = BigInt.fromI32(0);
    node.effectiveRPLStaked = BigInt.fromI32(0);
    node.minimumEffectiveRPL = BigInt.fromI32(0);
    node.maximumEffectiveRPL = BigInt.fromI32(0);
    node.totalRPLSlashed = BigInt.fromI32(0);
    node.totalODAORewardsClaimed = BigInt.fromI32(0);
    node.totalNodeRewardsClaimed = BigInt.fromI32(0);
    node.averageODAORewardClaim = BigInt.fromI32(0);
    node.averageNodeRewardClaim = BigInt.fromI32(0);
    node.odaoRewardClaimCount = BigInt.fromI32(0);
    node.nodeRewardClaimCount = BigInt.fromI32(0);
    node.queuedMinipools = BigInt.fromI32(0);
    node.stakingMinipools = BigInt.fromI32(0);
    node.stakingUnbondedMinipools = BigInt.fromI32(0);
    node.withdrawableMinipools = BigInt.fromI32(0);
    node.totalFinalizedMinipools = BigInt.fromI32(0);
    node.averageFeeForActiveMinipools = BigInt.fromI32(0);
    node.lastNodeBalanceCheckpoint = null;
    node.minipools = new Array<string>(0);
    node.block = blockNumber;
    node.blockTime = blockTime;
    return node;
  }

  /**
   * Attempts to create a new Node RPL Transaction.
   */
  public createNodeRPLStakeTransaction(
    id: string,
    nodeId: string,
    amount: BigInt,
    ethAmount: BigInt,
    type: string,
    blockNumber: BigInt,
    blockTime: BigInt
  ): NodeRPLStakeTransaction | null {
    if (id == null) return null;

    const transaction = new NodeRPLStakeTransaction(id);
    transaction.node = nodeId;
    transaction.amount = amount;
    transaction.ethAmount = ethAmount;
    transaction.type = type;
    transaction.block = blockNumber;
    transaction.blockTime = blockTime;

    return transaction;
  }

  /**
   * Attempts to create a new RPL Reward Interval.
   */
  public createRPLRewardInterval(
    id: string,
    previousIntervalId: string | null,
    claimableRewards: BigInt,
    claimablePDAORewards: BigInt,
    claimableODAORewards: BigInt,
    claimableNodeRewards: BigInt,
    claimableRewardsFromPreviousInterval: BigInt,
    intervalStartTime: BigInt,
    intervalDuration: BigInt,
    blockNumber: BigInt,
    blockTime: BigInt
  ): RPLRewardInterval | null {
    if (id == null) return null;

    const rewardInterval = new RPLRewardInterval(id);
    rewardInterval.previousIntervalId = previousIntervalId;
    rewardInterval.nextIntervalId = null;
    rewardInterval.claimableRewards = claimableRewards;
    rewardInterval.claimablePDAORewards = claimablePDAORewards;
    rewardInterval.claimableODAORewards = claimableODAORewards;
    rewardInterval.claimableNodeRewards = claimableNodeRewards;
    rewardInterval.claimableRewardsFromPreviousInterval =
      claimableRewardsFromPreviousInterval < BigInt.fromI32(0)
        ? BigInt.fromI32(0)
        : claimableRewardsFromPreviousInterval;
    rewardInterval.totalRPLClaimed = BigInt.fromI32(0);
    rewardInterval.totalPDAORewardsClaimed = BigInt.fromI32(0);
    rewardInterval.totalODAORewardsClaimed = BigInt.fromI32(0);
    rewardInterval.totalNodeRewardsClaimed = BigInt.fromI32(0);
    rewardInterval.averageODAORewardClaim = BigInt.fromI32(0);
    rewardInterval.averageNodeRewardClaim = BigInt.fromI32(0);
    rewardInterval.odaoRewardClaimCount = BigInt.fromI32(0);
    rewardInterval.nodeRewardClaimCount = BigInt.fromI32(0);
    rewardInterval.rplRewardClaims = new Array<string>(0);
    rewardInterval.isClosed = false;
    rewardInterval.intervalStartTime = intervalStartTime;
    rewardInterval.intervalClosedTime = null;
    rewardInterval.intervalDuration = intervalDuration;
    rewardInterval.intervalDurationActual = null;
    rewardInterval.block = blockNumber;
    rewardInterval.blockTime = blockTime;

    return rewardInterval;
  }

  /**
   * Attempts to create a new RPL Reward Claim.
   */
  public createRPLRewardClaim(
    id: string,
    rplRewardIntervalId: string,
    claimer: string,
    claimerType: string,
    amount: BigInt,
    ethAmount: BigInt,
    transactionHash: string,
    blockNumber: BigInt,
    blockTime: BigInt
  ): RPLRewardClaim | null {
    if (
      id == null ||
      rplRewardIntervalId == null ||
      claimer == null ||
      claimerType == null ||
      transactionHash == null ||
      amount == BigInt.fromI32(0) ||
      ethAmount == BigInt.fromI32(0)
    )
      return null;

    const rewardInterval = new RPLRewardClaim(id);
    rewardInterval.rplRewardIntervalId = rplRewardIntervalId;
    rewardInterval.claimer = claimer;
    rewardInterval.claimerType = claimerType;
    rewardInterval.amount = amount;
    rewardInterval.ethAmount = ethAmount;
    rewardInterval.transactionHash = transactionHash;
    rewardInterval.block = blockNumber;
    rewardInterval.blockTime = blockTime;

    return rewardInterval;
  }

  /**
   * Attempts to create a new Network Node Balance Checkpoint.
   */
  public createNetworkNodeBalanceCheckpoint(
    id: string,
    previousCheckpointId: string | null,
    minimumEffectiveRPLNewMinipool: BigInt,
    maximumEffectiveRPLNewMinipool: BigInt,
    newRplPriceInETH: BigInt,
    newMinipoolFee: BigInt,
    blockNumber: BigInt,
    blockTime: BigInt
  ): NetworkNodeBalanceCheckpoint | null {
    if (id == null || newRplPriceInETH == BigInt.fromI32(0)) return null;

    const checkpoint = new NetworkNodeBalanceCheckpoint(id);
    checkpoint.previousCheckpointId = previousCheckpointId;
    checkpoint.nextCheckpointId = null;
    checkpoint.nodesRegistered = BigInt.fromI32(0); // Will be calculated.
    checkpoint.oracleNodesRegistered = BigInt.fromI32(0); // Will be calculated.
    checkpoint.rplStaked = BigInt.fromI32(0); // Will be calculated.
    checkpoint.effectiveRPLStaked = BigInt.fromI32(0); // Will be calculated.
    checkpoint.minimumEffectiveRPLNewMinipool = minimumEffectiveRPLNewMinipool;
    checkpoint.maximumEffectiveRPLNewMinipool = maximumEffectiveRPLNewMinipool;
    checkpoint.minimumEffectiveRPL = BigInt.fromI32(0); // Will be calculated.
    checkpoint.maximumEffectiveRPL = BigInt.fromI32(0); // Will be calculated.
    checkpoint.totalRPLSlashed = BigInt.fromI32(0); // Will be calculated.
    checkpoint.totalODAORewardsClaimed = BigInt.fromI32(0); // Will be calculated.
    checkpoint.totalNodeRewardsClaimed = BigInt.fromI32(0); // Will be calculated.
    checkpoint.averageTotalODAORewardsClaimed = BigInt.fromI32(0); // Will be calculated.
    checkpoint.averageODAORewardClaim = BigInt.fromI32(0); // Will be calculated.
    checkpoint.averageNodeTotalRewardsClaimed = BigInt.fromI32(0); // Will be calculated.
    checkpoint.averageNodeRewardClaim = BigInt.fromI32(0); // Will be calculated.
    checkpoint.rplPriceInETH = newRplPriceInETH; // From the associated price update.
    checkpoint.averageRplPriceInETH = BigInt.fromI32(0); // Will be calculated.
    checkpoint.queuedMinipools = BigInt.fromI32(0); // Will be calculated.
    checkpoint.stakingMinipools = BigInt.fromI32(0); // Will be calculated.
    checkpoint.stakingUnbondedMinipools = BigInt.fromI32(0); // Will be calculated.
    checkpoint.withdrawableMinipools = BigInt.fromI32(0); // Will be calculated.
    checkpoint.totalFinalizedMinipools = BigInt.fromI32(0); // Will be calculated.
    checkpoint.averageFeeForActiveMinipools = BigInt.fromI32(0); // Will be calculated.
    checkpoint.newMinipoolFee = newMinipoolFee;
    checkpoint.block = blockNumber;
    checkpoint.blockTime = blockTime;

    return checkpoint;
  }

  /**
   * Attempts to create a new Node Balance Checkpoint.
   */
  public createNodeBalanceCheckpoint(
    id: string,
    networkCheckpointId: string,
    node: Node,
    blockNumber: BigInt,
    blockTime: BigInt
  ): NodeBalanceCheckpoint | null {
    if (id == null) return null;

    const checkpoint = new NodeBalanceCheckpoint(id);
    checkpoint.NetworkNodeBalanceCheckpoint = networkCheckpointId;
    checkpoint.Node = node.id;
    checkpoint.isOracleNode = node.isOracleNode;
    checkpoint.oracleNodeRPLBond = node.oracleNodeRPLBond;
    checkpoint.oracleNodeBlockTime = node.oracleNodeBlockTime;
    checkpoint.rplStaked = node.rplStaked;
    checkpoint.effectiveRPLStaked = node.effectiveRPLStaked;
    checkpoint.minimumEffectiveRPL = node.minimumEffectiveRPL;
    checkpoint.maximumEffectiveRPL = node.maximumEffectiveRPL;
    checkpoint.totalRPLSlashed = node.totalRPLSlashed;
    checkpoint.totalODAORewardsClaimed = node.totalODAORewardsClaimed;
    checkpoint.totalNodeRewardsClaimed = node.totalNodeRewardsClaimed;
    checkpoint.averageODAORewardClaim = node.averageODAORewardClaim;
    checkpoint.averageNodeRewardClaim = node.averageNodeRewardClaim;
    checkpoint.odaoRewardClaimCount = node.odaoRewardClaimCount;
    checkpoint.nodeRewardClaimCount = node.nodeRewardClaimCount;
    checkpoint.queuedMinipools = node.queuedMinipools;
    checkpoint.stakingMinipools = node.stakingMinipools;
    checkpoint.stakingUnbondedMinipools = node.stakingUnbondedMinipools;
    checkpoint.withdrawableMinipools = node.withdrawableMinipools;
    checkpoint.totalFinalizedMinipools = node.totalFinalizedMinipools;
    checkpoint.averageFeeForActiveMinipools = node.averageFeeForActiveMinipools;
    checkpoint.block = blockNumber;
    checkpoint.blockTime = blockTime;

    return checkpoint;
  }

  /**
   * Attempts to create a new minipool.
   */
  public createMinipool(id: string, node: Node, fee: BigInt): Minipool {
    const minipool = new Minipool(id);
    minipool.node = node.id;
    minipool.fee = fee;
    minipool.nodeDepositETHAmount = BigInt.fromI32(0);
    minipool.nodeDepositBlockTime = BigInt.fromI32(0);
    minipool.userDepositETHAmount = BigInt.fromI32(0);
    minipool.userDepositBlockTime = BigInt.fromI32(0);
    minipool.queuedBlockTime = BigInt.fromI32(0);
    minipool.dequeuedBlockTime = BigInt.fromI32(0);
    minipool.destroyedBlockTime = BigInt.fromI32(0);
    minipool.stakingBlockTime = BigInt.fromI32(0);
    minipool.withdrawableBlockTime = BigInt.fromI32(0);
    minipool.finalizedBlockTime = BigInt.fromI32(0);

    return minipool;
  }
}

export const rocketPoolEntityFactory = new RocketPoolEntityFactory();
