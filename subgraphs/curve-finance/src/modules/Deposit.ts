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
  outputTokenAmount: BigInt,
  amountUSD: BigDecimal,
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): DepositTransaction {
  let transactionId = "deposit-" + transaction.hash.toHexString();

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
    depositTransaction.outputTokenAmount = outputTokenAmount;

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
  liquidityPoolAddress: Address,
  depositAmounts: BigInt[],
  totalSupply: BigInt,
  fees: BigInt[],
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(liquidityPoolAddress, block);

  let inputTokens: string[] = [];
  let inputTokenAmounts: BigInt[] = [];
  let outputTokenAmount = constants.BIGINT_ZERO;
  let inputTokenBalances = pool.inputTokenBalances;
  let depositAmountUSD = constants.BIGDECIMAL_ZERO;

  for (let idx = 0; idx < depositAmounts.length; idx++) {
    let inputToken = utils.getOrCreateTokenFromString(pool.inputTokens[idx]);
    let inputTokenIndex = pool.inputTokens.indexOf(inputToken.id);
    // TODO: Price USD
    let inputTokenPrice = constants.BIGDECIMAL_ZERO;
    
    inputTokenBalances[inputTokenIndex] = inputTokenBalances[inputTokenIndex].plus(depositAmounts[idx]);
    
    inputTokenAmounts.push(depositAmounts[idx]);
    inputTokens.push(inputToken.id);
    
    // TODO: Price USD
    depositAmountUSD = depositAmountUSD.plus(constants.BIGDECIMAL_ZERO);
  }

  pool.outputTokenSupply = totalSupply;
  pool.save();

  createDepositTransaction(
    pool,
    inputTokens,
    inputTokenAmounts,
    outputTokenAmount,
    depositAmountUSD,
    provider,
    transaction,
    block
  );

  // TODO: Liquidity Fees

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterDeposit(block);

  log.info(
    "[AddLiquidity] LiquidityPool: {}, sharesMinted: {}, depositAmount: {}, depositAmountUSD: {}, TxnHash: {}",
    []
  );
}
