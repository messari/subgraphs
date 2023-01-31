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
  getOrCreateToken,
  getOrCreateVault,
  getOrCreateYieldAggregator,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initalizers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "./Revenue";
import { getUsdPricePerToken } from "../prices/index";
import { RibbonThetaVaultWithSwap as VaultContract } from "../../generated/ETHCallV2/RibbonThetaVaultWithSwap";
export function createWithdrawTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): WithdrawTransaction {
  const withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();

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

export function Withdraw(
  vaultAddress: Address,
  withdrawAmount: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  withdrawFeeAmount: BigInt = constants.BIGINT_ZERO
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  const vaultContract = VaultContract.bind(vaultAddress);

  const inputTokenAddress = Address.fromString(vault.inputToken);
  const inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  const vaultDecimals = constants.BIGINT_TEN.pow(vault._decimals as u8);

  const withdrawAmountUSD = withdrawAmount
    .toBigDecimal()
    .div(vaultDecimals.toBigDecimal())
    .times(inputTokenPrice.usdPrice);

  vault.outputTokenSupply = utils.getOutputTokenSupply(vaultAddress, block);

  const totalValue = utils.readValue<BigInt>(
    vaultContract.try_totalBalance(),
    constants.BIGINT_ZERO
  );

  vault.inputTokenBalance = totalValue;

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .toBigDecimal()
    .div(vaultDecimals.toBigDecimal())
    .times(inputTokenPrice.usdPrice);

  if (vault.outputToken) {
    const outputToken = getOrCreateToken(
      Address.fromString(vault.outputToken!),
      block,
      vaultAddress,
      true
    );
    vault.outputTokenPriceUSD = outputToken.lastPriceUSD;
  }
  // Protocol Side Revenue USD

  vault.save();

  createWithdrawTransaction(
    vault,
    withdrawAmount,
    withdrawAmountUSD,
    transaction,
    block
  );

  if (withdrawFeeAmount.notEqual(constants.BIGINT_ZERO)) {
    const withdrawalFeeUSD = withdrawFeeAmount
      .toBigDecimal()
      .div(vaultDecimals.toBigDecimal())
      .times(inputTokenPrice.usdPrice);
    updateRevenueSnapshots(
      vault,
      constants.BIGDECIMAL_ZERO,
      withdrawalFeeUSD,
      block
    );
  }
  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterWithdraw(block);

  log.info(
    "[Withdraw] vault: {}, withdrawalFee: {},  withdrawAmount: {}, withdrawAmountUSD: {}, outputTokenPriceUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      withdrawFeeAmount.toString(),
      withdrawAmount.toString(),
      withdrawAmountUSD.toString(),
      vault.outputTokenPriceUSD!.toString(),
      transaction.hash.toHexString(),
    ]
  );
}
