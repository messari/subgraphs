import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
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
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import { updateRevenueSnapshots } from "./Revenue";
import * as constants from "../common/constants";
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
  const inputTokenPrice = getUsdPricePerToken(inputTokenAddress);

  const amountUSD = utils
    .bigIntToBigDecimal(amount, vault._decimals)
    .times(inputTokenPrice.usdPrice);

  vault.outputTokenSupply = utils.getOutputTokenSupply(vaultAddress, block);

  const totalValue = utils.readValue<BigInt>(
    vaultContract.try_totalBalance(),
    constants.BIGINT_ZERO
  );

  vault.inputTokenBalance = totalValue;

  if (totalValue.notEqual(constants.BIGINT_ZERO)) {
    vault.totalValueLockedUSD = utils
      .bigIntToBigDecimal(vault.inputTokenBalance, vault._decimals)
      .times(inputTokenPrice.usdPrice);
  }

  vault.pricePerShare = utils.getVaultPricePerShare(vaultAddress);
  vault.outputTokenPriceUSD = utils.getOutputTokenPriceUSD(vaultAddress, block);

  vault.save();

  if (type == constants.TransactionType.DEPOSIT) {
    createDepositTransaction(vault, amount, amountUSD, transaction, block);
  }

  if (type == constants.TransactionType.WITHDRAW) {
    createWithdrawTransaction(vault, amount, amountUSD, transaction, block);
    if (feeAmount.notEqual(constants.BIGINT_ZERO)) {
      const withdrawalFeeUSD = utils
        .bigIntToBigDecimal(feeAmount, vault._decimals)
        .times(inputTokenPrice.usdPrice);
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

  log.info(
    "[Transaction] vault: {}, fee: {},  amount: {}, amountUSD: {}, outputTokenPriceUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      feeAmount.toString(),
      amount.toString(),
      amountUSD.toString(),
      vault.outputTokenPriceUSD!.toString(),
      transaction.hash.toHexString(),
    ]
  );
}
