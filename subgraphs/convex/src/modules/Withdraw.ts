import {
  Token,
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
} from "../common/initializer";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { ERC20 } from "../../generated/Booster/ERC20";
import { Pool as PoolContract } from "../../generated/Booster/Pool";

export function createWithdrawTransaction(
  to: Address,
  vaultId: string,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  assetId: string,
  amount: BigInt,
  amountUSD: BigDecimal
): WithdrawTransaction {
  let withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();

  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

    withdrawTransaction.vault = vaultId;
    withdrawTransaction.protocol = constants.CONVEX_BOOSTER_ADDRESS.toHexString();

    withdrawTransaction.to = to.toHexString();
    withdrawTransaction.from = transaction.from.toHexString();

    withdrawTransaction.hash = transaction.hash.toHexString();
    withdrawTransaction.logIndex = transaction.index.toI32();

    withdrawTransaction.asset = assetId;
    withdrawTransaction.amount = amount;
    withdrawTransaction.amountUSD = amountUSD;

    withdrawTransaction.timestamp = block.timestamp;
    withdrawTransaction.blockNumber = block.number;

    withdrawTransaction.save();
  }

  return withdrawTransaction;
}

export function withdraw(
  to: Address,
  vault: VaultStore,
  withdrawAmount: BigInt,
  block: ethereum.Block,
  transaction: ethereum.Transaction
): void {
  const protocol = getOrCreateYieldAggregator();

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  let withdrawAmountUSD = withdrawAmount
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.inputTokenBalance = vault.inputTokenBalance.minus(withdrawAmount);
  vault.totalValueLockedUSD = vault.inputTokenBalance
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  const poolAddress = Address.fromString(vault._pool);
  const poolContract = PoolContract.bind(poolAddress);
  const outputTokenContract = ERC20.bind(Address.fromString(vault.outputToken!));

  vault.outputTokenSupply = utils.readValue<BigInt>(
    outputTokenContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );
  vault.pricePerShare = utils
    .readValue<BigInt>(
      poolContract.try_get_virtual_price(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  createWithdrawTransaction(
    to,
    vault.id,
    transaction,
    block,
    vault.inputToken,
    withdrawAmount,
    withdrawAmountUSD
  );

  // Update hourly and daily withdraw transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyWithdrawCount += 1;
  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();
  protocol.save();
  vault.save();

  utils.updateProtocolTotalValueLockedUSD();
}
