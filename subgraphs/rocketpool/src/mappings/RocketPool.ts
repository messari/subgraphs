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
} from "../../generated/rocketMinipoolQueue/rocketMinipoolQueue";
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
  STORAGE,
  ONE_ETH_IN_WEI,
  BIGDECIMAL_ONE,
} from "../utils/constants";
import { getOrCreatePool } from "../entities/pool";
import { getOrCreateProtocol } from "../entities/protocol";

export function handleEtherDeposit(event: EtherDeposited): void {
  let rpl_amt = BIGINT_ZERO;
  const rpl_amount = ERC20.bind(
    Address.fromString(RPL_ADDRESS)
  ).try_totalSupply();
  if (rpl_amount.reverted) {
    log.info("RPL Amount call reverted", []);
  } else {
    rpl_amt = rpl_amount.value;
  }

  updateProtocolAndPoolTvl(event.block, event.params.amount, rpl_amt);
  updateSnapshotsTvl(event.block);
}

export function handleEtherWithdrawn(event: EtherWithdrawn): void {
  let rpl_amt = BIGINT_ZERO;
  const rpl_amount = ERC20.bind(
    Address.fromString(RPL_ADDRESS)
  ).try_totalSupply();
  if (rpl_amount.reverted) {
    log.info("RPL Amount call reverted", []);
  } else {
    rpl_amt = rpl_amount.value;
  }

  updateProtocolAndPoolTvl(
    event.block,
    BIGINT_NEGATIVE_ONE.times(event.params.amount),
    rpl_amt
  );
  updateSnapshotsTvl(event.block);
}

