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
  getOrCreateYieldAggregator,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializer";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { ERC20 } from "../../generated/Booster/ERC20";
import { Pool as PoolContract } from "../../generated/Booster/Pool";

export function createDepositTransaction(
  to: Address,
  vaultId: string,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  assetId: string,
  amount: BigInt,
  amountUSD: BigDecimal
): DepositTransaction {
  let transactionId = "deposit-" + transaction.hash.toHexString();

  let depositTransaction = DepositTransaction.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new DepositTransaction(transactionId);

    depositTransaction.vault = vaultId;
    depositTransaction.protocol = constants.CONVEX_BOOSTER_ADDRESS.toHexString();

    depositTransaction.to = to.toHexString();
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

export function deposit(
  to: Address,
  vault: VaultStore,
  depositAmount: BigInt,
  block: ethereum.Block,
  transaction: ethereum.Transaction
): void {
  const protocol = getOrCreateYieldAggregator();

  let inputToken = Token.load(vault.inputToken);
  let inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
  let inputTokenDecimals = constants.BIGINT_TEN.pow(
    inputToken!.decimals as u8
  ).toBigDecimal();

  let depositAmountUSD = depositAmount
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.inputTokenBalance = vault.inputTokenBalance.plus(depositAmount);
  vault.totalValueLockedUSD = vault.inputTokenBalance
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  const poolAddress = Address.fromString(vault._pool);
  const poolContract = PoolContract.bind(poolAddress);
  const outputTokenContract = ERC20.bind(Address.fromString(vault.outputToken!));

  vault.outputTokenSupply = utils.readValue<BigInt>(
    outputTokenContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );
  vault.pricePerShare = utils
    .readValue<BigInt>(
      poolContract.try_get_virtual_price(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  createDepositTransaction(
    to,
    vault.id,
    transaction,
    block,
    vault.inputToken,
    depositAmount,
    depositAmountUSD
  );

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyDepositCount += 1;
  metricsHourlySnapshot.hourlyDepositCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();
  protocol.save();
  vault.save();

  utils.updateProtocolTotalValueLockedUSD();
}
