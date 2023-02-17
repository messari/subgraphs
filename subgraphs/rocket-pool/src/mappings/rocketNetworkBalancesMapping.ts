import { BalancesUpdated } from "../../generated/rocketNetworkBalances/rocketNetworkBalances";
import { rocketTokenRETH } from "../../generated/rocketNetworkBalances/rocketTokenRETH";
import { rocketDepositPool } from "../../generated/rocketNetworkBalances/rocketDepositPool";
import {
  Staker,
  NetworkStakerBalanceCheckpoint,
  RocketPoolProtocol,
  NetworkNodeBalanceCheckpoint,
} from "../../generated/schema";
import { generalUtilities } from "../checkpoints/generalUtilities";
import { stakerUtilities } from "../checkpoints/stakerUtilities";
import { rocketPoolEntityFactory } from "../entityFactory";
import {
  ZERO_ADDRESS_STRING,
  ROCKET_DEPOSIT_POOL_CONTRACT_ADDRESS,
  ROCKET_TOKEN_RETH_CONTRACT_ADDRESS,
} from "../constants/contractConstants";
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { getOrCreateProtocol } from "../entities/protocol";
import { getOrCreatePool } from "../entities/pool";
import { updateUsageMetrics } from "../updaters/usageMetrics";
import {
  updateProtocolSideRevenueMetrics,
  updateSnapshotsTvl,
  updateSupplySideRevenueMetrics,
  updateTotalRevenueMetrics,
  updateProtocolAndPoolTvl,
} from "../updaters/financialMetrics";
import { bigIntToBigDecimal } from "../utils/numbers";
import {
  BIGDECIMAL_ZERO,
  BIGINT_SIXTEEN,
  BIGINT_THIRTYTWO,
  BIGINT_ZERO,
} from "../utils/constants";

/**
 * When enough ODAO members votes on a balance and a consensus threshold is reached, the staker beacon chain state is persisted to the smart contracts.
 */
