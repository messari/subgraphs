import {
  Vault as VaultStore,
  Deposit as DepositTransaction,
} from "../../generated/schema";
import {
  BigInt,
  Address,
  ethereum,
  BigDecimal,
  log,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateYieldAggregator,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { ERC20 } from "../../generated/Booster/ERC20";
import { Pool as PoolContract } from "../../generated/Booster/Pool";

export function createDepositTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  depositFrom: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): DepositTransaction {
  const transactionId = "deposit-" + transaction.hash.toHexString();

  let depositTransaction = DepositTransaction.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new DepositTransaction(transactionId);

    depositTransaction.vault = vault.id;
    depositTransaction.protocol =
      constants.CONVEX_BOOSTER_ADDRESS.toHexString();

    depositTransaction.to = vault.id;
    depositTransaction.from = depositFrom.toHexString();

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
  vault: VaultStore,
  depositAmount: BigInt,
  depositFrom: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const poolAddress = Address.fromString(vault._pool);
  const poolContract = PoolContract.bind(poolAddress);
  const outputTokenContract = ERC20.bind(
    Address.fromString(vault.outputToken!)
  );

  const inputTokenAddress = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputTokenAddress, block);
  let inputTokenDecimals = utils.getTokenDecimals(inputTokenAddress);

  if (constants.MISSING_POOLS_MAP.get(inputTokenAddress)) {
    const poolTokenAddress =
      constants.MISSING_POOLS_MAP.get(inputTokenAddress)!;

    inputTokenPrice = getUsdPricePerToken(poolTokenAddress, block);
    inputTokenDecimals = utils.getTokenDecimals(poolTokenAddress);
  }

  const depositAmountUSD = depositAmount
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.outputTokenSupply = utils.readValue<BigInt>(
    outputTokenContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  vault.inputTokenBalance = vault.inputTokenBalance.plus(depositAmount);

  vault.totalValueLockedUSD = vault.inputTokenBalance
    .toBigDecimal()
    .div(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  vault.pricePerShare = utils
    .readValue<BigInt>(
      poolContract.try_get_virtual_price(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  vault.save();

  createDepositTransaction(
    vault,
    depositAmount,
    depositAmountUSD,
    depositFrom,
    transaction,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterDeposit(block);

  log.info(
    "[Deposit] vault: {}, depositAmount: {}, depositAmountUSD: {}, TxnHash: {}",
    [
      vault.id,
      depositAmount.toString(),
      depositAmountUSD.toString(),
      transaction.hash.toHexString(),
    ]
  );
}
