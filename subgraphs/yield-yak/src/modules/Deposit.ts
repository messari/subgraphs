import { Address, ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Token, Vault } from "../../generated/schema";
import {
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateYieldAggregator,
} from "../common/initializers";
import { YakStrategyV2 } from "../../generated/YakStrategyV2/YakStrategyV2";
import {
  DEFUALT_AMOUNT,
  ZERO_BIGINT,
  ZERO_BIGDECIMAL,
  BIGINT_TEN,
} from "../helpers/constants";
import * as utils from "../common/utils";
import { Deposit } from "../../generated/schema";
import { convertBigIntToBigDecimal } from "../helpers/converters";
import { getUsdPrice, getUsdPricePerToken } from "../Prices";
import { getPriceOfOutputTokens } from "./Price";
import { exponentToBigDecimal } from "../common/utils";

export function _Deposit(
  contractAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  vault: Vault,
  depositAmount: BigInt
): void {
  const inputTokenAddress = Address.fromString(vault.inputToken);
  utils.updateTokenPrice(inputTokenAddress, block.number);

  const vaultAddress = Address.fromString(vault.id);
  const strategyContract = YakStrategyV2.bind(contractAddress);

  let inputToken = Token.load(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  if (strategyContract.try_totalSupply().reverted) {
    vault.outputTokenSupply = ZERO_BIGINT;
  } else {
    vault.outputTokenSupply = strategyContract.totalSupply();
  }

  if (strategyContract.try_totalDeposits().reverted) {
    // vault.inputTokenBalance = vault.inputTokenBalance.plus(depositAmount);
  } else {
    // vault.inputTokenBalance = vault.inputTokenBalance.plus(depositAmount);
    vault.inputTokenBalance = strategyContract.totalDeposits();

    

    // vault.totalValueLockedUSD = inputTokenPrice.usdPrice.times(
    //   vault.inputTokenBalance
    //     .toBigDecimal()
    //     .div(exponentToBigDecimal(inputToken!.decimals))
    //     .div(inputTokenPrice.decimalsBaseTen)
    // );
  }

  vault.totalValueLockedUSD = vault.inputTokenBalance
      .toBigDecimal()
      .div(inputTokenDecimals)
      .times(inputTokenPrice.usdPrice)
      .div(inputTokenPrice.decimalsBaseTen);
      
  if (strategyContract.try_getDepositTokensForShares(DEFUALT_AMOUNT).reverted) {
    vault.pricePerShare = ZERO_BIGDECIMAL;
  } else {
    vault.pricePerShare = convertBigIntToBigDecimal(
      strategyContract.getDepositTokensForShares(DEFUALT_AMOUNT),
      18
    );
  }

  // let depositAmountUSD = getUsdPrice(inputTokenAddress, depositAmount.toBigDecimal()).div(inputTokenPrice.decimalsBaseTen)
  let depositAmountUSD = depositAmount
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    inputTokenAddress,
    inputTokenDecimals
  );

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
