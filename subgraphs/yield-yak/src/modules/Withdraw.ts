import { Address, ethereum, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { defineFee, getOrCreateFinancialDailySnapshots, getOrCreateUsageMetricsDailySnapshot, getOrCreateUsageMetricsHourlySnapshot, getOrCreateYieldAggregator } from "../common/initializers";
import { calculatePriceInUSD } from "../calculators/priceInUSDCalculator";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { DEFUALT_AMOUNT, BIGINT_TEN, ZERO_BIGINT, MAX_UINT256_STR, BIGDECIMAL_HUNDRED, ZERO_BIGDECIMAL } from "../helpers/constants";
import * as utils from "../common/utils";
import { calculateOutputTokenPriceInUSD } from "../calculators/outputTokenPriceInUSDCalculator";
import { Withdraw } from "../../generated/schema";
import { updateRevenueSnapshots } from "./Revenue";
import { BIGDECIMAL_ZERO } from "../Prices/common/constants";
import { convertBigIntToBigDecimal } from "../helpers/converters";

export function _Withdraw(
  contractAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  vault: Vault,
  withdrawAmount: BigInt,
  sharesBurnt: BigInt
): void {
  const vaultAddress = Address.fromString(vault.id);
  const strategyContract = YakStrategyV2.bind(contractAddress);

  if (sharesBurnt.toString() == "-1" || sharesBurnt.toString() == MAX_UINT256_STR) {
    sharesBurnt = calculateSharesBurnt(vaultAddress, withdrawAmount);
  }

  if (withdrawAmount.toString() == "-1" || withdrawAmount.toString() == MAX_UINT256_STR) {
    withdrawAmount = calculateAmountWithdrawn(vaultAddress, sharesBurnt);
  }

  let totalSupply = utils.readValue<BigInt>(
    strategyContract.try_totalSupply(),
    ZERO_BIGINT
  );
  vault.outputTokenSupply = totalSupply;

  if (strategyContract.try_totalDeposits().reverted) {
    vault.inputTokenBalance = ZERO_BIGINT;
  } else {
    vault.inputTokenBalance = strategyContract.totalDeposits();
    if (strategyContract.try_depositToken().reverted) {
      vault.totalValueLockedUSD = ZERO_BIGDECIMAL;
    } else {
      vault.totalValueLockedUSD = calculatePriceInUSD(strategyContract.depositToken(), DEFUALT_AMOUNT).times(convertBigIntToBigDecimal(strategyContract.totalDeposits(), 18));
    }
  }

  vault.outputTokenPriceUSD = calculateOutputTokenPriceInUSD(contractAddress);

  vault.pricePerShare = utils
    .readValue<BigInt>(strategyContract.try_getDepositTokensForShares(DEFUALT_AMOUNT), ZERO_BIGINT)
    .toBigDecimal();

  let withdrawAmountUSD = calculatePriceInUSD(strategyContract.depositToken(), transaction.value);

  createWithdrawTransaction(
    contractAddress,
    vaultAddress,
    transaction,
    block,
    vault.inputToken,
    withdrawAmount,
    withdrawAmountUSD
  );

  vault.save();

  const withdrawFeePercentage = defineFee(contractAddress, "-developerFee");

  let withdrawalFeeUSD = withdrawAmountUSD
    .times(withdrawFeePercentage.feePercentage!)
    .div(BIGDECIMAL_HUNDRED)

  updateRevenueSnapshots(
    vault,
    BIGDECIMAL_ZERO,
    withdrawalFeeUSD,
    block,
    contractAddress
  );

  utils.updateProtocolTotalValueLockedUSD(contractAddress);
  UpdateUsageMetricsAfterWithdraw(block, contractAddress);
}

export function UpdateUsageMetricsAfterWithdraw(block: ethereum.Block, contractAddress: Address): void {
  const protocol = getOrCreateYieldAggregator(contractAddress);

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block, contractAddress);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block, contractAddress);

  metricsDailySnapshot.dailyWithdrawCount += 1;
  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  protocol.save();
}

export function calculateSharesBurnt(
  vaultAddress: Address,
  withdrawAmount: BigInt
): BigInt {
  let vaultContract = YakStrategyV2.bind(vaultAddress);
  let totalAssets = utils.readValue<BigInt>(
    vaultContract.try_totalDeposits(),
    ZERO_BIGINT
  );
  let totalSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    ZERO_BIGINT
  );
  let sharesBurnt = totalAssets.equals(ZERO_BIGINT)
    ? withdrawAmount
    : withdrawAmount.times(totalSupply).div(totalAssets);

  return sharesBurnt;
}

export function calculateAmountWithdrawn(
  vaultAddress: Address,
  sharesBurnt: BigInt
): BigInt {
  let vaultContract = YakStrategyV2.bind(vaultAddress);
  let totalAssets = utils.readValue<BigInt>(
    vaultContract.try_totalDeposits(),
    ZERO_BIGINT
  );
  let totalSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    ZERO_BIGINT
  );

  let amount = totalSupply.isZero()
    ? ZERO_BIGINT
    : sharesBurnt.times(totalAssets).div(totalSupply);

  return amount;
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
    const protocol = getOrCreateYieldAggregator(contractAddress);
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