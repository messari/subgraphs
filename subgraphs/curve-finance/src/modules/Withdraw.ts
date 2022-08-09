import {
  log,
  BigInt,
  crypto,
  Address,
  ethereum,
  ByteArray,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  Withdraw as WithdrawTransaction,
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
import { updateRevenueSnapshots } from "./Revenue";
import { Pool as LiquidityPoolContract } from "../../generated/templates/PoolTemplate/Pool";

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

function getInputToken(
  event: ethereum.Event,
  poolAddress: Address,
  provider: Address
): Address {
  let receipt = event.receipt;
  if (!receipt) return constants.NULL.TYPE_ADDRESS;

  let logs = event.receipt!.logs;
  if (!logs) return constants.NULL.TYPE_ADDRESS;

  for (let i = 0; i < logs.length; ++i) {
    let log = logs.at(i);
    let topic_signature = log.topics.at(0);
    if (
      crypto
        .keccak256(ByteArray.fromUTF8("Transfer(address,address,uint256)"))
        .equals(topic_signature)
    ) {
      let _from = ethereum.decode("address", log.topics.at(1))!.toAddress();
      let _to = ethereum.decode("address", log.topics.at(2))!.toAddress();

      if (_from == poolAddress && _to == provider) {
        let inputToken = log.address;

        return inputToken;
      }
    }
  }
  return constants.NULL.TYPE_ADDRESS;
}

export function getWithdrawnTokenAmounts(
  liquidityPoolAddress: Address,
  provider: Address,
  inputTokens: string[],
  inputTokenAmount: BigInt,
  event: ethereum.Event
): BigInt[] {
  let inputToken = getInputToken(event, liquidityPoolAddress, provider);

  let withdrawnTokenAmounts = new Array<BigInt>();

  for (let idx = 0; idx < inputTokens.length; idx++) {
    if (inputTokens[idx] == inputToken.toHexString()) {
      withdrawnTokenAmounts.push(inputTokenAmount);
    }

    withdrawnTokenAmounts.push(constants.BIGINT_ZERO);
  }

  return withdrawnTokenAmounts;
}

export function getRemoveLiquidityOneFees(
  liquidityPoolAddress: Address,
  withdrawnTokenAmounts: BigInt[],
  balanceBeforeWithdraw: BigInt[],
  inputTokens: string[],
  admin_fee: BigInt
): BigInt[] {
  let fees = new Array<BigInt>();
  let balanceAfterWithdraw = utils.getPoolBalances(
    liquidityPoolAddress,
    inputTokens
  );

  for (let idx = 0; idx < withdrawnTokenAmounts.length; idx++) {
    let withdrawnAmount = withdrawnTokenAmounts[idx];
    if (withdrawnAmount.equals(constants.BIGINT_ZERO)) {
      fees.push(constants.BIGINT_ZERO);
      continue;
    }

    let beforeBalance = balanceBeforeWithdraw[idx];
    let afterBalance = balanceAfterWithdraw[idx];

    let fee = beforeBalance
      .minus(afterBalance)
      .minus(withdrawnAmount)
      .div(admin_fee)
      .times(constants.FEE_DENOMINATOR_BIGINT);

    if (fee.ge(constants.BIGINT_ZERO)) fees.push(fee);
    else fees.push(constants.BIGINT_ZERO);
  }

  return fees;
}

export function getRemoveLiquidityFeesUSD(
  inputTokens: string[],
  fees: BigInt[],
  block: ethereum.Block
): BigDecimal {
  if (fees.length == 0) {
    return constants.BIGDECIMAL_ZERO;
  }

  let totalFeesUSD = constants.BIGDECIMAL_ZERO;
  for (let idx = 0; idx < inputTokens.length; idx++) {
    if (fees.at(idx) == constants.BIGINT_ZERO) continue;

    let inputToken = utils.getOrCreateTokenFromString(
      inputTokens.at(idx),
      block.number
    );

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
  liquidityPoolAddress: Address,
  withdrawnTokenAmounts: BigInt[],
  outputTokenBurntAmount: BigInt,
  tokenSupplyAfterWithdrawal: BigInt,
  provider: Address,
  fees: BigInt[],
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  event: ethereum.Event
): void {
  const pool = getOrCreateLiquidityPool(liquidityPoolAddress, block);

  let poolContract = LiquidityPoolContract.bind(liquidityPoolAddress);
  let admin_fee = utils.readValue<BigInt>(
    poolContract.try_admin_fee(),
    constants.BIGINT_ZERO
  );

  if (outputTokenBurntAmount.equals(constants.BIGINT_NEGATIVE_ONE)) {
    outputTokenBurntAmount = pool.outputTokenSupply!.minus(
      tokenSupplyAfterWithdrawal
    );
  }
  if (tokenSupplyAfterWithdrawal.equals(constants.BIGINT_NEGATIVE_ONE)) {
    tokenSupplyAfterWithdrawal = pool.outputTokenSupply!.minus(
      outputTokenBurntAmount
    );
  }

  if (withdrawnTokenAmounts.length == 1) {
    // Exception: Remove Liquidity One has no information about input token

    withdrawnTokenAmounts = getWithdrawnTokenAmounts(
      liquidityPoolAddress,
      provider,
      pool.inputTokens,
      withdrawnTokenAmounts[0],
      event
    );

    fees = getRemoveLiquidityOneFees(
      liquidityPoolAddress,
      withdrawnTokenAmounts,
      pool.inputTokenBalances,
      pool.inputTokens,
      admin_fee
    );
  }

  let inputTokens: string[] = [];
  let inputTokenAmounts: BigInt[] = [];
  let inputTokenBalances = pool.inputTokenBalances;
  let withdrawAmountUSD = constants.BIGDECIMAL_ZERO;

  for (let idx = 0; idx < withdrawnTokenAmounts.length; idx++) {
    let inputToken = utils.getOrCreateTokenFromString(
      pool.inputTokens[idx],
      block.number
    );
    let inputTokenIndex = pool.inputTokens.indexOf(inputToken.id);

    let liquidityWithdrawn = withdrawnTokenAmounts[idx];
    if (fees.length != 0) {
      // balance after RemoveLiquidity = token_amounts[idx] - (fees[idx] * self.admin_fee / FEE_DENOMINATOR)
      liquidityWithdrawn = withdrawnTokenAmounts[idx].minus(
        fees[idx].times(admin_fee).div(constants.FEE_DENOMINATOR_BIGINT)
      );
    }

    inputTokenBalances[inputTokenIndex] = inputTokenBalances[
      inputTokenIndex
    ].minus(liquidityWithdrawn);

    inputTokenAmounts.push(withdrawnTokenAmounts[idx]);
    inputTokens.push(inputToken.id);

    withdrawAmountUSD = withdrawAmountUSD.plus(
      withdrawnTokenAmounts[idx]
        .divDecimal(
          constants.BIGINT_TEN.pow(inputToken.decimals as u8).toBigDecimal()
        )
        .times(inputToken.lastPriceUSD!)
    );
  }

  pool.inputTokenBalances = utils.getPoolBalances(
    liquidityPoolAddress,
    pool.inputTokens
  );
  pool.totalValueLockedUSD = utils.getPoolTVL(
    pool.inputTokens,
    pool.inputTokenBalances,
    block
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(
    pool.inputTokens,
    pool.inputTokenBalances,
    pool.totalValueLockedUSD,
    block
  );
  pool.outputTokenSupply = tokenSupplyAfterWithdrawal;
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
    pool.inputTokens,
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
      liquidityPoolAddress.toHexString(),
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
