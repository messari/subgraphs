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
  getOrCreateLiquidityPoolDailySnapshots,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { getStat, updateStat } from "./Stat";
import { getOrCreatePosition, updatePositions } from "./Position";

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

    withdrawTransaction.account = provider.toHexString();

    withdrawTransaction.hash = transaction.hash.toHexString();
    withdrawTransaction.logIndex = transaction.index.toI32();
    withdrawTransaction.nonce = transaction.nonce;
    withdrawTransaction.gasLimit = transaction.gasLimit;
    withdrawTransaction.gasPrice = transaction.gasPrice;

    withdrawTransaction.inputTokens = pool.inputTokens;
    withdrawTransaction.inputTokenAmounts = inputTokenAmounts;

    withdrawTransaction.outputToken = pool.outputToken;
    withdrawTransaction.outputTokenAmount = outputTokenBurntAmount;

    withdrawTransaction.amountUSD = amountUSD;

    withdrawTransaction.timestamp = block.timestamp;
    withdrawTransaction.blockNumber = block.number;

    withdrawTransaction.position = getOrCreatePosition(
      pool.id,
      provider.toHexString(),
      transaction,
      block
    ).id;

    withdrawTransaction.save();
  }

  return withdrawTransaction;
}

export function UpdateMetricsAfterWithdraw(
  block: ethereum.Block,
  amountToken: BigInt,
  amountUSD: BigDecimal
): void {
  const protocol = getOrCreateDexAmmProtocol();

  // Update hourly and daily withdraw transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsHourlySnapshot.hourlyWithdrawCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  updateStat(
    getStat(metricsDailySnapshot.withdrawStats),
    amountToken,
    amountUSD
  );

  protocol.save();
}

export function Withdraw(
  poolAddress: Address,
  inputTokens: Address[],
  withdrawnTokenAmounts: BigInt[],
  fees: BigInt[],
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  transactionLogIndex: BigInt
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
  pool.inputTokenWeights = utils.getPoolTokenWeights(
    poolAddress,
    pool.inputTokens
  );
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

  updatePositions(
    pool,
    constants.UsageType.WITHDRAW,
    provider,
    outputTokenBurntAmount,
    transaction,
    block,
    transactionLogIndex
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterWithdraw(block, outputTokenBurntAmount, withdrawAmountUSD);

  let poolDailySnaphot = getOrCreateLiquidityPoolDailySnapshots(pool.id, block);
  updateStat(
    getStat(poolDailySnaphot.depositStats),
    outputTokenBurntAmount,
    withdrawAmountUSD
  );

  log.info(
    "[RemoveLiquidity] LiquidityPool: {}, sharesBurnt: {}, inputTokenBalances: [{}], withdrawnAmounts: [{}], withdrawAmountUSD: {}, fees: [{}], TxnHash: {}",
    [
      poolAddress.toHexString(),
      outputTokenBurntAmount.toString(),
      inputTokenBalances.join(", "),
      withdrawnTokenAmounts.join(", "),
      withdrawAmountUSD.truncate(1).toString(),
      fees.join(", "),
      transaction.hash.toHexString(),
    ]
  );
}
