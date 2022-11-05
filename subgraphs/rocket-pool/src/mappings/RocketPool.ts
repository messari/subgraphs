import {
  BigDecimal,
  BigInt,
  Address,
  log,
  Bytes,
} from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal, getMean } from "../utils/numbers";
import {
  EtherDeposited,
  EtherWithdrawn,
} from "../../generated/RocketVault/RocketVault";
import { RocketStorage } from "../../generated/rocketVault/RocketStorage";
import { RETH } from "../../generated/rocketVault/RETH";
import {
  RPLStaked,
  RPLSlashed,
  RPLWithdrawn,
} from "../../generated/rocketNodeStaking/rocketNodeStaking";
import {
  MinipoolEnqueued,
  MinipoolRemoved,
  MinipoolDequeued,
} from "../../generated/rocketMinipoolQueue/rocketMinipoolQueue";
import { RPLTokensClaimed } from "../../generated/RocketRewardsPool/rocketRewardsPool";
import { BalancesUpdated } from "../../generated/rocketNetworkBalances/rocketNetworkBalances";

import { updateUsageMetrics } from "../entityUpdates/usageMetrics";
import {
  updateProtocolAndPoolTvl,
  updateSnapshotsTvl,
  updateSupplySideRevenueMetrics,
  updateProtocolSideRevenueMetrics,
  updateTotalRevenueMetrics,
  updateMinipoolTvlandRevenue,
} from "../entityUpdates/financialMetrics";
import {
  BIGINT_ZERO,
  RETH_ADDRESS,
  BIGINT_NEGATIVE_ONE,
  BIGDECIMAL_HALF,
  STORAGE,
  ONE_ETH_IN_WEI,
  BIGDECIMAL_ZERO,
  DEFAULT_COMMISSION,
} from "../utils/constants";
import { getOrCreatePool } from "../entities/pool";

/** Queries Storage Address for current address of encode. encode is the string of the name of the rocketpool contract, which has been keccack256(abi.unpack(string)) in solidity. */
export function getStorageAddress(encode: Bytes): Address {
  const storage = RocketStorage.bind(Address.fromString(STORAGE));
  let address = storage.try_getAddress(encode);
  if (address.reverted) {
    log.info("getStorageAddress call reverted", []);
    return Address.fromString("0x0000000000000000000000000000000000000000");
  } else {
    return Address.fromBytes(address.value);
  }
}

/** handleEtherDeposit tracks ether deposited into rocketpool, which represents the TVL of the ETH staked in the pool. */
export function handleEtherDeposit(event: EtherDeposited): void {
  updateUsageMetrics(event.block, event.transaction.from);
  updateProtocolAndPoolTvl(event.block, event.params.amount, BIGINT_ZERO);
  updateSnapshotsTvl(event.block);
}

/** handleEtherWithdrawn tracks ether withdrawn into rocketpool, which represents the TVL of the ETH staked in the pool. */
export function handleEtherWithdrawn(event: EtherWithdrawn): void {
  updateUsageMetrics(event.block, event.transaction.from);
  updateProtocolAndPoolTvl(
    event.block,
    BIGINT_NEGATIVE_ONE.times(event.params.amount),
    BIGINT_ZERO
  );
  updateSnapshotsTvl(event.block);
}

/** handleMinipoolEnqeued represents the 16 Eth enqued by a Node Manager to be deployed by the protocol. This is represented in the TVL of the network.*/
export function handleMinipoolEnqueued(event: MinipoolEnqueued): void {
  updateMinipoolTvlandRevenue(
    event.block,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    event.params.minipool.toHexString()
  );
  updateUsageMetrics(event.block, event.transaction.from);
  updateProtocolAndPoolTvl(event.block, event.transaction.value, BIGINT_ZERO);
  updateSnapshotsTvl(event.block);
}

/** handleMinipoolDeqeued represents the Eth being dequeued by a Node Manager.*/
export function handleMinipoolDequeued(event: MinipoolDequeued): void {
  updateMinipoolTvlandRevenue(
    event.block,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    event.params.minipool.toHexString()
  );
  updateUsageMetrics(event.block, event.params.minipool);
}

