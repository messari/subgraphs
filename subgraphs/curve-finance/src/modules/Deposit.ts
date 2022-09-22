import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  Deposit as DepositTransaction,
  LiquidityPool as LiquidityPoolStore,
} from "../../generated/schema";
import {
  getOrCreateLiquidityPool,
  getOrCreateDexAmmProtocol,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";

export function createDepositTransaction(
  liquidityPool: LiquidityPoolStore,
  inputTokens: string[],
  inputTokenAmounts: BigInt[],
  outputTokenMintedAmount: BigInt,
  amountUSD: BigDecimal,
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): DepositTransaction {
  let transactionId = "deposit-"
    .concat(transaction.hash.toHexString())
    .concat("-")
    .concat(transaction.index.toString());

  let depositTransaction = DepositTransaction.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new DepositTransaction(transactionId);

    depositTransaction.pool = liquidityPool.id;
    depositTransaction.protocol = getOrCreateDexAmmProtocol().id;

    depositTransaction.to = liquidityPool.id;
    depositTransaction.from = provider.toHexString();

    depositTransaction.hash = transaction.hash.toHexString();
    depositTransaction.logIndex = transaction.index.toI32();

    depositTransaction.inputTokens = inputTokens;
    depositTransaction.inputTokenAmounts = inputTokenAmounts;

    depositTransaction.outputToken = liquidityPool.outputToken;
    depositTransaction.outputTokenAmount = outputTokenMintedAmount;

    depositTransaction.amountUSD = amountUSD;

    depositTransaction.timestamp = block.timestamp;
    depositTransaction.blockNumber = block.number;

    depositTransaction.save();
  }

  return depositTransaction;
}

export function UpdateMetricsAfterDeposit(block: ethereum.Block): void {
  const protocol = getOrCreateDexAmmProtocol();

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
  poolAddress: Address,
  depositedCoinAmounts: BigInt[],
  totalSupplyAfterDeposit: BigInt,
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  let inputTokens: string[] = [];
  let inputTokenAmounts: BigInt[] = [];
  let depositAmountUSD = constants.BIGDECIMAL_ZERO;
  let outputTokenMintedAmount = totalSupplyAfterDeposit.minus(
    pool.outputTokenSupply!
  );

  for (let idx = 0; idx < depositedCoinAmounts.length; idx++) {
    let inputToken = utils.getOrCreateTokenFromString(
      pool.inputTokens[idx],
      block
    );

    inputTokenAmounts.push(depositedCoinAmounts[idx]);
    inputTokens.push(inputToken.id);

    depositAmountUSD = depositAmountUSD.plus(
      depositedCoinAmounts[idx]
        .divDecimal(
          constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
        )
        .times(inputToken.lastPriceUSD!)
    );
  }

  pool.inputTokenBalances = utils.getPoolBalances(
    poolAddress,
    pool.inputTokens
  );
  pool.totalValueLockedUSD = utils.getPoolTVL(
    utils.getOrCreateTokenFromString(pool.outputToken!, block),
    totalSupplyAfterDeposit
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(
    pool.inputTokens,
    pool.inputTokenBalances,
    pool.totalValueLockedUSD,
    block
  );
  pool.outputTokenSupply = totalSupplyAfterDeposit;
  pool.outputTokenPriceUSD = utils.getOrCreateTokenFromString(
    pool.outputToken!,
    block
  ).lastPriceUSD!;

  pool.save();

  createDepositTransaction(
    pool,
    inputTokens,
    inputTokenAmounts,
    outputTokenMintedAmount,
    depositAmountUSD,
    provider,
    transaction,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterDeposit(block);

  log.info(
    "[AddLiquidity] LiquidityPool: {}, sharesMinted: {}, depositAmount: [{}], depositAmountUSD: {}, TxnHash: {}",
    [
      poolAddress.toHexString(),
      outputTokenMintedAmount.toString(),
      depositedCoinAmounts.join(", "),
      depositAmountUSD.truncate(1).toString(),
      transaction.hash.toHexString(),
    ]
  );
}
