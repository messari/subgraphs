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

export function createWithdrawTransaction(
  pool: LiquidityPoolStore,
  inputTokenAmounts: BigInt[],
  outputTokenBurntAmount: BigInt,
  amountUSD: BigDecimal,
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): WithdrawTransaction {
  const withdrawTransactionId = "withdraw-"
    .concat(transaction.hash.toHexString())
    .concat("-")
    .concat(transaction.index.toString());

  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

    withdrawTransaction.pool = pool.id;
    withdrawTransaction.protocol = constants.REGISTRY_ADDRESS.toHexString();

    withdrawTransaction.to = constants.NULL.TYPE_STRING;
    if (transaction.to) withdrawTransaction.to = transaction.to!.toHexString();

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
  provider: Address,
  amount: BigInt
): Address {
  const receipt = event.receipt;
  if (!receipt) return constants.NULL.TYPE_ADDRESS;

  const logs = event.receipt!.logs;
  if (!logs) return constants.NULL.TYPE_ADDRESS;

  for (let i = 0; i < logs.length; ++i) {
    const log = logs.at(i);
    const topic_signature = log.topics.at(0);
    if (
      crypto
        .keccak256(ByteArray.fromUTF8("Transfer(address,address,uint256)"))
        .equals(topic_signature)
    ) {
      const _from = ethereum.decode("address", log.topics.at(1))!.toAddress();
      const _to = ethereum.decode("address", log.topics.at(2))!.toAddress();

      if (_from == poolAddress && _to == provider) {
        const data = ethereum.decode("uint256", log.data);

        if (data && data.toBigInt().equals(amount)) {
          const inputToken = log.address;

          return inputToken;
        }
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
  const inputToken = getInputToken(
    event,
    liquidityPoolAddress,
    provider,
    inputTokenAmount
  );

  const withdrawnTokenAmounts = new Array<BigInt>();

  for (let idx = 0; idx < inputTokens.length; idx++) {
    if (inputTokens[idx] == inputToken.toHexString()) {
      withdrawnTokenAmounts.push(inputTokenAmount);

      continue;
    }

    withdrawnTokenAmounts.push(constants.BIGINT_ZERO);
  }

  return withdrawnTokenAmounts;
}

export function Withdraw(
  poolAddress: Address,
  withdrawnTokenAmounts: BigInt[],
  outputTokenBurntAmount: BigInt,
  tokenSupplyAfterWithdrawal: BigInt | null,
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  event: ethereum.Event
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  if (
    !tokenSupplyAfterWithdrawal &&
    outputTokenBurntAmount.equals(constants.BIGINT_NEGATIVE_ONE)
  ) {
    outputTokenBurntAmount = pool.outputTokenSupply!.minus(
      tokenSupplyAfterWithdrawal!
    );
  }

  if (!tokenSupplyAfterWithdrawal) {
    tokenSupplyAfterWithdrawal = pool.outputTokenSupply!.minus(
      outputTokenBurntAmount
    );
  }

  if (withdrawnTokenAmounts.length == 1) {
    // Exception: Remove Liquidity One has no information about input token

    withdrawnTokenAmounts = getWithdrawnTokenAmounts(
      poolAddress,
      provider,
      pool.inputTokens,
      withdrawnTokenAmounts[0],
      event
    );
  }

  const inputTokens: string[] = [];
  const inputTokenAmounts: BigInt[] = [];
  let withdrawAmountUSD = constants.BIGDECIMAL_ZERO;

  for (let idx = 0; idx < withdrawnTokenAmounts.length; idx++) {
    const inputToken = utils.getOrCreateTokenFromString(
      pool.inputTokens[idx],
      block
    );

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
    poolAddress,
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
  pool.outputTokenPriceUSD = utils.getOutputTokenPriceUSD2(poolAddress, block);
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
  utils.updateProtocolTotalValueLockedUSD();
  UpdateMetricsAfterWithdraw(block);

  log.info(
    "[RemoveLiquidity] LiquidityPool: {}, sharesBurnt: {}, withdrawnAmounts: [{}], withdrawAmountUSD: {}, TxnHash: {}",
    [
      poolAddress.toHexString(),
      outputTokenBurntAmount.toString(),
      withdrawnTokenAmounts.join(", "),
      withdrawAmountUSD.truncate(1).toString(),
      transaction.hash.toHexString(),
    ]
  );
}