export function handleBalancesUpdated(event: BalancesUpdated): void {
  // Protocol entity should exist, if not, then we attempt to create it.
  let protocol = generalUtilities.getRocketPoolProtocolEntity();
  if (protocol === null || protocol.id == null) {
    protocol = rocketPoolEntityFactory.createRocketPoolProtocol();
  }
  if (protocol === null) return;

  getOrCreateProtocol();
  getOrCreatePool(event.block.number, event.block.timestamp);

  // Preliminary check to ensure we haven't handled this before.
  if (
    stakerUtilities.hasNetworkStakerBalanceCheckpointHasBeenIndexed(
      protocol,
      event
    )
  )
    return;

  // Load the RocketTokenRETH contract
  // We will need the rocketvault smart contract state to get specific addresses.
  const rETHContract = rocketTokenRETH.bind(
    Address.fromString(ROCKET_TOKEN_RETH_CONTRACT_ADDRESS)
  );
  if (rETHContract === null) return;

  // Load the rocketDepositPool contract
  const rocketDepositPoolContract = rocketDepositPool.bind(
    Address.fromString(ROCKET_DEPOSIT_POOL_CONTRACT_ADDRESS)
  );
  if (rocketDepositPoolContract === null) return;

  // How much is the total staker ETH balance in the deposit pool?
  const depositPoolBalance = rocketDepositPoolContract.getBalance();
  const depositPoolExcessBalance = rocketDepositPoolContract.getExcessBalance();

  // The RocketEth contract balance is equal to the total collateral - the excess deposit pool balance.
  const stakerETHInRocketETHContract = getRocketETHBalance(
    depositPoolExcessBalance,
    rETHContract.getTotalCollateral()
  );

  // Attempt to create a new network balance checkpoint.
  const rETHExchangeRate = rETHContract.getExchangeRate();
  const checkpoint =
    rocketPoolEntityFactory.createNetworkStakerBalanceCheckpoint(
      generalUtilities.extractIdForEntity(event),
      protocol.lastNetworkStakerBalanceCheckPoint,
      event,
      depositPoolBalance,
      stakerETHInRocketETHContract,
      rETHExchangeRate
    );
  if (checkpoint === null) return;

  // Retrieve previous checkpoint.
  const previousCheckpointId = protocol.lastNetworkStakerBalanceCheckPoint;
  let previousTotalStakerETHRewards = BigInt.fromI32(0);
  let previousTotalStakersWithETHRewards = BigInt.fromI32(0);
  let previousRETHExchangeRate = BigInt.fromI32(1);
  let previousCheckpoint: NetworkStakerBalanceCheckpoint | null = null;
  if (previousCheckpointId) {
    previousCheckpoint =
      NetworkStakerBalanceCheckpoint.load(previousCheckpointId);
    if (previousCheckpoint) {
      previousTotalStakerETHRewards = previousCheckpoint.totalStakerETHRewards;
      previousTotalStakersWithETHRewards =
        previousCheckpoint.totalStakersWithETHRewards;
      previousRETHExchangeRate = previousCheckpoint.rETHExchangeRate;
      previousCheckpoint.nextCheckpointId = checkpoint.id;
    }
  }
  const balanceCheckpoint = NetworkNodeBalanceCheckpoint.load(
    protocol.lastNetworkNodeBalanceCheckPoint!
  );
  const averageFeeForActiveMinipools =
    balanceCheckpoint!.averageFeeForActiveMinipools;

  // Handle the staker impact.
  generateStakerBalanceCheckpoints(
    event.block,
    protocol.activeStakers,
    checkpoint,
    previousCheckpoint !== null ? previousCheckpoint : null,
    previousRETHExchangeRate,
    event.block.number,
    event.block.timestamp,
    protocol,
    averageFeeForActiveMinipools
  );

  // If for some reason the running summary totals up to this checkpoint was 0, then we try to set it based on the previous checkpoint.
  if (checkpoint.totalStakerETHRewards == BigInt.fromI32(0)) {
    checkpoint.totalStakerETHRewards = previousTotalStakerETHRewards;
  }
  if (checkpoint.totalStakersWithETHRewards == BigInt.fromI32(0)) {
    checkpoint.totalStakersWithETHRewards = previousTotalStakersWithETHRewards;
  }

  // Calculate average staker reward up to this checkpoint.
  if (
    checkpoint.totalStakerETHRewards != BigInt.fromI32(0) &&
    checkpoint.totalStakersWithETHRewards
      ? 0
      : checkpoint.totalStakersWithETHRewards >= BigInt.fromI32(1)
  ) {
    checkpoint.averageStakerETHRewards = checkpoint.totalStakerETHRewards.div(
      checkpoint.totalStakersWithETHRewards
    );
  }

  // Update the link so the protocol points to the last network staker balance checkpoint.
  protocol.lastNetworkStakerBalanceCheckPoint = checkpoint.id;

  // Index these changes.
  checkpoint.save();
  if (previousCheckpoint !== null) previousCheckpoint.save();
  protocol.save();

  updateUsageMetrics(event.block, event.address);

  const queuedMinipools =
    balanceCheckpoint!.queuedMinipools.times(BIGINT_SIXTEEN);
  const stakingMinipools =
    balanceCheckpoint!.stakingMinipools.times(BIGINT_THIRTYTWO);
  const stakingUnbondedMinipools =
    balanceCheckpoint!.stakingUnbondedMinipools.times(BIGINT_THIRTYTWO);
  const withdrawableMinipools =
    balanceCheckpoint!.withdrawableMinipools.times(BIGINT_THIRTYTWO);

  log.error(
    "[master TVL calculation raw inputs] queuedMinipools: {}, stakingMinipools: {}, stakingUnbondedMinipools: {}, withdrawableMinipools: {} ",
    [
      balanceCheckpoint!.queuedMinipools.toString(),
      balanceCheckpoint!.stakingMinipools.toString(),
      balanceCheckpoint!.stakingUnbondedMinipools.toString(),
      balanceCheckpoint!.withdrawableMinipools.toString(),
    ]
  );
  log.error(
    "[master TVL calculation] queuedMinipools: {}, stakingMinipools: {}, stakingUnbondedMinipools: {}, withdrawableMinipools: {} ",
    [
      queuedMinipools.toString(),
      stakingMinipools.toString(),
      stakingUnbondedMinipools.toString(),
      withdrawableMinipools.toString(),
    ]
  );

  const ethTVL = queuedMinipools
    .plus(stakingMinipools)
    .plus(stakingMinipools)
    .plus(stakingUnbondedMinipools)
    .plus(withdrawableMinipools);
  updateProtocolAndPoolTvl(event.block.number, event.block.timestamp, ethTVL);
}

