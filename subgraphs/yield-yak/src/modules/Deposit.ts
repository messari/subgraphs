import { Address, ethereum, BigInt, BigDecimal, log, dataSource } from "@graphprotocol/graph-ts";
import { Vault } from "../../generated/schema";
import { getOrCreateUsageMetricsDailySnapshot, getOrCreateUsageMetricsHourlySnapshot, getOrCreateYieldAggregator } from "../common/initializers";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import { DEFUALT_AMOUNT, BIGINT_TEN, ZERO_BIGINT, ZERO_BIGDECIMAL } from "../helpers/constants";
import * as utils from "../common/utils";
import { Token } from "../../generated/schema";
import { Deposit } from "../../generated/schema";
import { calculatePriceInUSD } from "../calculators/priceInUSDCalculator";
import { calculateOutputTokenPriceInUSD } from "../calculators/outputTokenPriceInUSDCalculator";
import { convertBigIntToBigDecimal } from "../helpers/converters";

export function _Deposit(
  contractAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  vault: Vault,
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
  let depositAmountUSD = calculatePriceInUSD(inputTokenAddress, depositAmount);
  let inputTokenDecimals = BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  vault.totalValueLockedUSD = calculatePriceInUSD(strategyContract.depositToken(), DEFUALT_AMOUNT).times(convertBigIntToBigDecimal(strategyContract.totalDeposits(), 18));
  vault.outputTokenPriceUSD = calculateOutputTokenPriceInUSD(contractAddress);

  vault.pricePerShare = utils
    .readValue<BigInt>(strategyContract.try_getDepositTokensForShares(DEFUALT_AMOUNT), ZERO_BIGINT)
    .toBigDecimal();

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyDepositCount += 1;
  metricsHourlySnapshot.hourlyDepositCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();
  vault.save();

  utils.updateProtocolTotalValueLockedUSD();

  createDepositTransaction(
    contractAddress,
    vaultAddress,
    transaction,
    block,
    vault.inputToken,
    depositAmount,
    depositAmountUSD
  );
}

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

    const protocol = getOrCreateYieldAggregator();
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

