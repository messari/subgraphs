import {
  Withdraw as WithdrawTransaction,
  LiquidityPool as LiquidityPoolStore,
} from "../../generated/schema";
import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateToken,
  getOrCreateLiquidityPool,
  getOrCreateDexAmmProtocol,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "./Revenue";
import { WeightedPool as WeightedPoolContract } from "../../generated/templates/WeightedPool/WeightedPool";

export function createWithdrawTransaction(
  pool: LiquidityPoolStore,
  inputTokenAmounts: BigInt[],
  outputTokenBurntAmount: BigInt,
  amountUSD: BigDecimal,
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): WithdrawTransaction {
  let withdrawTransactionId = "withdraw-"
    .concat(transaction.hash.toHexString())
    .concat("-")
    .concat(transaction.index.toString());

  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

    withdrawTransaction.pool = pool.id;
    withdrawTransaction.protocol = constants.VAULT_ADDRESS.toHexString();

    withdrawTransaction.to = transaction.to!.toHexString();
    withdrawTransaction.from = provider.toHexString();

    withdrawTransaction.hash = transaction.hash.toHexString();
    withdrawTransaction.logIndex = transaction.index.toI32();

    withdrawTransaction.inputTokens = pool.inputTokens;
    withdrawTransaction.inputTokenAmounts = inputTokenAmounts;

    withdrawTransaction.outputToken = pool.outputToken;
    withdrawTransaction.outputTokenAmount = outputTokenBurntAmount;

    withdrawTransaction.amountUSD = amountUSD;

    withdrawTransaction.timestamp = block.timestamp;
    withdrawTransaction.blockNumber = block.number;

    withdrawTransaction.save();
  }

  return withdrawTransaction;
}

export function UpdateMetricsAfterWithdraw(block: ethereum.Block): void {
  const protocol = getOrCreateDexAmmProtocol();

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailyWithdrawCount += 1;
  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  protocol.save();
}

export function getRemoveLiquidityFeesUSD(
  poolAddress: Address,
  inputTokens: Address[],
  fees: BigInt[],
  block: ethereum.Block
): BigDecimal {
  if (fees.length == 0) {
    return constants.BIGDECIMAL_ZERO;
  }

  let totalFeesUSD = constants.BIGDECIMAL_ZERO;
  for (let idx = 0; idx < inputTokens.length; idx++) {
    if (fees.at(idx) == constants.BIGINT_ZERO) continue;
    if (inputTokens.at(idx).equals(poolAddress)) continue;

    let inputToken = getOrCreateToken(inputTokens.at(idx), block.number);

    let inputTokenFee = fees
      .at(idx)
      .divDecimal(
        constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
      )
      .times(inputToken.lastPriceUSD!);

    totalFeesUSD = totalFeesUSD.plus(inputTokenFee);
  }

  return totalFeesUSD;
}

export function Withdraw(
  poolAddress: Address,
  inputTokens: Address[],
  withdrawnTokenAmounts: BigInt[],
  fees: BigInt[],
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  // deltas in a remove liquidity event are negative
  withdrawnTokenAmounts = withdrawnTokenAmounts.map<BigInt>((x) =>
    x.times(constants.BIGINT_NEGATIVE_ONE)
  );

  let inputTokenAmounts: BigInt[] = [];
  let inputTokenBalances = pool.inputTokenBalances;
  let withdrawAmountUSD = constants.BIGDECIMAL_ZERO;

  for (let idx = 0; idx < withdrawnTokenAmounts.length; idx++) {
    if (inputTokens.at(idx).equals(poolAddress)) continue;

    let inputToken = getOrCreateToken(inputTokens.at(idx), block.number);
    let inputTokenIndex = pool.inputTokens.indexOf(inputToken.id);

    inputTokenBalances[inputTokenIndex] = inputTokenBalances[
      inputTokenIndex
    ].minus(withdrawnTokenAmounts[idx].minus(fees[idx]));

    inputTokenAmounts.push(withdrawnTokenAmounts[idx]);

    withdrawAmountUSD = withdrawAmountUSD.plus(
      withdrawnTokenAmounts[idx]
        .divDecimal(
          constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
        )
        .times(inputToken.lastPriceUSD!)
    );
  }

  let tokenSupplyAfterWithdrawal = utils.getOutputTokenSupply(
    poolAddress,
    pool.outputTokenSupply!
  );
  let outputTokenBurntAmount = pool.outputTokenSupply!.minus(
    tokenSupplyAfterWithdrawal
  );

  pool.inputTokenBalances = inputTokenBalances;
  pool.totalValueLockedUSD = utils.getPoolTVL(
    pool.inputTokens,
    pool.inputTokenBalances,
    block
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(poolAddress);
  pool.outputTokenSupply = tokenSupplyAfterWithdrawal;
  pool.outputTokenPriceUSD = utils.getOutputTokenPriceUSD(poolAddress, block);
  pool.save();

  createWithdrawTransaction(
    pool,
    inputTokenAmounts,
    outputTokenBurntAmount,
    withdrawAmountUSD,
    provider,
    transaction,
    block
  );

  let protocolSideRevenueUSD = getRemoveLiquidityFeesUSD(
    poolAddress,
    inputTokens,
    fees,
    block
  );

  updateRevenueSnapshots(
    pool,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterWithdraw(block);

  log.info(
    "[RemoveLiquidity] LiquidityPool: {}, sharesBurnt: {}, inputTokenBalances: [{}], withdrawnAmounts: [{}], withdrawAmountUSD: {}, fees: [{}], feesUSD: {}, TxnHash: {}",
    [
      poolAddress.toHexString(),
      outputTokenBurntAmount.toString(),
      inputTokenBalances.join(", "),
      withdrawnTokenAmounts.join(", "),
      withdrawAmountUSD.truncate(1).toString(),
      fees.join(", "),
      protocolSideRevenueUSD.truncate(1).toString(),
      transaction.hash.toHexString(),
    ]
  );
}
