import { Address, log } from "@graphprotocol/graph-ts";
import {
  DepositPool,
  DepositReceived,
} from "../../generated/RocketPool/DepositPool";
import { RETH } from "../../generated/RocketPool/RETH";
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
  RETH_ADDRESS,
} from "../utils/constants";
import { getOrCreatePool } from "../entities/pool";

export function handleDeposit(event: DepositReceived): void {
  // update Token lastPrice and lastBlock
  getOrCreateToken(Address.fromString(ETH_ADDRESS), event.block.number);
  getOrCreateToken(Address.fromString(RETH_ADDRESS), event.block.number);

  // get pre and post pooled ether
  let preTotalPooledEther = BIGINT_ZERO;
  let postTotalPooledEther = BIGINT_ZERO;

  // get total shares
  let totalShares = BIGINT_ZERO;
  let rEth = RETH.bind(Address.fromString(RETH_ADDRESS));
  // total shares == total supply? I think yes that coresponds to RETH
  let getTotalSharesCallResult = rEth.try_totalSupply();

  if (getTotalSharesCallResult.reverted) {
    log.info("rEth call reverted", []);
  } else {
    totalShares = getTotalSharesCallResult.value;
  }

  // get node operators
  let sender = event.params.from;
  let value = event.params.amount;

  postTotalPooledEther = value;

  const pool = getOrCreatePool(event.block.number, event.block.timestamp);

  // update metrics

  // require total shares, new minted tokens which can be gotten from deposit()
  // totalshares = reth token.total_supply() ??

  updateUsageMetrics(event.block, sender);
  updateProtocolAndPoolTvl(event.block, value);
  updateSnapshotsTvl(event.block);
  updateProtocolSideRevenueMetrics(event.block, value);
  if (totalShares > pool.outputTokenSupply!) {
    updateTotalRevenueMetrics(
      event.block,
      // 0
      preTotalPooledEther,
      //new deposit
      postTotalPooledEther,
      totalShares
    );
  }
  updateSupplySideRevenueMetrics(event.block);
}
