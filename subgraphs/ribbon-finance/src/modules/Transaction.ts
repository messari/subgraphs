import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import {
  Vault as VaultStore,
  Deposit as DepositTransaction,
  Withdraw as WithdrawTransaction,
} from "../../generated/schema";
import {
  getOrCreateVault,
  getOrCreateYieldAggregator,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
  getOrCreateToken,
  getOrCreateFee,
} from "../common/initializers";
import * as utils from "../common/utils";
import { updateRevenueSnapshots } from "./Revenue";
import * as constants from "../common/constants";
import { RibbonThetaVaultWithSwap as VaultContract } from "../../generated/templates/LiquidityGauge/RibbonThetaVaultWithSwap";

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

export function createDepositTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): DepositTransaction {
  const transactionId = "deposit-" + transaction.hash.toHexString();

  let depositTransaction = DepositTransaction.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new DepositTransaction(transactionId);

    depositTransaction.vault = vault.id;
    depositTransaction.protocol = constants.PROTOCOL_ID;

    depositTransaction.to = vault.id;
    depositTransaction.from = transaction.from.toHexString();

    depositTransaction.hash = transaction.hash.toHexString();
    depositTransaction.logIndex = transaction.index.toI32();

    depositTransaction.asset = vault.inputToken;
    depositTransaction.amount = amount;
    depositTransaction.amountUSD = amountUSD;

    depositTransaction.timestamp = block.timestamp;
    depositTransaction.blockNumber = block.number;

    depositTransaction.save();
  }

  return depositTransaction;
}

export function UpdateMetricsAfterTransaction(
  block: ethereum.Block,
  type: string
): void {
  const protocol = getOrCreateYieldAggregator();

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);
  if (type == constants.TransactionType.WITHDRAW) {
    metricsDailySnapshot.dailyWithdrawCount += 1;
    metricsHourlySnapshot.hourlyWithdrawCount += 1;
  }
  if (type == constants.TransactionType.DEPOSIT) {
    metricsDailySnapshot.dailyDepositCount += 1;
    metricsHourlySnapshot.hourlyDepositCount += 1;
  }
  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  protocol.save();
}

export function Transaction(
  vaultAddress: Address,
  amount: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  type: string,
  feeAmount: BigInt = constants.BIGINT_ZERO
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  const vaultContract = VaultContract.bind(vaultAddress);

  const inputTokenAddress = Address.fromString(vault.inputToken);
  const inputToken = getOrCreateToken(inputTokenAddress, block);

  vault.outputTokenSupply = utils.getOutputTokenSupply(vaultAddress, block);

  const totalValue = utils.readValue<BigInt>(
    vaultContract.try_totalBalance(),
    constants.BIGINT_ZERO
  );

  vault.inputTokenBalance = totalValue;

  if (totalValue.notEqual(constants.BIGINT_ZERO)) {
    vault.totalValueLockedUSD = utils
      .bigIntToBigDecimal(vault.inputTokenBalance, vault._decimals)
      .times(inputToken.lastPriceUSD!);
  }

  vault.pricePerShare = utils.getVaultPricePerShare(vaultAddress);
  vault.outputTokenPriceUSD = utils.getOutputTokenPriceUSD(vaultAddress, block);

  vault.save();
  if (type == constants.TransactionType.REFRESH) {
    return;
  }
  const amountUSD = utils
    .bigIntToBigDecimal(amount, vault._decimals)
    .times(inputToken.lastPriceUSD!);

  if (type == constants.TransactionType.DEPOSIT) {
    createDepositTransaction(vault, amount, amountUSD, transaction, block);
  }

  if (type == constants.TransactionType.WITHDRAW) {
    createWithdrawTransaction(vault, amount, amountUSD, transaction, block);
    if (feeAmount.notEqual(constants.BIGINT_ZERO)) {
      const withdrawalFeeUSD = utils
        .bigIntToBigDecimal(feeAmount, vault._decimals)
        .times(inputToken.lastPriceUSD!);
      updateRevenueSnapshots(
        vault,
        constants.BIGDECIMAL_ZERO,
        withdrawalFeeUSD,
        block
      );
    }
  }

  UpdateMetricsAfterTransaction(block, type);
  utils.updateProtocolTotalValueLockedUSD();
}
export function updateWithdrawlFees(
  vaultAddress: Address,
  feeAmount: BigInt,
  withdrawAmount: BigInt
): void {
  const withdrawFeePercentage = feeAmount
    .divDecimal(withdrawAmount.toBigDecimal())
    .times(constants.BIGDECIMAL_HUNDRED);
  const withdrawlFeeId =
    utils.enumToPrefix(constants.VaultFeeType.WITHDRAWAL_FEE) +
    vaultAddress.toHexString();
  const withdrawlFeeStore = getOrCreateFee(
    withdrawlFeeId,
    constants.VaultFeeType.WITHDRAWAL_FEE,
    withdrawFeePercentage
  );
  withdrawlFeeStore.save();
}
export function updateVaultFees(
  vaultAddress: Address,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  const vaultContract = VaultContract.bind(vaultAddress);
  const performanceFee = utils.bigIntToBigDecimal(
    utils.readValue(vaultContract.try_performanceFee(), constants.BIGINT_ZERO),
    6
  );
  const managementFee = utils.bigIntToBigDecimal(
    utils.readValue(vaultContract.try_managementFee(), constants.BIGINT_ZERO),
    vault._decimals
  );

  const performanceFeeId =
    utils.enumToPrefix(constants.VaultFeeType.WITHDRAWAL_FEE) +
    vaultAddress.toHexString();
  const managementFeeId =
    utils.enumToPrefix(constants.VaultFeeType.WITHDRAWAL_FEE) +
    vaultAddress.toHexString();

  const performanceFeeStore = getOrCreateFee(
    performanceFeeId,
    constants.VaultFeeType.PERFORMANCE_FEE
  );
  const managementFeeStore = getOrCreateFee(
    managementFeeId,
    constants.VaultFeeType.MANAGEMENT_FEE
  );

  performanceFeeStore.feePercentage = performanceFee;
  managementFeeStore.feePercentage = managementFee;
  performanceFeeStore.save();
  managementFeeStore.save();
}
