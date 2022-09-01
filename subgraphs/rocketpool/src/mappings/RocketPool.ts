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
  NETWORKENCODE,
  PRICEENCODE,
  NODEDEPOSIT_ENCODE,
  STORAGE,
  ONE_ETH_IN_WEI,
  BIGDECIMAL_ONE,
} from "../utils/constants";
import { getOrCreatePool } from "../entities/pool";
import { getOrCreateProtocol } from "../entities/protocol";

/** Queries Storage Address for current address of encode. encode is the string of the name of the rocketpool contract, which has been keccack256(abi.unpack(string)) in solidity. */
function getStorageAddress(encode: Bytes): Address {
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
  updateProtocolAndPoolTvl(event.block, event.params.amount, "staking");
  updateSnapshotsTvl(event.block, "staking");
}

/** handleEtherWithdrawn tracks ether withdrawn into rocketpool, which represents the TVL of the ETH staked in the pool. */

export function handleEtherWithdrawn(event: EtherWithdrawn): void {
  updateUsageMetrics(event.block, event.transaction.from);
  updateProtocolAndPoolTvl(
    event.block,
    BIGINT_NEGATIVE_ONE.times(event.params.amount),
    "staking"
  );
  updateSnapshotsTvl(event.block, "staking");
}

/** handleMinipoolEnqeued represents the 16 Eth enqued by a Node Manager to be deployed by the protocol. This is represented in the TVL of the network.*/
export function handleMinipoolEnqueued(event: MinipoolEnqueued): void {
  updateUsageMetrics(event.block, event.transaction.from);
  updateProtocolAndPoolTvl(
    event.block,
    event.transaction.value,
    event.params.minipool.toString()
  );
  updateSnapshotsTvl(event.block, event.params.minipool.toString());
}

/** handleMinipoolDeqeued represents the Eth being dequeued by a Node Manager. It has either received 16 staked eth from stakers,
 * in which case the TVL is unchanged, or has been removed prematurely by the Node Manager.
 * In this scenario, the value is subtracted from the TVL of the network.*/
export function handleMinipoolDequeued(event: MinipoolDequeued): void {
  const deposit_address = getStorageAddress(NODEDEPOSIT_ENCODE);

  if (event.transaction.to != deposit_address) {
    updateUsageMetrics(event.block, event.transaction.from);
    updateProtocolAndPoolTvl(
      event.block,
      BIGINT_NEGATIVE_ONE.times(event.transaction.value),
      event.params.minipool.toString()
    );
    updateSnapshotsTvl(event.block, event.params.minipool.toString());
  }
}

/** handleMinipoolRemoved represents a Minipool being dissolved by a Node Manager. The value of the transaction is subtracted from the TVL of the network.*/
export function handleMinipoolRemoved(event: MinipoolRemoved): void {
  updateUsageMetrics(event.block, event.transaction.from);
  updateProtocolAndPoolTvl(
    event.block,
    BIGINT_NEGATIVE_ONE.times(event.transaction.value),
    event.params.minipool.toString()
  );
  updateSnapshotsTvl(event.block, event.params.minipool.toString());
}

// Handle RPL staked, withdrawn, slashed -> Effective proxy for amount of ETH deposited by node managers
//https://github.com/Data-Nexus/rocket-pool-mainnet/blob/master/src/mappings/rocketNodeStakingMapping.ts

// Handle Eth staked withdrawn slahed by looking at

