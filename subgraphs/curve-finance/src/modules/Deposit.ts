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
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { updateRevenueSnapshots } from "./Revenue";
import { Pool as LiquidityPoolContract } from "../../generated/templates/PoolTemplate/Pool";

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

export function getAddLiquidityFeesUSD(
  poolAddress: Address,
  inputTokens: string[],
  fees: BigInt[]
): BigDecimal {
  if (fees.length == 1) {
    let outputTokenPrice = getUsdPricePerToken(poolAddress);
    let outputTokenDecimals = utils.getTokenDecimals(poolAddress);

    return fees[0]
      .divDecimal(outputTokenDecimals)
      .times(outputTokenPrice.usdPrice)
      .div(outputTokenPrice.decimalsBaseTen);
  }

  let totalFeesUSD = constants.BIGDECIMAL_ZERO;
  for (let idx = 0; idx < inputTokens.length; idx++) {
    if (fees.at(idx) == constants.BIGINT_ZERO) continue;

    let inputToken = Address.fromString(inputTokens.at(idx));
    let inputTokenPrice = getUsdPricePerToken(inputToken);
    let inputTokenDecimals = utils.getTokenDecimals(inputToken);

    let inputTokenFee = fees
      .at(idx)
      .divDecimal(inputTokenDecimals)
      .times(inputTokenPrice.usdPrice)
      .div(inputTokenPrice.decimalsBaseTen);

    totalFeesUSD = totalFeesUSD.plus(inputTokenFee);
  }

  return totalFeesUSD;
}

export function Deposit(
  liquidityPoolAddress: Address,
  depositedCoinAmounts: BigInt[],
  totalSupplyAfterDeposit: BigInt,
  fees: BigInt[],
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(liquidityPoolAddress, block);

  let inputTokens: string[] = [];
  let inputTokenAmounts: BigInt[] = [];
  let inputTokenBalances = pool.inputTokenBalances;
  let depositAmountUSD = constants.BIGDECIMAL_ZERO;
  let outputTokenMintedAmount = totalSupplyAfterDeposit.minus(
    pool.outputTokenSupply!
  );

  let poolContract = LiquidityPoolContract.bind(liquidityPoolAddress);
  let admin_fee = utils.readValue<BigInt>(
    poolContract.try_admin_fee(),
    constants.BIGINT_ZERO
  );

  for (let idx = 0; idx < depositedCoinAmounts.length; idx++) {
    let inputToken = utils.getOrCreateTokenFromString(pool.inputTokens[idx]);
    let inputTokenIndex = pool.inputTokens.indexOf(inputToken.id);

    let inputTokenAddress = Address.fromString(inputToken.id);
    let inputTokenPrice = getUsdPricePerToken(inputTokenAddress);
    let inputTokenDecimals = utils.getTokenDecimals(inputTokenAddress);

    let liquidityAdded = depositedCoinAmounts[idx];
    if (fees.length != 1) {
      // balance after AddLiquidity = token_amounts[idx] - (fees[idx] * self.admin_fee / FEE_DENOMINATOR)
      liquidityAdded = depositedCoinAmounts[idx].minus(
        fees[idx].times(admin_fee).div(constants.FEE_DENOMINATOR_BIGINT)
      );
    }

    inputTokenBalances[inputTokenIndex] = inputTokenBalances[
      inputTokenIndex
    ].plus(liquidityAdded);

    inputTokenAmounts.push(depositedCoinAmounts[idx]);
    inputTokens.push(inputToken.id);

    depositAmountUSD = depositedCoinAmounts[idx]
      .divDecimal(inputTokenDecimals)
      .times(inputTokenPrice.usdPrice)
      .div(inputTokenPrice.decimalsBaseTen);
  }

  pool.inputTokenBalances = inputTokenBalances;
  pool.totalValueLockedUSD = utils.getPoolTVL(
    pool.inputTokens,
    pool.inputTokenBalances
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(
    pool.inputTokens,
    pool.inputTokenBalances,
    pool.totalValueLockedUSD
  );
  pool.outputTokenSupply = totalSupplyAfterDeposit;
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

  let protocolSideRevenueUSD = getAddLiquidityFeesUSD(
    liquidityPoolAddress,
    pool.inputTokens,
    fees
  );

  updateRevenueSnapshots(
    pool,
    constants.BIGDECIMAL_ZERO,
    protocolSideRevenueUSD,
    block
  );

  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterDeposit(block);

  log.info(
    "[AddLiquidity] LiquidityPool: {}, sharesMinted: {}, depositAmount: [{}], depositAmountUSD: {}, fees: {}, feesUSD: {}, TxnHash: {}",
    [
      liquidityPoolAddress.toHexString(),
      outputTokenMintedAmount.toString(),
      depositedCoinAmounts.join(", "),
      depositAmountUSD.truncate(1).toString(),
      fees.join(", "),
      protocolSideRevenueUSD.truncate(1).toString(),
      transaction.hash.toHexString(),
    ]
  );
}
