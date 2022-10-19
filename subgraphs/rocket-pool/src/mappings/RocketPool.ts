import {
  BigDecimal,
  BigInt,
  Address,
  log,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal } from "../utils/numbers";
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

import { BalancesUpdated } from "../../generated/rocketNetworkBalances/rocketNetworkBalances";

import { rocketNetworkPrices } from "../../generated/rocketNodeStaking/rocketNetworkPrices";
import { ERC20 } from "../../generated/rocketVault/ERC20";
import { getOrCreateToken } from "../entities/token";

import { updateUsageMetrics } from "../entityUpdates/usageMetrics";
import {
  updateProtocolAndPoolTvl,
  updateSnapshotsTvl,
  updateSupplySideRevenueMetrics,
  updateProtocolSideRevenueMetrics,
  updateTotalRevenueMetrics,
  updateMinipoolTvlandRevenue,
  getEthAmountUSD,
  getEthAmountUSDDecimal,
} from "../entityUpdates/financialMetrics";
import {
  ZERO_ADDRESS,
  ETH_ADDRESS,
  BIGINT_ZERO,
  RPL_ADDRESS,
  RETH_ADDRESS,
  BIGINT_NEGATIVE_ONE,
  BIGDECIMAL_HALF,
  BIGINT_TEN_TO_EIGHTEENTH,
  PRICEENCODE,
  NODEDEPOSIT_ENCODE,
  STORAGE,
  ONE_ETH_IN_WEI,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
} from "../utils/constants";
import { getOrCreatePool } from "../entities/pool";
import { getOrCreateProtocol } from "../entities/protocol";
import { getOrCreateMinipool } from "../entities/minipool";

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

/** Can potentially use minipool created/destroyed to track this instead */

/** Staking rewards is a function of amt of reth/eth ratio so can be calculated for any minipool based on amt of staked eth, and then slashing is subtracted from it ? */

/** handleMinipoolEnqeued represents the 16 Eth enqued by a Node Manager to be deployed by the protocol. This is represented in the TVL of the network.*/
export function handleMinipoolEnqueued(event: MinipoolEnqueued): void {
  // getorcreate minipool and update

  // update minipool tvl and revenue
  updateMinipoolTvlandRevenue(
    event.block,
    event.transaction.value,
    BIGINT_ZERO,
    BIGINT_ZERO,
    event.params.minipool.toHexString()
  );

  updateUsageMetrics(event.block, event.transaction.from);
  updateProtocolAndPoolTvl(event.block, event.transaction.value, BIGINT_ZERO);
  updateSnapshotsTvl(event.block);
}

/** handleMinipoolDeqeued represents the Eth being dequeued by a Node Manager. It has either received 16 staked eth from stakers,
 * in which case the TVL is unchanged, or has been removed prematurely by the Node Manager.
 * In this scenario, the value is subtracted from the TVL of the network.*/
export function handleMinipoolDequeued(event: MinipoolDequeued): void {
  // const deposit_address = getStorageAddress(NODEDEPOSIT_ENCODE);
  // if (event.transaction.to != deposit_address) {
  //   updateMinipoolTvlandRevenue(
  //     event.block,
  //     event.transaction.value.times(BIGINT_NEGATIVE_ONE),
  //     BIGINT_ZERO,
  //     BIGINT_ZERO,
  //     event.params.minipool.toHexString()
  //   );
  //   updateUsageMetrics(event.block, event.transaction.from);
  //   updateSnapshotsTvl(event.block);
  // }
}

/** handleMinipoolRemoved represents a Minipool being dissolved by a Node Manager. The value of the transaction is subtracted from the TVL of the network.*/
export function handleMinipoolRemoved(event: MinipoolRemoved): void {
  updateMinipoolTvlandRevenue(
    event.block,
    event.transaction.value.times(BIGINT_NEGATIVE_ONE),
    BIGINT_ZERO,
    BIGINT_ZERO,
    event.params.minipool.toHexString()
  );
  updateSnapshotsTvl(event.block);
}

// Handle RPL staked, withdrawn, slashed
//https://github.com/Data-Nexus/rocket-pool-mainnet/blob/master/src/mappings/rocketNodeStakingMapping.ts

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
  // update minipool tvl and revenue
  // updateMinipoolTvlandRevenue(
  //   event.block,
  //   BIGINT_ZERO,
  //   event.params.amount,
  //   BIGINT_ZERO,
  //   event.params.node.toHexString()
  // );

  updateUsageMetrics(event.block, event.params.node);
}

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
  const pools = pool.miniPools;
  if (pools) {
    var cumrevCounter: BigDecimal = BIGDECIMAL_ZERO;
    let avg_ComissionRate = BigDecimal.fromString("0.15");

    let Comissions = pool.miniPoolCommission;

    if (Comissions && Comissions.length > 0) {
      let sum = Comissions.reduce(
        (partialSum, a) => partialSum.plus(a),
        BIGDECIMAL_ZERO
      );
      log.error("[handleBalanceUpdate] sum: {}", [sum.toString()]);
      let len = bigIntToBigDecimal(
        BigInt.fromString(Comissions.length.toString())
      ).times(bigIntToBigDecimal(ONE_ETH_IN_WEI));
      log.error("[handleBalanceUpdate] len: {}", [len.toString()]);
    }
    log.error("[handleBalanceUpdate] comission rate: {}", [
      avg_ComissionRate.toString(),
    ]);
    cumrevCounter = getEthAmountUSD(BeaconChainRewardEth, event.block);
    log.error("[handleBalanceUpdate] cumRev: {}", [cumrevCounter.toString()]);
    let ratio = BIGDECIMAL_ZERO;
    if (pool.inputTokenBalances[1].gt(BIGINT_ZERO)) {
      ratio = bigIntToBigDecimal(pool.miniPoolTotalValueLocked).div(
        bigIntToBigDecimal(pool.inputTokenBalances[1])
      );
      let minipoolMultiplier = BIGDECIMAL_HALF.plus(
        BIGDECIMAL_HALF.times(avg_ComissionRate)
      );
      log.error("[handleBalanceUpdate] minipool multiplier: {}", [
        minipoolMultiplier.toString(),
      ]);
      let minipoolRevenue = ratio
        .times(bigIntToBigDecimal(BeaconChainRewardEth))
        .times(minipoolMultiplier);
      log.error("[handleBalanceUpdate] minipool rev in eth: {}", [
        minipoolRevenue.toString(),
      ]);

      let minipoolRevUSD = getEthAmountUSDDecimal(minipoolRevenue, event.block);

      updateTotalRevenueMetrics(event.block, cumrevCounter, totalsupply);
      updateProtocolSideRevenueMetrics(event.block, minipoolRevUSD);
      updateSupplySideRevenueMetrics(event.block);
    }
  }
}

// RPL rewards event -> can be used to find amount of rewards distributed
//https://github.com/Data-Nexus/rocket-pool-mainnet/blob/master/src/mappings/rocketRewardsPoolMapping.ts

// REWRITE CONCEPT
//
// rocketVault
//  EtherDeposited
//  EtherWithdrawn
// - network TVL of eth
//
//  TokenBurned
//  TokenDeposited
//  TokenTransfer
//  TokenWithdrawn
// - network TVL of RPL
// TokenTransfer contains "Claim" log, can be used to show rewards?

// In DataNexus's rocketpool subgraph, he uses a for-loop that iterates through all stakers (which there should be less of than minipools) and seems to avoid oneshot cancelled.

// It is difficult to track each minipool