export function handleRPLStaked(event: RPLStaked): void {
  if (event === null || event.params === null || event.params.from === null)
    return;

  let eth_amt = RPLamountinEth(event, event.params.amount);

  let rpl_amt = BIGINT_ZERO;
  const rpl_amount = ERC20.bind(
    Address.fromString(RPL_ADDRESS)
  ).try_totalSupply();
  if (rpl_amount.reverted) {
    log.info("RPL Amount call reverted", []);
  } else {
    rpl_amt = rpl_amount.value;
  }

  updateUsageMetrics(event.block, event.params.from);
  updateProtocolSideRevenueMetrics(
    event.block,
    bigIntToBigDecimal(eth_amt),
    event.params.from.toString()
  );
  updateTotalRevenueMetrics(
    event.block,
    bigIntToBigDecimal(eth_amt),
    rpl_amt,
    event.params.from.toString()
  );
  updateProtocolAndPoolTvl(event.block, eth_amt, event.params.from.toString());
  updateSnapshotsTvl(event.block, event.params.from.toString());
}

export function handleRPLWithdrawn(event: RPLWithdrawn): void {
  if (event === null || event.params === null || event.params.to === null)
    return;

  let eth_amt = RPLamountinEth(event, event.params.amount).times(
    BigInt.fromString("-1")
  );

  let rpl_amt = BIGINT_ZERO;
  const rpl_amount = ERC20.bind(
    Address.fromString(RPL_ADDRESS)
  ).try_totalSupply();
  if (rpl_amount.reverted) {
    log.info("RPL Amount call reverted", []);
  } else {
    rpl_amt = rpl_amount.value;
  }

  updateUsageMetrics(event.block, event.params.to);
  updateProtocolSideRevenueMetrics(
    event.block,
    bigIntToBigDecimal(eth_amt),
    event.params.to.toString()
  );
  updateTotalRevenueMetrics(
    event.block,
    bigIntToBigDecimal(eth_amt),
    rpl_amt,
    event.params.to.toString()
  );
  updateProtocolAndPoolTvl(
    event.block,
    eth_amt.times(BIGINT_NEGATIVE_ONE),
    event.params.to.toString()
  );
  updateSnapshotsTvl(event.block, event.params.to.toString());
}

export function handleRPLSlashed(event: RPLSlashed): void {
  if (event === null || event.params === null || event.params.node === null)
    return;

  let eth_amt = RPLamountinEth(event, event.params.amount).times(
    BigInt.fromString("-1")
  );

  let rpl_amt = BIGINT_ZERO;
  const rpl_amount = ERC20.bind(
    Address.fromString(RPL_ADDRESS)
  ).try_totalSupply();
  if (rpl_amount.reverted) {
    log.info("RPL Amount call reverted", []);
  } else {
    rpl_amt = rpl_amount.value;
  }

  updateUsageMetrics(event.block, event.params.node);
  updateProtocolSideRevenueMetrics(
    event.block,
    bigIntToBigDecimal(eth_amt),
    event.params.node.toString()
  );
  updateTotalRevenueMetrics(
    event.block,
    bigIntToBigDecimal(eth_amt),
    rpl_amt,
    event.params.node.toString()
  );
}
/**
 * Save a new RPL stake transaction.
 */
function RPLamountinEth(event: ethereum.Event, amount: BigInt): BigInt {
  // This state has to be valid before we can actually do anything.
  if (event === null || event.block === null || amount === BigInt.fromI32(0))
    return BIGINT_ZERO;

  // Load the storage contract because we need to get the rETH contract address. (and some of its state)
  const rocketPoolPrices = getStorageAddress(PRICEENCODE);
  let rocketNetworkPricesContract = rocketNetworkPrices.bind(rocketPoolPrices);

  // Calculate the ETH amount at the time of the transaction.
  let rplETHExchangeRate = rocketNetworkPricesContract.getRPLPrice();
  let ethAmount = amount.times(rplETHExchangeRate).div(ONE_ETH_IN_WEI);

  return ethAmount;
}

function handleBalanceUpdate(event: BalancesUpdated): void {
  const BeaconChainRewardEth = event.params.totalEth
    .minus(event.params.stakingEth)
    .div(ONE_ETH_IN_WEI);
}

// RPL rewards event -> can be used to find amount of rewards distributed
//https://github.com/Data-Nexus/rocket-pool-mainnet/blob/master/src/mappings/rocketRewardsPoolMapping.ts
