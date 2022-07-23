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
  getOrCreateLiquidityPool,
  getOrCreateDexAmmProtocol,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";

export function createWithdrawTransaction(
  pool: LiquidityPoolStore,
  inputTokenAmounts: BigInt[],
  outputTokenBurntAmount: BigInt,
  amountUSD: BigDecimal,
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): WithdrawTransaction {
  let withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();

  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

    withdrawTransaction.pool = pool.id;
    withdrawTransaction.protocol = constants.Mainnet.REGISTRY_ADDRESS.toHexString();

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

export function Withdraw(
  liquidityPoolAddress: Address,
  withdrawnTokenAmounts: BigInt[],
  outputTokenBurntAmount: BigInt,
  tokenSupplyAfterWithdrawal: BigInt,
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(liquidityPoolAddress, block);

  if (outputTokenBurntAmount.equals(constants.BIGINT_NEGATIVE_ONE)) {
    outputTokenBurntAmount = pool.outputTokenSupply!.minus(
      tokenSupplyAfterWithdrawal!
    );
  }
  if (tokenSupplyAfterWithdrawal.equals(constants.BIGINT_NEGATIVE_ONE)) {
    tokenSupplyAfterWithdrawal = pool.outputTokenSupply!.minus(
      outputTokenBurntAmount
    );
  }

  let inputTokens: string[] = [];
  let inputTokenAmounts: BigInt[] = [];
  let inputTokenBalances = pool.inputTokenBalances;
  let withdrawAmountUSD = constants.BIGDECIMAL_ZERO;

  // TODO: Use 0.0.7
  if (withdrawnTokenAmounts.length == 1) return;

  for (let idx = 0; idx < withdrawnTokenAmounts.length; idx++) {
    let inputToken = utils.getOrCreateTokenFromString(pool.inputTokens[idx]);
    let inputTokenIndex = pool.inputTokens.indexOf(inputToken.id);
    
    let inputTokenAddress = Address.fromString(inputToken.id);
    let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
    let inputTokenDecimals = utils.getTokenDecimals(inputTokenAddress);

    inputTokenBalances[inputTokenIndex] = inputTokenBalances[
      inputTokenIndex
    ].plus(withdrawnTokenAmounts[idx]);

    inputTokenAmounts.push(withdrawnTokenAmounts[idx]);
    inputTokens.push(inputToken.id);

    withdrawAmountUSD = withdrawAmountUSD
      .div(inputTokenDecimals)
      .times(inputTokenPrice.usdPrice)
      .div(inputTokenPrice.decimalsBaseTen);
  }

  createWithdrawTransaction(
    pool,
    inputTokenAmounts,
    outputTokenBurntAmount,
    withdrawAmountUSD,
    provider,
    transaction,
    block
  );

  pool.outputTokenSupply = tokenSupplyAfterWithdrawal;
  pool.save();

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterWithdraw(block);

  log.info(
    "[RemoveLiquidity] LiquidityPool: {}, sharesBurnt: {}, depositAmount: [{}], depositAmountUSD: {}, TxnHash: {}",
    [
      liquidityPoolAddress.toHexString(),
      outputTokenBurntAmount.toString(),
      withdrawnTokenAmounts.join(', '),
      withdrawAmountUSD.truncate(2).toString(),
      transaction.hash.toHexString()
    ]
  );
}