/**
 * Loops through all stakers of the protocol.
 * If an active rETH balance is found..
 * Create a StakerBalanceCheckpoint
 */
function generateStakerBalanceCheckpoints(
  block: ethereum.Block,
  activeStakerIds: Array<string>,
  networkCheckpoint: NetworkStakerBalanceCheckpoint,
  previousCheckpoint: NetworkStakerBalanceCheckpoint | null,
  previousRETHExchangeRate: BigInt,
  blockNumber: BigInt,
  blockTime: BigInt,
  protocol: RocketPoolProtocol,
  averageFeeForActiveMinipools: BigInt
): void {
  // Update grand totals based on previous checkpoint before we do anything.
  stakerUtilities.updateNetworkStakerBalanceCheckpointForPreviousCheckpointAndProtocol(
    networkCheckpoint,
    previousCheckpoint,
    protocol
  );

  let protocolRevenue = BIGDECIMAL_ZERO;
  let ethRewards = BIGINT_ZERO;

  // Loop through all the staker id's in the protocol.
  for (let index = 0; index < activeStakerIds.length; index++) {
    // Determine current staker ID.
    const stakerId = activeStakerIds[index];
    if (stakerId == null || stakerId == ZERO_ADDRESS_STRING) continue;

    // Load the indexed staker.
    const staker = Staker.load(stakerId);

    // Shouldn't occur since we're only passing in staker ID's that have an active rETH balance.
    if (staker === null || staker.rETHBalance == BigInt.fromI32(0)) continue;

    // Get the current & previous balances for this staker and update the staker balance for the current exchange rate.
    const stakerBalance = stakerUtilities.getStakerBalance(
      staker,
      networkCheckpoint.rETHExchangeRate
    );
    staker.ethBalance = stakerBalance.currentETHBalance;

    // Calculate rewards (+/-) for this staker since the previous checkpoint.
    const ethRewardsSincePreviousCheckpoint =
      stakerUtilities.getETHRewardsSincePreviousStakerBalanceCheckpoint(
        stakerBalance.currentRETHBalance,
        stakerBalance.currentETHBalance,
        stakerBalance.previousRETHBalance,
        stakerBalance.previousETHBalance,
        previousRETHExchangeRate
      );
    stakerUtilities.handleEthRewardsSincePreviousCheckpoint(
      ethRewardsSincePreviousCheckpoint,
      staker,
      networkCheckpoint,
      protocol
    );

    protocolRevenue = protocolRevenue.plus(
      bigIntToBigDecimal(ethRewardsSincePreviousCheckpoint).times(
        bigIntToBigDecimal(averageFeeForActiveMinipools)
      )
    );

    ethRewards = ethRewards.plus(ethRewardsSincePreviousCheckpoint);

    // Create a new staker balance checkpoint
    const stakerBalanceCheckpoint =
      rocketPoolEntityFactory.createStakerBalanceCheckpoint(
        networkCheckpoint.id + " - " + stakerId,
        staker,
        networkCheckpoint,
        stakerBalance.currentETHBalance,
        stakerBalance.currentRETHBalance,
        staker.totalETHRewards,
        blockNumber,
        blockTime
      );
    if (stakerBalanceCheckpoint == null) continue;
    staker.lastBalanceCheckpoint = stakerBalanceCheckpoint.id;

    // Index both the updated staker & the new staker balance checkpoint.
    stakerBalanceCheckpoint.save();
    staker.save();
  }

  // update all rev/snapshots at once
  // this was moved outside of the loop to reduce the memory usage
  // we were getting a "oneshot called" error
  updateTotalRevenueMetrics(
    block,
    ethRewards,
    networkCheckpoint.totalRETHSupply
  );
  updateProtocolSideRevenueMetrics(block, protocolRevenue);
  updateSupplySideRevenueMetrics(block);
  updateSnapshotsTvl(block);
}

/**
 * The RocketETH contract balance is equal to the total collateral - the excess deposit pool balance.
 */
function getRocketETHBalance(
  depositPoolExcess: BigInt,
  rocketETHTotalCollateral: BigInt
): BigInt {
  let totalStakerETHInRocketEthContract =
    rocketETHTotalCollateral.minus(depositPoolExcess);

  if (totalStakerETHInRocketEthContract < BigInt.fromI32(0))
    totalStakerETHInRocketEthContract = BigInt.fromI32(0);

  return totalStakerETHInRocketEthContract;
}
