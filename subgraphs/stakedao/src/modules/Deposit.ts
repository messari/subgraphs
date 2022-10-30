import {
  Vault as VaultStore,
  Deposit as DepositTransaction,
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
  getOrCreateTokenFromString,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getPriceOfOutputTokens } from "./Price";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "./Revenue";
import { Vault as VaultContract } from "../../generated/Controller/Vault";

export function createDepositTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): DepositTransaction {
  let transactionId = "deposit-" + transaction.hash.toHexString();

  let depositTransaction = DepositTransaction.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new DepositTransaction(transactionId);

    depositTransaction.vault = vault.id;
    depositTransaction.protocol = constants.PROTOCOL_ID;

    depositTransaction.to = constants.NULL.TYPE_STRING;
    if (transaction.to) depositTransaction.to = transaction.to!.toHexString();
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

export function UpdateMetricsAfterDeposit(block: ethereum.Block): void {
  const protocol = getOrCreateYieldAggregator();

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyDepositCount += 1;
  metricsHourlySnapshot.hourlyDepositCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  protocol.save();
}

export function Deposit(
  vaultAddress: Address,
  depositAmount: BigInt | null,
  sharesMinted: BigInt | null,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  const vaultContract = VaultContract.bind(vaultAddress);

  let keeperFee = constants.BIGINT_ZERO;
  if (!depositAmount) {
    let keeperFeePercentage = utils.readValue(
      vaultContract.try_keeperFee(),
      constants.BIGINT_ZERO
    );
    depositAmount = sharesMinted!.div(
      constants.BIGINT_ONE.minus(
        keeperFeePercentage.div(constants.BIGINT_TEN_THOUSAND)
      )
    );

    keeperFee = depositAmount.minus(sharesMinted!);
  }

  if (vaultAddress.equals(constants.ANGLE_USDC_VAULT_ADDRESS)) {
    sharesMinted = utils
      .readValue<BigInt>(vaultContract.try_totalSupply(), constants.BIGINT_ZERO)
      .minus(vault.outputTokenSupply!);
  }

  if (!sharesMinted) {
    // calculate shares minted as per the deposit function in vault contract address
    sharesMinted = vault.outputTokenSupply!.isZero()
      ? depositAmount
      : depositAmount
          .times(vault.outputTokenSupply!)
          .div(vault.inputTokenBalance);
  }

  let inputToken = getOrCreateTokenFromString(vault.inputToken, block);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken.decimals as u8
  ).toBigDecimal();

  let depositAmountUSD = depositAmount
    .divDecimal(inputTokenDecimals)
    .times(inputToken.lastPriceUSD!);

  vault.inputTokenBalance = utils.getVaultBalance(vaultAddress);

  utils.readValue(vaultContract.try_balance(), constants.BIGINT_ZERO);
  vault.outputTokenSupply = utils.readValue(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .divDecimal(inputTokenDecimals)
    .times(inputToken.lastPriceUSD!);

  vault.outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    Address.fromString(vault.inputToken),
    inputTokenDecimals
  );
  vault.pricePerShare = utils.getPricePerFullShare(vaultAddress);

  vault.save();

  const protocolSideWithdrawalAmountUSD = keeperFee
    .divDecimal(inputTokenDecimals)
    .times(inputToken.lastPriceUSD!);

  updateRevenueSnapshots(
    vault,
    constants.BIGDECIMAL_ZERO,
    protocolSideWithdrawalAmountUSD,
    block
  );

  createDepositTransaction(
    vault,
    depositAmount,
    depositAmountUSD,
    transaction,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterDeposit(block);

  log.warning(
    "[Deposit] TxHash: {}, vaultAddress: {}, _sharesMinted: {}, _depositAmount: {}",
    [
      transaction.hash.toHexString(),
      vault.id,
      sharesMinted.toString(),
      depositAmount.toString(),
    ]
  );
}
