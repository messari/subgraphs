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
  getOrCreateToken,
  getOrCreateLiquidityPool,
  getOrCreateDexAmmProtocol,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";

export function createDepositTransaction(
  liquidityPool: LiquidityPoolStore,
  inputTokenAmounts: BigInt[],
  outputTokenMintedAmount: BigInt,
  amountUSD: BigDecimal,
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): DepositTransaction {
  const transactionId = "deposit-"
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

    depositTransaction.inputTokens = liquidityPool.inputTokens;
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
  inputTokens: Address[],
  depositedCoinAmounts: BigInt[],
  fees: BigInt[],
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  const inputTokenAmounts: BigInt[] = [];
  const inputTokenBalances = pool.inputTokenBalances;
  let depositAmountUSD = constants.BIGDECIMAL_ZERO;

  for (let i = 0; i < pool.inputTokens.length; i++) {
    const tokenIdx = inputTokens.indexOf(
      Address.fromString(pool.inputTokens[i])
    );
    if (tokenIdx == -1) continue;

    const inputToken = getOrCreateToken(inputTokens[tokenIdx], block);

    inputTokenBalances[i] = inputTokenBalances[i].plus(
      depositedCoinAmounts[tokenIdx].minus(fees[tokenIdx])
    );
    inputTokenAmounts.push(depositedCoinAmounts[tokenIdx]);

    depositAmountUSD = depositAmountUSD.plus(
      depositedCoinAmounts[tokenIdx]
        .divDecimal(utils.exponentToBigDecimal(inputToken.decimals))
        .times(inputToken.lastPriceUSD!)
    );
  }

  const totalSupplyAfterDeposit = utils.getOutputTokenSupply(
    poolAddress,
    pool.outputTokenSupply!
  );
  const outputTokenMintedAmount = totalSupplyAfterDeposit.minus(
    pool.outputTokenSupply!
  );

  pool.totalValueLockedUSD = utils.getPoolTVL(
    poolAddress,
    pool.inputTokens,
    pool.inputTokenBalances,
    block
  );

  pool.inputTokenWeights = utils.getPoolTokenWeights(
    poolAddress,
    pool.inputTokens
  );

  pool.outputTokenPriceUSD = utils.getOutputTokenPriceUSD(poolAddress, block);
  pool.outputTokenSupply = totalSupplyAfterDeposit;
  pool.inputTokenBalances = inputTokenBalances;
  pool.save();

  createDepositTransaction(
    pool,
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
    "[AddLiquidity] LiquidityPool: {}, sharesMinted: {}, depositAmount: [{}], inputTokenBalances: [{}], depositAmountUSD: {}, fees: {}, TxnHash: {}",
    [
      poolAddress.toHexString(),
      outputTokenMintedAmount.toString(),
      depositedCoinAmounts.join(", "),
      inputTokenBalances.join(", "),
      depositAmountUSD.truncate(1).toString(),
      fees.join(", "),
      transaction.hash.toHexString(),
    ]
  );
}