/** handleMinipoolRemoved represents a Minipool being dissolved by a Node Manager. The value of the transaction is subtracted from the TVL of the network.*/
export function handleMinipoolRemoved(event: MinipoolRemoved): void {
  updateMinipoolTvlandRevenue(
    event.block,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    event.params.minipool.toHexString()
  );
  updateSnapshotsTvl(event.block);
}

export function handleRPLStaked(event: RPLStaked): void {
  updateUsageMetrics(event.block, event.params.from);
  updateProtocolAndPoolTvl(event.block, BIGINT_ZERO, event.params.amount);
  updateSnapshotsTvl(event.block);
}

export function handleRPLWithdrawn(event: RPLWithdrawn): void {
  updateUsageMetrics(event.block, event.params.to);
  updateProtocolAndPoolTvl(
    event.block,
    BIGINT_ZERO,
    event.params.amount.times(BIGINT_NEGATIVE_ONE)
  );

  updateSnapshotsTvl(event.block);
}

export function handleRPLSlashed(event: RPLSlashed): void {
  updateMinipoolTvlandRevenue(
    event.block,
    BIGINT_ZERO,
    event.params.amount,
    BIGINT_ZERO,
    event.params.node.toHexString()
  );

  updateUsageMetrics(event.block, event.params.node);
}

export function handleTokensClaimed(event: RPLTokensClaimed): void {
  let reth = RETH.bind(Address.fromString(RETH_ADDRESS));

  let totalSupply = reth.try_totalSupply();

  let totalsupply = BIGINT_ZERO;

  if (totalSupply.reverted) {
    log.error("[handleBalanceUpdate] Total supply call reverted", []);
  } else {
    totalsupply = totalSupply.value;
  }

  updateUsageMetrics(event.block, event.params.claimingAddress);
  updateTotalRevenueMetrics(
    event.block,
    BIGDECIMAL_ZERO,
    event.params.amount,
    totalsupply
  );
}

/** handleBalanceUpdate updates the revenue for RocketPool based on the amount of Eth generated on the beacon chain.  */
export function handleBalanceUpdate(event: BalancesUpdated): void {
  const BeaconChainRewardEth = event.params.totalEth.minus(
    event.params.stakingEth
  );
  log.error("[handleBalanceUpdate] Reward eth found: {}", [
    BeaconChainRewardEth.toString(),
  ]);

  let reth = RETH.bind(Address.fromString(RETH_ADDRESS));

  let totalSupply = reth.try_totalSupply();

  let totalsupply = BIGINT_ZERO;

  if (totalSupply.reverted) {
    log.error("[handleBalanceUpdate] Total supply call reverted", []);
  } else {
    totalsupply = totalSupply.value;
  }
  let pool = getOrCreatePool(event.block.number, event.block.timestamp);
  const pools = pool._miniPools;
  if (pools) {
    var cumrevCounter: BigDecimal = BIGDECIMAL_ZERO;
    let avg_ComissionRate = DEFAULT_COMMISSION;

    let Comissions = pool._miniPoolCommission;

    // log.error("[handleBalanceUpdate] sum: {}", [Comissions!.toString()]);

    // if (Comissions && Comissions.length > 0) {
    //   avg_ComissionRate = getMean(Comissions);
    // }
    // log.error("[handleBalanceUpdate] comission rate: {}", [
    //   avg_ComissionRate.toString(),
    // ]);
    cumrevCounter = bigIntToBigDecimal(BeaconChainRewardEth);
    // log.error("[handleBalanceUpdate] cumRev: {}", [cumrevCounter.toString()]);

    let minipoolMultiplier = BIGDECIMAL_HALF.plus(
      BIGDECIMAL_HALF.times(avg_ComissionRate)
    );
    // log.error("[handleBalanceUpdate] minipool multiplier: {}", [
    //   minipoolMultiplier.toString(),
    // ]);

    let minipoolRevenue =
      bigIntToBigDecimal(BeaconChainRewardEth).times(minipoolMultiplier);
    // log.error("[handleBalanceUpdate] minipool rev in eth: {}", [
    //   minipoolRevenue.toString(),
    // ]);

    updateTotalRevenueMetrics(
      event.block,
      cumrevCounter,
      BIGINT_ZERO,
      totalsupply
    );
    updateProtocolSideRevenueMetrics(event.block, minipoolRevenue);
    updateSupplySideRevenueMetrics(event.block);
  }
}
