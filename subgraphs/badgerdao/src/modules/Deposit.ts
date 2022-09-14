import {
  Token,
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
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { getPriceOfOutputTokens } from "./Prices";
import { Vault as VaultContract } from "../../generated/templates/Strategy/Vault";

export function createDepositTransaction(
  vault: VaultStore,
  recipientAddress: Address,
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

    depositTransaction.to = vault.id;
    depositTransaction.from = recipientAddress.toHexString();

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
  depositAmount: BigInt,
  recipientAddress: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  const vaultContract = VaultContract.bind(vaultAddress);

  // calculate deposit amount for depositAll event
  if (depositAmount.equals(constants.BIGINT_NEGATIVE_ONE)) {
    let totalSupply = utils.readValue<BigInt>(
      vaultContract.try_totalSupply(),
      constants.BIGINT_ZERO
    );

    depositAmount = totalSupply.minus(vault.outputTokenSupply!);
  }

  // calculate shares minted as per the deposit function in vault contract address
  let sharesMinted = vault.outputTokenSupply!.isZero()
    ? depositAmount
    : depositAmount
        .times(vault.outputTokenSupply!)
        .div(vault.inputTokenBalance);

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken!.decimals as u8
  )

  let depositAmountUSD = depositAmount
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal())
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.outputTokenSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  vault.inputTokenBalance = utils.readValue<BigInt>(
    vaultContract.try_balance(),
    constants.BIGINT_ZERO
  );

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal())
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    inputTokenDecimals
  );

  vault.save();

  createDepositTransaction(
    vault,
    recipientAddress,
    depositAmount,
    depositAmountUSD,
    transaction,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterDeposit(block);

  log.info(
    "[Deposit] TxHash: {}, vaultAddress: {}, _sharesMinted: {}, _depositAmount: {}",
    [
      transaction.hash.toHexString(),
      vault.id,
      sharesMinted.toString(),
      depositAmount.toString(),
    ]
  );
}
