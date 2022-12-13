import {
  Address,
  ethereum,
  BigInt,
  BigDecimal,
  bigDecimal,
} from "@graphprotocol/graph-ts";
import { Token, Vault } from "../../generated/schema";
import {
  getOrCreateFinancialDailySnapshots,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateVaultsDailySnapshots,
  getOrCreateVaultsHourlySnapshots,
  getOrCreateYieldAggregator,
} from "../common/initializers";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import {
  DEFUALT_AMOUNT,
  ZERO_BIGINT,
  ZERO_BIGDECIMAL,
  BIGINT_TEN,
  BIGDECIMAL_ZERO,
} from "../helpers/constants";
import * as utils from "../common/utils";
import { Withdraw } from "../../generated/schema";
import { convertBigIntToBigDecimal } from "../helpers/converters";
import {
  calculatePriceInUSD,
  calculateOutputTokenPriceInUSD,
} from "../common/calculators";
import { getUsdPrice, getUsdPricePerToken } from "../Prices";
import { getPriceOfOutputTokens } from "./Price";
import { getPriceUsdcRecommended } from "../Prices/calculations/CalculationsSushiswap";
import { NETWORK_STRING } from "../Prices/config/avalanche";

export function _Withdraw(
  contractAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  vault: Vault,
  withdrawAmount: BigInt
): void {
  const vaultAddress = Address.fromString(vault.id);
  const strategyContract = YakStrategyV2.bind(contractAddress);

  if (strategyContract.try_totalSupply().reverted) {
    vault.outputTokenSupply = ZERO_BIGINT;
  } else {
    vault.outputTokenSupply = strategyContract.totalSupply();
  }

  if (strategyContract.try_totalDeposits().reverted) {
    vault.inputTokenBalance = ZERO_BIGINT;
  } else {
    vault.inputTokenBalance = strategyContract.totalDeposits();
    if (strategyContract.try_depositToken().reverted) {
      vault.totalValueLockedUSD = ZERO_BIGDECIMAL;
    }
    // else {
    //   vault.totalValueLockedUSD = getUsdPrice(
    //     strategyContract.depositToken(),
    //     ZERO_BIGDECIMAL
    //   ).times(convertBigIntToBigDecimal(strategyContract.totalDeposits(), 18));
    // }
  }

  if (strategyContract.try_getDepositTokensForShares(DEFUALT_AMOUNT).reverted) {
    vault.pricePerShare = ZERO_BIGDECIMAL;
  } else {
    vault.pricePerShare = convertBigIntToBigDecimal(
      strategyContract.getDepositTokensForShares(DEFUALT_AMOUNT),
      18
    );
  }

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.inputTokenBalance = vault.inputTokenBalance.minus(withdrawAmount);

  vault.outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    inputTokenAddress,
    inputTokenDecimals
  );

  // Update hourly and daily withdraw transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyWithdrawCount += 1;
  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();
  vault.save();

  utils.updateProtocolTotalValueLockedUSD();

  const withdrawAmountUSD = getPriceUsdcRecommended(
    strategyContract.depositToken(),
    NETWORK_STRING
  ).usdPrice;

  createWithdrawTransaction(
    contractAddress,
    vaultAddress,
    transaction,
    block,
    vault.inputToken,
    withdrawAmount,
    withdrawAmountUSD
  );

  let protocolSideFee: BigDecimal;
  let protocolSideRevenueUSD: BigDecimal;

  if (strategyContract.try_DEV_FEE_BIPS().reverted) {
    protocolSideFee = ZERO_BIGDECIMAL;
    protocolSideRevenueUSD = ZERO_BIGDECIMAL;
  } else {
    protocolSideFee = strategyContract
      .DEV_FEE_BIPS()
      .toBigDecimal()
      .div(bigDecimal.fromString("10000"));

    protocolSideRevenueUSD = withdrawAmountUSD.times(protocolSideFee);
  }

  updateUsageMetricsAfterWithdraw(block, protocolSideRevenueUSD, vault);
}

export function updateUsageMetricsAfterWithdraw(
  block: ethereum.Block,
  protocolSideRevenueUSD: BigDecimal,
  vault: Vault
): void {
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  const protocol = getOrCreateYieldAggregator();
  const vaultDailySnapshots = getOrCreateVaultsDailySnapshots(vault.id, block);
  const vaultHourlySnapshots = getOrCreateVaultsHourlySnapshots(
    vault.id,
    block
  );

  vaultDailySnapshots.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD.plus(protocolSideRevenueUSD);
  vaultDailySnapshots.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  vaultDailySnapshots.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD.plus(protocolSideRevenueUSD);

  vaultHourlySnapshots.cumulativeSupplySideRevenueUSD =
    vault.cumulativeSupplySideRevenueUSD.plus(protocolSideRevenueUSD);
  vaultHourlySnapshots.cumulativeProtocolSideRevenueUSD =
    vault.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);
  vaultHourlySnapshots.cumulativeTotalRevenueUSD =
    vault.cumulativeTotalRevenueUSD.plus(protocolSideRevenueUSD);

  vaultDailySnapshots.dailySupplySideRevenueUSD =
    vaultDailySnapshots.dailySupplySideRevenueUSD.plus(protocolSideRevenueUSD);
  vaultDailySnapshots.dailyProtocolSideRevenueUSD =
    vaultDailySnapshots.dailyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSD
    );
  vaultDailySnapshots.dailyTotalRevenueUSD =
    vaultDailySnapshots.dailyTotalRevenueUSD.plus(protocolSideRevenueUSD);

  vaultHourlySnapshots.hourlySupplySideRevenueUSD =
    vaultHourlySnapshots.hourlySupplySideRevenueUSD.plus(
      protocolSideRevenueUSD
    );
  vaultHourlySnapshots.hourlyProtocolSideRevenueUSD =
    vaultHourlySnapshots.hourlyProtocolSideRevenueUSD.plus(
      protocolSideRevenueUSD
    );
  vaultHourlySnapshots.hourlyTotalRevenueUSD =
    vaultHourlySnapshots.hourlyTotalRevenueUSD.plus(protocolSideRevenueUSD);

  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(protocolSideRevenueUSD);

  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    protocolSideRevenueUSD
  );

  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;

  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);

  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRevenueUSD);

  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  vaultDailySnapshots.save();
  vaultHourlySnapshots.save();
  financialMetrics.save();
  protocol.save();
}

export function createWithdrawTransaction(
  contractAddress: Address,
  vaultAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  assetId: string,
  amount: BigInt,
  amountUSD: BigDecimal
): Withdraw {
  let withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();

  let withdrawTransaction = Withdraw.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new Withdraw(withdrawTransactionId);

    withdrawTransaction.vault = vaultAddress.toHexString();
    const protocol = getOrCreateYieldAggregator();
    withdrawTransaction.protocol = protocol.id;

    withdrawTransaction.to = contractAddress.toHexString();
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
