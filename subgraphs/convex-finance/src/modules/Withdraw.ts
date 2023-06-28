import {
  Vault as VaultStore,
  Withdraw as WithdrawTransaction,
} from "../../generated/schema";
import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateYieldAggregator,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { ERC20 } from "../../generated/Booster/ERC20";
import { Pool as PoolContract } from "../../generated/Booster/Pool";

export function createWithdrawTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  withdrawnTo: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): WithdrawTransaction {
  const withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();

  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

    withdrawTransaction.vault = vault.id;
    withdrawTransaction.protocol =
      constants.CONVEX_BOOSTER_ADDRESS.toHexString();

    withdrawTransaction.to = withdrawnTo.toHexString();
    withdrawTransaction.from = vault.id;

    withdrawTransaction.hash = transaction.hash.toHexString();
    withdrawTransaction.logIndex = transaction.index.toI32();

    withdrawTransaction.asset = vault.inputToken;
    withdrawTransaction.amount = amount;
    withdrawTransaction.amountUSD = amountUSD;

    withdrawTransaction.timestamp = block.timestamp;
    withdrawTransaction.blockNumber = block.number;

    withdrawTransaction.save();
  }

  return withdrawTransaction;
}

export function UpdateMetricsAfterWithdraw(block: ethereum.Block): void {
  const protocol = getOrCreateYieldAggregator();

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyWithdrawCount += 1;
  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  protocol.save();
}

export function withdraw(
  vault: VaultStore,
  withdrawAmount: BigInt,
  withdrawnTo: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const poolAddress = Address.fromString(vault._pool);
  const poolContract = PoolContract.bind(poolAddress);
  const outputTokenContract = ERC20.bind(
    Address.fromString(vault.outputToken!)
  );

  const inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress, block);
  let inputTokenDecimals = utils.getTokenDecimals(inputTokenAddress);

  if (constants.MISSING_POOLS_MAP.get(inputTokenAddress)) {
    const poolTokenAddress =
      constants.MISSING_POOLS_MAP.get(inputTokenAddress)!;

    inputTokenPrice = getUsdPricePerToken(poolTokenAddress, block);
    inputTokenDecimals = utils.getTokenDecimals(poolTokenAddress);
  }

  const withdrawAmountUSD = withdrawAmount
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.outputTokenSupply = utils.readValue<BigInt>(
    outputTokenContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  vault.inputTokenBalance = vault.inputTokenBalance.minus(withdrawAmount);

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.pricePerShare = utils
    .readValue<BigInt>(
      poolContract.try_get_virtual_price(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  createWithdrawTransaction(
    vault,
    withdrawAmount,
    withdrawAmountUSD,
    withdrawnTo,
    transaction,
    block
  );

  vault.save();

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterWithdraw(block);

  log.info(
    "[Withdraw] vault: {}, withdrawAmount: {}, withdrawAmountUSD: {}, outputTokenPriceUSD: {}, TxnHash: {}",
    [
      vault.id,
      withdrawAmount.toString(),
      withdrawAmountUSD.toString(),
      vault.outputTokenPriceUSD!.toString(),
      transaction.hash.toHexString(),
    ]
  );
}
