import {
  Address,
  ethereum,
  BigInt,
  BigDecimal,
} from "@graphprotocol/graph-ts";
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
import { Withdraw } from "../../generated/schema";
import { convertBigIntToBigDecimal } from "../helpers/converters";
import { getUsdPricePerToken } from "../Prices";
import { updateProtocolTotalValueLockedUSD } from "../common/utils";

export function _Withdraw(
  contractAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  vault: Vault,
  withdrawAmount: BigInt
): void {
  const inputTokenAddress = Address.fromString(vault.inputToken);
  utils.updateTokenPrice(inputTokenAddress, block.number);

  const vaultAddress = Address.fromString(vault.id);
  const strategyContract = YakStrategyV2.bind(contractAddress);

  let inputToken = Token.load(vault.inputToken);
  let inputTokenPrice = inputToken!.lastPriceUSD;
  let inputTokenDecimals = BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  if (strategyContract.try_totalSupply().reverted) {
    vault.outputTokenSupply = ZERO_BIGINT;
  } else {
    vault.outputTokenSupply = strategyContract.totalSupply();
  }

  vault.inputTokenBalance = strategyContract.totalDeposits();

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .divDecimal(inputTokenDecimals)
    .times(inputTokenPrice!);

  if (strategyContract.try_getDepositTokensForShares(DEFUALT_AMOUNT).reverted) {
    vault.pricePerShare = ZERO_BIGDECIMAL;
  } else {
    vault.pricePerShare = convertBigIntToBigDecimal(
      strategyContract.getDepositTokensForShares(DEFUALT_AMOUNT),
      18
    );
  }

  vault.outputTokenPriceUSD = getUsdPricePerToken(Address.fromString(vault.outputToken!)).usdPrice;
  vault.save();

  const withdrawAmountUSD = withdrawAmount
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice!);

  createWithdrawTransaction(
    contractAddress,
    vaultAddress,
    transaction,
    block,
    vault.inputToken,
    withdrawAmount,
    withdrawAmountUSD
  );

  updateProtocolTotalValueLockedUSD();
  updateUsageMetricsAfterWithdrawNew(vault, block);
}

export function updateUsageMetricsAfterWithdrawNew(vault: Vault, block: ethereum.Block): void {
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyWithdrawCount += 1;
  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();
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
