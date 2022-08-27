import { BigDecimal, BigInt, Address, log } from "@graphprotocol/graph-ts";
import { bigIntToBigDecimal } from "../utils/numbers";
import {
  EtherDeposited,
  EtherWithdrawn,
} from "../../generated/RocketVault/RocketVault";
import { BalancesUpdated } from "../../generated/RocketNetworkBalances/rocketNetworkBalances";
import { DepositReceived } from "../../generated/rocketNodeDeposit/rocketNodeDeposit";
import { rocketNetworkFees } from "../../generated/rocketVault/rocketNetworkFees";
import { RocketStorage } from "../../generated/rocketVault/RocketStorage";
import { RETH } from "../../generated/rocketVault/RETH";
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
  STORAGE,
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

export function handleBalanceUpdate(event: BalancesUpdated): void {
  const protocol = getOrCreateProtocol();
  const rewardEth = event.params.totalEth.minus(event.params.stakingEth);

  // total reward Eth

  // staking eth - (minipool count * 16) = supply side eth

  // protocol side reward eth = ((minipool count * 16) / staking eth) * reward eth

  let fee = BIGINT_ZERO;

  const storage = RocketStorage.bind(Address.fromString(STORAGE));
  let fees_address = storage.try_getAddress(NETWORKENCODE);
  if (fees_address.reverted) {
    log.info("fees address call reverted", []);
  } else {
    const fees_contract = rocketNetworkFees.bind(
      Address.fromBytes(fees_address.value)
    );
    let fees_call = fees_contract.try_getNodeFee();
    if (fees_call.reverted) {
      log.info("fees address call reverted", []);
    } else {
      fee = fees_call.value;
    }

    // const amt = BIGDECIMAL_HALF.times(
    //   bigIntToBigDecimal(rewardEth).minus(protocol.cumulativeTotalRevenueUSD)
    // ).plus(
    //   BIGDECIMAL_HALF.times(
    //     bigIntToBigDecimal(rewardEth).minus(protocol.cumulativeTotalRevenueUSD)
    //   ).times(
    //     bigIntToBigDecimal(fee).div(new BigDecimal(BIGINT_TEN_TO_EIGHTEENTH))
    //   )
    // );

    updateTotalRevenueMetrics(
      event.block,
      bigIntToBigDecimal(rewardEth),
      event.params.rethSupply
    );
    updateProtocolSideRevenueMetrics(
      event.block,
      bigIntToBigDecimal(rewardEth)
    );
    updateSupplySideRevenueMetrics(event.block);
  }
}

export function handleNodeDeposit(event: DepositReceived): void {
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
  updateProtocolAndPoolTvl(event.block, event.params.amount, rpl_amt);
  updateSnapshotsTvl(event.block);
}

// export function handleDeposit(event: DepositReceived): void {
//   // update Token lastPrice and lastBlock
//   getOrCreateToken(Address.fromString(ETH_ADDRESS), event.block.number);
//   getOrCreateToken(Address.fromString(RETH_ADDRESS), event.block.number);

//   // get pre and post pooled ether
//   let preTotalPooledEther = BIGINT_ZERO;
//   let postTotalPooledEther = BIGINT_ZERO;

//   // get total shares
//   let totalShares = BIGINT_ZERO;
//   let rEth = RETH.bind(Address.fromString(RETH_ADDRESS));
//   // total shares == total supply? I think yes that coresponds to RETH
//   let getTotalSharesCallResult = rEth.try_totalSupply();

//   if (getTotalSharesCallResult.reverted) {
//     log.info("rEth call reverted", []);
//   } else {
//     totalShares = getTotalSharesCallResult.value;
//   }

//   // get node operators
//   let sender = event.params.from;
//   let value = event.params.amount;

//   postTotalPooledEther = value;

//   const pool = getOrCreatePool(event.block.number, event.block.timestamp);

//   // update metrics

//   // require total shares, new minted tokens which can be gotten from deposit()
//   // totalshares = reth token.total_supply() ??

//   updateUsageMetrics(event.block, sender);

//   // staker tvl = sum of eth staked in staking pool
//   // protocol - 16 for each minipool
//   // remove on unstake
//   updateProtocolAndPoolTvl(event.block, value);
//   updateSnapshotsTvl(event.block);

// // eth assigned in assigndeposits is all going to minipools (depositassigned amount)

//   updateProtocolSideRevenueMetrics(event.block, value);
//   updateTotalRevenueMetrics(
//     event.block,
//     // 0
//     preTotalPooledEther,
//     //new deposit
//     postTotalPooledEther,
//     totalShares
//   );

//   // supply side revenue = total tvl ()
//   updateSupplySideRevenueMetrics(event.block);
// }
