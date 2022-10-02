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
  event: ethereum.Event,
  block: ethereum.Block
): WithdrawTransaction {
  let withdrawTransactionId = "withdraw-"
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

    withdrawTransaction.pool = pool.id;
    withdrawTransaction.protocol = constants.PROTOCOL_ID.toHexString();

    withdrawTransaction.to = constants.NULL.TYPE_STRING;
    if (event.transaction.to)
      withdrawTransaction.to = event.transaction.to!.toHexString();

    withdrawTransaction.from = provider.toHexString();

    withdrawTransaction.hash = event.transaction.hash.toHexString();
    withdrawTransaction.logIndex = event.logIndex.toI32();

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

export function getWithdrawnTokenAmounts(
  liquidityPoolAddress: Address,
  provider: Address,
  inputTokens: string[],
  event: ethereum.Event
): BigInt[] {
  let receipt = event.receipt;
  if (!receipt)
    return new Array<BigInt>(inputTokens.length).fill(constants.BIGINT_ZERO);

  let logs = event.receipt!.logs;
  if (!logs)
    return new Array<BigInt>(inputTokens.length).fill(constants.BIGINT_ZERO);

  let inputToken = constants.NULL.TYPE_ADDRESS;
  let inputTokenAmount = constants.BIGINT_ZERO;

  for (let i = 0; i < logs.length; i++) {
    let log = logs.at(i);
    let topic_signature = log.topics.at(0);
    if (
      crypto
        .keccak256(ByteArray.fromUTF8("Transfer(address,address,uint256)"))
        .equals(topic_signature)
    ) {
      let _from = ethereum.decode("address", log.topics.at(1))!.toAddress();
      let _to = ethereum.decode("address", log.topics.at(2))!.toAddress();

      if (_from.equals(liquidityPoolAddress) && _to.equals(provider)) {
        let data = ethereum.decode("uint256", log.data);

        if (data) {
          inputToken = log.address;
          inputTokenAmount = data.toBigInt();
        }
      }
    }
  }

  let withdrawnTokenAmounts: BigInt[] = [];

  for (let idx = 0; idx < inputTokens.length; idx++) {
    if (Address.fromString(inputTokens.at(idx)).equals(inputToken)) {
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
  outputTokenBurntAmount: BigInt | null,
  tokenSupplyAfterWithdrawal: BigInt | null,
  provider: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  event: ethereum.Event
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  if (!tokenSupplyAfterWithdrawal)
    tokenSupplyAfterWithdrawal = utils.getOutputTokenSupply(
      Address.fromString(pool.outputToken!),
      pool.outputTokenSupply!
    );

  if (!outputTokenBurntAmount)
    outputTokenBurntAmount = pool.outputTokenSupply!.minus(
      tokenSupplyAfterWithdrawal
    );

  if (withdrawnTokenAmounts.length == 0) {
    // Exception: Remove Liquidity One has no information about input token

    withdrawnTokenAmounts = getWithdrawnTokenAmounts(
      poolAddress,
      provider,
      pool.inputTokens,
      event
    );
  }

  let inputTokens: string[] = [];
  let inputTokenAmounts: BigInt[] = [];
  let withdrawAmountUSD = constants.BIGDECIMAL_ZERO;

  for (let idx = 0; idx < withdrawnTokenAmounts.length; idx++) {
    let inputToken = utils.getOrCreateTokenFromString(
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
    utils.getOrCreateTokenFromString(pool.outputToken!, block),
    tokenSupplyAfterWithdrawal
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(
    pool.inputTokens,
    pool.inputTokenBalances,
    pool.totalValueLockedUSD,
    block
  );
  pool.outputTokenSupply = tokenSupplyAfterWithdrawal;
  pool.outputTokenPriceUSD = utils.getOrCreateTokenFromString(
    pool.outputToken!,
    block
  ).lastPriceUSD!;

  pool.save();

  createWithdrawTransaction(
    pool,
    inputTokenAmounts,
    outputTokenBurntAmount,
    withdrawAmountUSD,
    provider,
    event,
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
