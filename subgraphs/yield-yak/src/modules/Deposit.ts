import { Address, ethereum, BigInt, BigDecimal, log, dataSource } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { defineFee, getOrCreateUsageMetricsDailySnapshot, getOrCreateUsageMetricsHourlySnapshot, getOrCreateYieldAggregator } from "../common/initializers";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { DEFUALT_AMOUNT, BIGINT_TEN, ZERO_BIGINT, BIGDECIMAL_HUNDRED, ZERO_BIGDECIMAL } from "../helpers/constants";
import * as utils from "../common/utils";
import { Token } from "../../generated/schema";
import { Deposit } from "../../generated/schema";
import { updateRevenueSnapshots } from "./Revenue";
import { getUsdPricePerToken } from "../Prices";
import { getPriceOfOutputTokens } from "./Price";
import { calculatePriceInUSD } from "../calculators/priceInUSDCalculator";
import { convertBigIntToBigDecimal } from "../helpers/converters";
import { calculateOutputTokenPriceInUSD } from "../calculators/outputTokenPriceInUSDCalculator";

export function _Deposit(
  contractAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  vault: Vault,
  amount: BigInt,
  depositAmount: BigInt
): void {
  const vaultAddress = Address.fromString(vault.id);
  const strategyContract = YakStrategyV2.bind(contractAddress);

  let totalSupply = utils.readValue<BigInt>(
    strategyContract.try_totalSupply(),
    ZERO_BIGINT
  );
  vault.outputTokenSupply = totalSupply;

  let totalAssets = utils.readValue<BigInt>(
    strategyContract.try_totalDeposits(),
    ZERO_BIGINT
  );
  vault.inputTokenBalance = totalAssets;

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let depositAmountUSD = calculatePriceInUSD(inputTokenAddress, amount);
  let inputTokenDecimals = BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  vault.totalValueLockedUSD = calculatePriceInUSD(strategyContract.depositToken(), DEFUALT_AMOUNT).times(convertBigIntToBigDecimal(strategyContract.totalDeposits(), 18));
  vault.outputTokenPriceUSD = calculateOutputTokenPriceInUSD(contractAddress);

  vault.pricePerShare = utils
    .readValue<BigInt>(strategyContract.try_getDepositTokensForShares(DEFUALT_AMOUNT), ZERO_BIGINT)
    .toBigDecimal();

  vault.save();

  const depositFeePercentage = defineFee(contractAddress, "-developerFee");

  createDepositTransaction(
    contractAddress,
    vaultAddress,
    transaction,
    block,
    vault.inputToken,
    depositAmount,
    depositAmountUSD
  );

  let depositFeeUSD = depositAmountUSD
    .times(depositFeePercentage.feePercentage!)
    .div(BIGDECIMAL_HUNDRED);

  updateRevenueSnapshots(
    vault,
    ZERO_BIGDECIMAL,
    depositFeeUSD,
    block,
    contractAddress
  );

  utils.updateProtocolTotalValueLockedUSD(contractAddress);

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block, contractAddress);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block, contractAddress);

  metricsDailySnapshot.dailyDepositCount += 1;
  metricsHourlySnapshot.hourlyDepositCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();
  // updateFinancialsAfterDeposit(block, depositFeeUSD);
}

// export function updateFinancialsAfterDeposit(block: ethereum.Block, allDistributedRewardInUSD: BigDecimal): void {
//   const financialMetrics = getOrCreateFinancialDailySnapshots(block);
//   const protocol = getOrCreateYieldAggregator();

//   // TotalRevenueUSD Metrics
//   financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(allDistributedRewardInUSD);
//   protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(allDistributedRewardInUSD);
//   financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

//   // ProtocolSideRevenueUSD Metrics
//   financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(allDistributedRewardInUSD);
//   protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(allDistributedRewardInUSD);
//   financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;

//   financialMetrics.save();
//   protocol.save();
// }

export function createDepositTransaction(
  contractAddress: Address,
  vaultAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  assetId: string,
  amount: BigInt,
  amountUSD: BigDecimal
): Deposit {
  let transactionId = "deposit-" + transaction.hash.toHexString();
  let depositTransaction = Deposit.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new Deposit(transactionId);

    depositTransaction.vault = vaultAddress.toHexString();

    const protocol = getOrCreateYieldAggregator(contractAddress);
    depositTransaction.protocol = protocol.id;

    depositTransaction.to = contractAddress.toHexString();
    depositTransaction.from = transaction.from.toHexString();

    depositTransaction.hash = transaction.hash.toHexString();
    depositTransaction.logIndex = transaction.index.toI32();

    depositTransaction.asset = assetId;
    depositTransaction.amount = amount;
    depositTransaction.amountUSD = amountUSD;

    depositTransaction.timestamp = block.timestamp;
    depositTransaction.blockNumber = block.number;

    depositTransaction.save();
  }

  return depositTransaction;
}

