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
  if (transaction == null) {
    return;
  }
  const withdrawTransactionId = "withdraw-" + transaction.hash.toHexString();
  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (withdrawTransaction == null) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

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

    withdrawTransaction.blockNumber = BigInt.fromI32(
      block.header.height as i32
    );
    withdrawTransaction.timestamp = BigInt.fromI32(
      block.header.time.seconds as i32
    );

    withdrawTransaction.save();
  }
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
  if (liquidityPool == null) {
    return;
  }

  const inputTokenBalances = liquidityPool.inputTokenBalances;
  const inputTokenAmounts = new Array<BigInt>(inputTokenBalances.length).fill(
    constants.BIGINT_ZERO
  );
  for (let idx = 0; idx < message.tokenOutMins.length; idx++) {
    const tokenOutMin = message.tokenOutMins[idx];
    let inputTokenIndex = liquidityPool.inputTokens.indexOf(tokenOutMin.denom);
    if (inputTokenIndex >= 0) {
      const amount = tokenOutMin.amount;
      inputTokenAmounts[inputTokenIndex] = amount;
      inputTokenBalances[inputTokenIndex] = inputTokenBalances[
        inputTokenIndex
      ].minus(amount);
    }
  }

  exitPoolHandler(
    message.sender,
    liquidityPool,
    inputTokenBalances,
    inputTokenAmounts,
    message.shareInAmount,
    data
  );
}

export function msgExitSwapExternAmountOutHandler(
  msgValue: Uint8Array,
  data: cosmos.TransactionData
): void {
  const message = Protobuf.decode<MsgExitSwapExternAmountOut>(
    msgValue,
    MsgExitSwapExternAmountOut.decode
  );
  if (message.tokenOut == null) {
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
  //log.warning(
  //   "exitSwapHandler() tokenInDenom {} tokenAmount {} at height {} index {}",
  //   [
  //     tokenInDenom,
  //     tokenInAmount.toString(),
  //     data.block.header.height.toString(),
  //     data.tx.index.toString(),
  //   ]
  // );

  const liquidityPoolId = constants.Protocol.NAME.concat("-").concat(
    poolId.toString()
  );
  const liquidityPool = LiquidityPoolStore.load(liquidityPoolId);
  if (liquidityPool == null) {
    return;
  }

  const tokenOutIndex = liquidityPool.inputTokens.indexOf(tokenOutDenom);
  if (tokenOutIndex < 0) {
    return;
  }
  // const tokenOutAmountChange = utils.bigDecimalToBigInt(
  //   tokenOutAmount
  //     .toBigDecimal()
  //     .times(liquidityPool.inputTokenWeights[tokenOutIndex])
  //     .div(constants.BIGDECIMAL_HUNDRED)
  // );
  const inputTokenAmounts = liquidityPool.inputTokenBalances;
  const inputTokenBalances = liquidityPool.inputTokenBalances;
  const prevInputTokenBalance = inputTokenBalances[tokenOutIndex];
  const swapInputTokens = liquidityPool._inputTokenAmounts;
  for (let i = 0; i < inputTokenBalances.length; i++) {
    if (liquidityPool.outputTokenSupply != constants.BIGINT_ZERO) {
      inputTokenAmounts[i] = inputTokenBalances[i]
        .times(shareInAmount)
        .div(liquidityPool.outputTokenSupply!);
    }
    inputTokenBalances[i] = inputTokenBalances[i].minus(inputTokenAmounts[i]);

    // if (
    //   swapInputTokens != null &&
    //   swapInputTokens[tokenOutIndex] != constants.BIGINT_ZERO
    // ) {
    //   inputTokenAmounts[i] = tokenOutAmountChange
    //     .times(swapInputTokens[i])
    //     .div(swapInputTokens[tokenOutIndex]);
    // } else {
    //   inputTokenAmounts[i] = tokenOutAmountChange
    //     .times(inputTokenBalances[i])
    //     .div(prevInputTokenBalance);
    //   inputTokenBalances[i] = inputTokenBalances[i].minus(inputTokenAmounts[i]);
    // }
  }

  exitPoolHandler(
    sender,
    liquidityPool,
    inputTokenBalances,
    inputTokenAmounts,
    shareInAmount,
    data
  );
}

function exitPoolHandler(
  sender: string,
  liquidityPool: LiquidityPoolStore,
  inputTokenBalances: BigInt[],
  inputTokenAmounts: BigInt[],
  shareInAmount: BigInt,
  data: cosmos.TransactionData
): void {
  if (
    liquidityPool.inputTokenBalances[1] != constants.BIGINT_ZERO &&
    inputTokenBalances[1] != constants.BIGINT_ZERO &&
    inputTokenAmounts[1] != constants.BIGINT_ZERO
  ) {
    log.warning(
      "exitPoolHandler for pool {} inputTokenBalances before {} after {} tokenAmount {}",
      [
        liquidityPool.id.toString(),
        liquidityPool.inputTokenBalances[0]
          .divDecimal(liquidityPool.inputTokenBalances[1].toBigDecimal())
          .toString(),
        inputTokenBalances[0]
          .divDecimal(inputTokenBalances[1].toBigDecimal())
          .toString(),
        inputTokenAmounts[0]
          .divDecimal(inputTokenAmounts[1].toBigDecimal())
          .toString(),
      ]
    );
  }

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