/** Queries Storage Address for current address of encode. encode is the string of the name of the rocketpool contract, which has been keccack256(abi.unpack(string)) in solidity. */
function getStorageAddress(encode: Bytes): Address {
  const storage = RocketStorage.bind(Address.fromString(STORAGE));
  let address = storage.try_getAddress(encode);
  if (address.reverted) {
    log.info("fees address call reverted", []);
    return Address.fromString("0x0000000000000000000000000000000000000000");
  } else {
    return Address.fromBytes(address.value);
  }
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
  updateProtocolSideRevenueMetrics(event.block, bigIntToBigDecimal(eth_amt));
  updateTotalRevenueMetrics(event.block, bigIntToBigDecimal(eth_amt), rpl_amt);
  updateSupplySideRevenueMetrics(event.block);
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
  updateProtocolSideRevenueMetrics(event.block, bigIntToBigDecimal(eth_amt));
  updateTotalRevenueMetrics(event.block, bigIntToBigDecimal(eth_amt), rpl_amt);
  updateSupplySideRevenueMetrics(event.block);
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
  updateProtocolSideRevenueMetrics(event.block, bigIntToBigDecimal(eth_amt));
  updateTotalRevenueMetrics(event.block, bigIntToBigDecimal(eth_amt), rpl_amt);
  updateSupplySideRevenueMetrics(event.block);
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

// RPL rewards event -> can be used to find amount of rewards distributed
//https://github.com/Data-Nexus/rocket-pool-mainnet/blob/master/src/mappings/rocketRewardsPoolMapping.ts

export function handleMinipoolEnqueued(event: MinipoolEnqueued): void {
  updateProtocolSideRevenueMetrics(event.block, BigDecimal.fromString("16.0"));

  let rpl_amt = BIGINT_ZERO;
  const rpl_amount = ERC20.bind(
    Address.fromString(RPL_ADDRESS)
  ).try_totalSupply();
  if (rpl_amount.reverted) {
    log.info("RPL Amount call reverted", []);
  } else {
    rpl_amt = rpl_amount.value;
  }

  updateTotalRevenueMetrics(
    event.block,
    BigDecimal.fromString("16.0"),
    rpl_amt
  );
  updateSupplySideRevenueMetrics(event.block);
}

export function handleMinipoolRemoved(event: MinipoolRemoved): void {
  updateProtocolSideRevenueMetrics(event.block, BigDecimal.fromString("-16.0"));

  let rpl_amt = BIGINT_ZERO;
  const rpl_amount = ERC20.bind(
    Address.fromString(RPL_ADDRESS)
  ).try_totalSupply();
  if (rpl_amount.reverted) {
    log.info("RPL Amount call reverted", []);
  } else {
    rpl_amt = rpl_amount.value;
  }

  updateTotalRevenueMetrics(
    event.block,
    BigDecimal.fromString("-16.0"),
    rpl_amt
  );
  updateSupplySideRevenueMetrics(event.block);
}

// export function handleBalanceUpdate(event: BalancesUpdated): void {
//   const protocol = getOrCreateProtocol();
//   const rewardEth = event.params.totalEth.minus(event.params.stakingEth);

//   // total reward Eth

//   // staking eth - (minipool count * 16) = supply side eth

//   // protocol side reward eth = ((minipool count * 16) / staking eth) * reward eth

//   let fee = BIGINT_ZERO;

//   const storage = RocketStorage.bind(Address.fromString(STORAGE));
//   let fees_address = storage.try_getAddress(NETWORKENCODE);
//   if (fees_address.reverted) {
//     log.info("fees address call reverted", []);
//   } else {
//     const fees_contract = rocketNetworkFees.bind(
//       Address.fromBytes(fees_address.value)
//     );
//     let fees_call = fees_contract.try_getNodeFee();
//     if (fees_call.reverted) {
//       log.info("fees address call reverted", []);
//     } else {
//       fee = fees_call.value;
//     }

//     // const amt = BIGDECIMAL_HALF.times(
//     //   bigIntToBigDecimal(rewardEth).minus(protocol.cumulativeTotalRevenueUSD)
//     // ).plus(
//     //   BIGDECIMAL_HALF.times(
//     //     bigIntToBigDecimal(rewardEth).minus(protocol.cumulativeTotalRevenueUSD)
//     //   ).times(
//     //     bigIntToBigDecimal(fee).div(new BigDecimal(BIGINT_TEN_TO_EIGHTEENTH))
//     //   )
//     // );

//     updateTotalRevenueMetrics(
//       event.block,
//       bigIntToBigDecimal(rewardEth),
//       event.params.rethSupply
//     );
//     updateProtocolSideRevenueMetrics(
//       event.block,
//       bigIntToBigDecimal(rewardEth)
//     );
//     updateSupplySideRevenueMetrics(event.block);

//   }
// }

// export function handleNodeDeposit(event: DepositReceived): void {
//   let rpl_amt = BIGINT_ZERO;
//   const rpl_amount = ERC20.bind(
//     Address.fromString(RPL_ADDRESS)
//   ).try_totalSupply();
//   if (rpl_amount.reverted) {
//     log.info("RPL Amount call reverted", []);
//   } else {
//     rpl_amt = rpl_amount.value;
//   }

//   updateUsageMetrics(event.block, event.params.from);
//   updateProtocolAndPoolTvl(event.block, event.params.amount, rpl_amt);
//   updateSnapshotsTvl(event.block);
// }

// // export function handleDeposit(event: DepositReceived): void {
// //   // update Token lastPrice and lastBlock
// //   getOrCreateToken(Address.fromString(ETH_ADDRESS), event.block.number);
// //   getOrCreateToken(Address.fromString(RETH_ADDRESS), event.block.number);

// //   // get pre and post pooled ether
// //   let preTotalPooledEther = BIGINT_ZERO;
// //   let postTotalPooledEther = BIGINT_ZERO;

// //   // get total shares
// //   let totalShares = BIGINT_ZERO;
// //   let rEth = RETH.bind(Address.fromString(RETH_ADDRESS));
// //   // total shares == total supply? I think yes that coresponds to RETH
// //   let getTotalSharesCallResult = rEth.try_totalSupply();

// //   if (getTotalSharesCallResult.reverted) {
// //     log.info("rEth call reverted", []);
// //   } else {
// //     totalShares = getTotalSharesCallResult.value;
// //   }

// //   // get node operators
// //   let sender = event.params.from;
// //   let value = event.params.amount;

// //   postTotalPooledEther = value;

// //   const pool = getOrCreatePool(event.block.number, event.block.timestamp);

// //   // update metrics

// //   // require total shares, new minted tokens which can be gotten from deposit()
// //   // totalshares = reth token.total_supply() ??

// //   updateUsageMetrics(event.block, sender);

// //   // staker tvl = sum of eth staked in staking pool
// //   // protocol - 16 for each minipool
// //   // remove on unstake
// //   updateProtocolAndPoolTvl(event.block, value);
// //   updateSnapshotsTvl(event.block);

// // // eth assigned in assigndeposits is all going to minipools (depositassigned amount)

// //   updateProtocolSideRevenueMetrics(event.block, value);
// //   updateTotalRevenueMetrics(
// //     event.block,
// //     // 0
// //     preTotalPooledEther,
// //     //new deposit
// //     postTotalPooledEther,
// //     totalShares
// //   );

// //   // supply side revenue = total tvl ()
// //   updateSupplySideRevenueMetrics(event.block);
// // }
