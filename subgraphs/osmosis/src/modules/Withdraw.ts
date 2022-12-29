import { Protobuf } from "as-proto";
import { BigDecimal, BigInt, cosmos, log } from "@graphprotocol/graph-ts";
import {
  Withdraw as WithdrawTransaction,
  LiquidityPool as LiquidityPoolStore,
} from "../../generated/schema";
import {
  MsgExitPool,
  MsgExitSwapExternAmountOut,
  MsgExitSwapShareAmountIn,
} from "./Decoder";
import * as constants from "../common/constants";
import { getOrCreateDexAmmProtocol } from "../common/initializer";
import * as utils from "../common/utils";
import { updateMetrics } from "./Metrics";

function createWithdrawTransaction(
  from: string,
  liquidityPool: LiquidityPoolStore,
  transaction: cosmos.TxResult,
  block: cosmos.HeaderOnlyBlock,
  inputTokenAmounts: Array<BigInt>,
  sharesBurnt: BigInt,
  amountUSD: BigDecimal
): void {
  if (!transaction) {
    return;
  }
  const withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();
  const withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

  withdrawTransaction.pool = liquidityPool.id;
  withdrawTransaction.protocol = getOrCreateDexAmmProtocol().id;

  withdrawTransaction.to = liquidityPool.id;
  withdrawTransaction.from = from;

  withdrawTransaction.hash = transaction.hash.toHexString();
  withdrawTransaction.logIndex = transaction.index;

  withdrawTransaction.inputTokens = liquidityPool.inputTokens;
  withdrawTransaction.outputToken = liquidityPool.outputToken;
  withdrawTransaction.inputTokenAmounts = inputTokenAmounts;
  withdrawTransaction.outputTokenAmount = sharesBurnt;
  withdrawTransaction.amountUSD = amountUSD;

  withdrawTransaction.blockNumber = BigInt.fromI32(block.header.height as i32);
  withdrawTransaction.timestamp = BigInt.fromI32(
    block.header.time.seconds as i32
  );

  withdrawTransaction.save();
}

export function msgExitPoolHandler(
  msgValue: Uint8Array,
  data: cosmos.TransactionData
): void {
  const message = Protobuf.decode<MsgExitPool>(msgValue, MsgExitPool.decode);
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
  let nonPositiveBalance = false;
  for (let idx = 0; idx < message.tokenOutMins.length; idx++) {
    const tokenOutMin = message.tokenOutMins[idx];
    const inputTokenIndex = liquidityPool.inputTokens.indexOf(
      tokenOutMin.denom
    );
    if (inputTokenIndex >= 0) {
      const amount = tokenOutMin.amount;
      inputTokenAmounts[inputTokenIndex] = amount;
      inputTokenBalances[inputTokenIndex] = inputTokenBalances[
        inputTokenIndex
      ].minus(amount);
      if (inputTokenBalances[inputTokenIndex] <= constants.BIGINT_ZERO) {
        nonPositiveBalance = true;
        log.error(
          "[msgExitPoolHandler] token balance is not postive, this SHOULD NOT happen",
          []
        );
      }
    }
  }

  if (!nonPositiveBalance) {
    exitPoolHandler(
      message.sender,
      liquidityPool,
      inputTokenBalances,
      inputTokenAmounts,
      message.shareInAmount,
      data
    );
  }
}

export function msgExitSwapExternAmountOutHandler(
  msgValue: Uint8Array,
  data: cosmos.TransactionData
): void {
  const message = Protobuf.decode<MsgExitSwapExternAmountOut>(
    msgValue,
    MsgExitSwapExternAmountOut.decode
  );
  if (!message.tokenOut) {
    return;
  }

  const tokenOut = message.tokenOut!;
  exitSwapHandler(
    message.sender,
    message.poolId,
    tokenOut.denom,
    tokenOut.amount,
    message.shareInMaxAmount,
    data
  );
}

export function msgExitSwapShareAmountInHandler(
  msgValue: Uint8Array,
  data: cosmos.TransactionData
): void {
  const message = Protobuf.decode<MsgExitSwapShareAmountIn>(
    msgValue,
    MsgExitSwapShareAmountIn.decode
  );

  exitSwapHandler(
    message.sender,
    message.poolId,
    message.tokenOutDenom,
    message.tokenOutMinAmount,
    message.shareInAmount,
    data
  );
}

function exitSwapHandler(
  sender: string,
  poolId: BigInt,
  tokenOutDenom: string,
  tokenOutAmount: BigInt,
  shareInAmount: BigInt,
  data: cosmos.TransactionData
): void {
  const liquidityPoolId = constants.Protocol.NAME.concat("-").concat(
    poolId.toString()
  );
  const liquidityPool = LiquidityPoolStore.load(liquidityPoolId);
  if (!liquidityPool) {
    return;
  }

  const tokenOutIndex = liquidityPool.inputTokens.indexOf(tokenOutDenom);
  if (tokenOutIndex < 0) {
    return;
  }

  const inputTokenBalances = liquidityPool.inputTokenBalances;
  const inputTokenWeights = liquidityPool.inputTokenWeights;
  const inputTokenAmounts = new Array<BigInt>(inputTokenBalances.length).fill(
    constants.BIGINT_ZERO
  );
  const tokenOutAmountChange = tokenOutAmount
    .times(utils.bigDecimalToBigInt(inputTokenWeights[tokenOutIndex]))
    .div(constants.BIGINT_HUNDRED);
  let nonPositiveBalance = false;
  for (let i = 0; i < inputTokenAmounts.length; i++) {
    inputTokenAmounts[i] = tokenOutAmountChange
      .times(inputTokenBalances[i])
      .div(inputTokenBalances[tokenOutIndex]);
  }
  for (let i = 0; i < inputTokenBalances.length; i++) {
    inputTokenBalances[i] = inputTokenBalances[i].minus(inputTokenAmounts[i]);
    if (inputTokenBalances[i] <= constants.BIGINT_ZERO) {
      nonPositiveBalance = true;
      log.error(
        "[exitSwapHandler] token balance is not postive, this SHOULD NOT happen",
        []
      );
    }
  }

  if (!nonPositiveBalance) {
    exitPoolHandler(
      sender,
      liquidityPool,
      inputTokenBalances,
      inputTokenAmounts,
      shareInAmount,
      data
    );
  }
}

function exitPoolHandler(
  sender: string,
  liquidityPool: LiquidityPoolStore,
  inputTokenBalances: BigInt[],
  inputTokenAmounts: BigInt[],
  shareInAmount: BigInt,
  data: cosmos.TransactionData
): void {
  liquidityPool.inputTokenBalances = inputTokenBalances;
  liquidityPool.outputTokenSupply = liquidityPool.outputTokenSupply!.minus(
    shareInAmount
  );
  liquidityPool.save();

  const prevTVL = liquidityPool.totalValueLockedUSD;
  utils.updatePoolTVL(liquidityPool, data.block);

  createWithdrawTransaction(
    sender,
    liquidityPool,
    data.tx,
    data.block,
    inputTokenAmounts,
    shareInAmount,
    prevTVL.minus(liquidityPool.totalValueLockedUSD)
  );

  utils.updateProtocolTotalValueLockedUSD(
    liquidityPool.totalValueLockedUSD.minus(prevTVL)
  );

  updateMetrics(data.block, sender, constants.UsageType.WITHDRAW);
}
