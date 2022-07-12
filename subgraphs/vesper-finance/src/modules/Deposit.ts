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
import { getPriceOfOutputTokens, getPricePerShare } from "./Prices";
import { Pool as VaultContract } from "../../generated/templates/PoolAccountant/Pool";

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
  sharesMinted: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const vault = getOrCreateVault(vaultAddress, block);
  let vaultContract = VaultContract.bind(vaultAddress);

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(inputToken!.decimals as u8);

  let depositAmountUSD = depositAmount
    .toBigDecimal()
    .div(inputTokenDecimals.toBigDecimal())
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

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

  let pricePerShare = getPricePerShare(vaultAddress);
  vault.pricePerShare = pricePerShare.toBigDecimal();
  vault.outputTokenPriceUSD = getPriceOfOutputTokens(vaultAddress);

  vault.save();

  createDepositTransaction(
    vault,
    depositAmount,
    depositAmountUSD,
    transaction,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterDeposit(block);

  log.info(
    "[Deposit] vault: {}, sharesMinted: {}, depositAmount: {}, depositAmountUSD: {}, TxnHash: {}",
    [
      vaultAddress.toHexString(),
      sharesMinted.toString(),
      depositAmount.toString(),
      depositAmountUSD.toString(),
      transaction.hash.toHexString(),
    ]
  );
}
