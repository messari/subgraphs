import { Protobuf } from "as-proto";
import { BigDecimal, BigInt, cosmos, log } from "@graphprotocol/graph-ts";
import {
  Deposit as DepositTransaction,
  LiquidityPool as LiquidityPoolStore,
} from "../../generated/schema";
import {
  MsgJoinPool,
  MsgJoinSwapExternAmountIn,
  MsgJoinSwapShareAmountOut,
} from "./Decoder";
import * as constants from "../common/constants";
import { getOrCreateDexAmmProtocol } from "../common/initializer";
import * as utils from "../common/utils";
import { updateMetrics } from "./Metrics";

function createDepositTransaction(
  from: string,
  liquidityPool: LiquidityPoolStore,
  transaction: cosmos.TxResult,
  block: cosmos.HeaderOnlyBlock,
  inputTokenAmounts: Array<BigInt>,
  sharesMinted: BigInt,
  amountUSD: BigDecimal
): void {
  if (!transaction) {
    return;
  }
  const transactionId = "deposit-" + transaction.hash.toHexString();
  const depositTransaction = new DepositTransaction(transactionId);

  depositTransaction.pool = liquidityPool.id;
  depositTransaction.protocol = getOrCreateDexAmmProtocol().id;

  depositTransaction.to = liquidityPool.id;
  depositTransaction.from = from;
  depositTransaction.hash = transaction.hash.toHexString();
  depositTransaction.logIndex = transaction.index;

  depositTransaction.inputTokens = liquidityPool.inputTokens;
  depositTransaction.inputTokenAmounts = inputTokenAmounts;
  depositTransaction.outputToken = liquidityPool.outputToken;
  depositTransaction.outputTokenAmount = sharesMinted;
  depositTransaction.amountUSD = amountUSD;

  depositTransaction.blockNumber = BigInt.fromI32(block.header.height as i32);
  depositTransaction.timestamp = BigInt.fromI32(
    block.header.time.seconds as i32
  );

  depositTransaction.save();
}

export function msgJoinPoolHandler(
  msgValue: Uint8Array,
  data: cosmos.TransactionData
): void {
  const message = Protobuf.decode<MsgJoinPool>(msgValue, MsgJoinPool.decode);
  const liquidityPoolId = constants.Protocol.NAME.concat("-").concat(
    message.poolId.toString()
  );
  const liquidityPool = LiquidityPoolStore.load(liquidityPoolId);
  if (!liquidityPool) {
    return;
  }

  const inputTokenBalances = liquidityPool.inputTokenBalances;
  const inputTokenAmounts = new Array<BigInt>(inputTokenBalances.length).fill(
    constants.BIGINT_ZERO
  );
  for (let idx = 0; idx < message.tokenInMaxs.length; idx++) {
    const tokenInMax = message.tokenInMaxs[idx];
    const inputTokenIndex = liquidityPool.inputTokens.indexOf(tokenInMax.denom);
    if (inputTokenIndex >= 0) {
      const amount = tokenInMax.amount;
      inputTokenAmounts[inputTokenIndex] = amount;
      inputTokenBalances[inputTokenIndex] = inputTokenBalances[
        inputTokenIndex
      ].plus(amount);
    }
  }
  log.warning("msgJoinPoolHandler() at height {} index {}", [
    data.block.header.height.toString(),
    data.tx.index.toString(),
  ]);

  joinPoolHandler(
    message.sender,
    liquidityPool,
    inputTokenBalances,
    inputTokenAmounts,
    message.shareOutAmount,
    data
  );
}

export function msgJoinSwapExternAmountInHandler(
  msgValue: Uint8Array,
  data: cosmos.TransactionData
): void {
  const message = Protobuf.decode<MsgJoinSwapExternAmountIn>(
    msgValue,
    MsgJoinSwapExternAmountIn.decode
  );
  if (!message.tokenIn) {
    return;
  }

  const tokenIn = message.tokenIn!;
  joinSwapHandler(
    message.sender,
    message.poolId,
    tokenIn.denom,
    tokenIn.amount,
    message.shareOutMinAmount,
    data
  );
}

export function msgJoinSwapShareAmountOutHandler(
  msgValue: Uint8Array,
  data: cosmos.TransactionData
): void {
  const message = Protobuf.decode<MsgJoinSwapShareAmountOut>(
    msgValue,
    MsgJoinSwapShareAmountOut.decode
  );

  joinSwapHandler(
    message.sender,
    message.poolId,
    message.tokenInDenom,
    message.tokenInMaxAmount,
    message.shareOutAmount,
    data
  );
}

function joinSwapHandler(
  sender: string,
  poolId: BigInt,
  tokenInDenom: string,
  tokenInAmount: BigInt,
  shareOutAmount: BigInt,
  data: cosmos.TransactionData
): void {
  const liquidityPoolId = constants.Protocol.NAME.concat("-").concat(
    poolId.toString()
  );
  const liquidityPool = LiquidityPoolStore.load(liquidityPoolId);
  if (!liquidityPool) {
    return;
  }

  const tokenInIndex = liquidityPool.inputTokens.indexOf(tokenInDenom);
  if (tokenInIndex < 0) {
    return;
  }

  const inputTokenBalances = liquidityPool.inputTokenBalances;
  const inputTokenWeights = liquidityPool.inputTokenWeights;
  const inputTokenAmounts = new Array<BigInt>(inputTokenBalances.length).fill(
    constants.BIGINT_ZERO
  );
  const tokenInAmountChange = tokenInAmount
    .times(utils.bigDecimalToBigInt(inputTokenWeights[tokenInIndex]))
    .div(constants.BIGINT_HUNDRED);
  for (let i = 0; i < inputTokenAmounts.length; i++) {
    inputTokenAmounts[i] = tokenInAmountChange
      .times(inputTokenBalances[i])
      .div(inputTokenBalances[tokenInIndex]);
  }

  for (let i = 0; i < inputTokenBalances.length; i++) {
    inputTokenBalances[i] = inputTokenBalances[i].plus(inputTokenAmounts[i]);
  }

  joinPoolHandler(
    sender,
    liquidityPool,
    inputTokenBalances,
    inputTokenAmounts,
    shareOutAmount,
    data
  );
}

function joinPoolHandler(
  sender: string,
  liquidityPool: LiquidityPoolStore,
  inputTokenBalances: BigInt[],
  inputTokenAmounts: BigInt[],
  shareOutAmount: BigInt,
  data: cosmos.TransactionData
): void {
  liquidityPool.inputTokenBalances = inputTokenBalances;
  liquidityPool.outputTokenSupply = liquidityPool.outputTokenSupply!.plus(
    shareOutAmount
  );
  liquidityPool.save();

  const prevTVL = liquidityPool.totalValueLockedUSD;
  utils.updatePoolTVL(liquidityPool, data.block);
  const tvlChange = liquidityPool.totalValueLockedUSD.minus(prevTVL);

  createDepositTransaction(
    sender,
    liquidityPool,
    data.tx,
    data.block,
    inputTokenAmounts,
    shareOutAmount,
    tvlChange
  );

  utils.updateProtocolTotalValueLockedUSD(tvlChange);

  updateMetrics(data.block, sender, constants.UsageType.DEPOSIT);
}
