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
  getOrCreateVault,
  getOrCreateYieldAggregator,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getPriceOfOutputTokens } from "./Prices";
import { updateRevenueSnapshots } from "./Revenue";
import { getUsdPricePerToken } from "../prices/index";
import { Pool as VaultContract } from "../../generated/templates/PoolAccountant/Pool";

export function createWithdrawTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): WithdrawTransaction {
  let withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();

  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

    withdrawTransaction.vault = vault.id;
    withdrawTransaction.protocol = constants.PROTOCOL_ID;

    withdrawTransaction.to = transaction.to!.toHexString();
    withdrawTransaction.from = transaction.from.toHexString();

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

export function getWithdrawFeePercentage(vaultContract: VaultContract): BigInt {
  let withdrawFeePercentage = utils.readValue<BigInt>(
    vaultContract.try_withdrawFee(),
    constants.BIGINT_ZERO
  );

  if (withdrawFeePercentage.gt(constants.BIGINT_TEN.pow(14 as u8))) {
    // v1 pools withdraw fee is stored in pow(10, 16) format

    return withdrawFeePercentage.div(constants.BIGINT_TEN.pow(14 as u8));
  }

  return withdrawFeePercentage;
}

export function Withdraw(
  vaultAddress: Address,
  withdrawAmount: BigInt,
  sharesBurnt: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  let vaultContract = VaultContract.bind(vaultAddress);

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(inputToken!.decimals as u8);

  let withdrawAmountUSD = withdrawAmount
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal())
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  let withdrawFeePercentage = getWithdrawFeePercentage(vaultContract);

  let withdrawalFee = sharesBurnt
    .times(withdrawFeePercentage)
    .div(constants.MAX_BPS);

  vault.outputTokenSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  let totalValue = utils.readValue<BigInt>(
    vaultContract.try_totalValue(),
    constants.BIGINT_ZERO
  );

  if (totalValue.equals(constants.BIGINT_ZERO)) {
    let vaultTokenLocked = utils.readValue<BigInt>(
      vaultContract.try_tokenLocked(),
      constants.BIGINT_ZERO
    );

    let tokenInVault = utils.readValue<BigInt>(
      vaultContract.try_tokensHere(),
      constants.BIGINT_ZERO
    );

    totalValue = vaultTokenLocked.plus(tokenInVault);
  }
  vault.inputTokenBalance = totalValue;

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal())
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.outputTokenPriceUSD = getPriceOfOutputTokens(vaultAddress);

  let outputTokenDecimals = utils.getTokenDecimals(vaultAddress);

  // Protocol Side Revenue USD
  let withdrawalFeeUSD = withdrawalFee
    .toBigDecimal()
    .div(outputTokenDecimals)
    .times(vault.outputTokenPriceUSD!);

  vault.save();

  createWithdrawTransaction(
    vault,
    withdrawAmount,
    withdrawAmountUSD,
    transaction,
    block
  );

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    withdrawalFeeUSD,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterWithdraw(block);

  log.info(
    "[Withdraw] vault: {}, sharesBurnt: {}, withdrawalFee: {}, withdrawalFeeUSD: {}, withdrawAmount: {}, withdrawAmountUSD: {}, outputTokenPriceUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      sharesBurnt.toString(),
      withdrawalFee.toString(),
      withdrawalFeeUSD.toString(),
      withdrawAmount.toString(),
      withdrawAmountUSD.toString(),
      vault.outputTokenPriceUSD!.toString(),
      transaction.hash.toHexString(),
    ]
  );
}
