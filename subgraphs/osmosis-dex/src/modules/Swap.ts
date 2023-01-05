import { BigDecimal, BigInt, cosmos, log } from "@graphprotocol/graph-ts";
import {
  Swap as SwapTransaction,
  LiquidityPool as LiquidityPoolStore,
  Token,
} from "../../generated/schema";
import * as constants from "../common/constants";
import {
  getOrCreateDexAmmProtocol,
  getOrCreateToken,
} from "../common/initializer";
import * as utils from "../common/utils";
import {
  updateMetrics,
  updateSnapshotsVolume,
  updateSupplySideRevenue,
  updateTokenVolumeAndBalance,
} from "./Metrics";

function createSwapTransaction(
  from: string,
  liquidityPool: LiquidityPoolStore,
  transaction: cosmos.TxResult,
  block: cosmos.HeaderOnlyBlock,
  inputToken: string,
  inputTokenAmount: BigInt,
  amountInUSD: BigDecimal,
  outputToken: string,
  outputTokenAmount: BigInt,
  amountOutUSD: BigDecimal
): void {
  if (!transaction) {
    return;
  }
  const transactionId = "swap-" + transaction.hash.toHexString();
  const swapTransaction = new SwapTransaction(transactionId);

  swapTransaction.pool = liquidityPool.id;
  swapTransaction.protocol = getOrCreateDexAmmProtocol().id;
  swapTransaction.to = liquidityPool.id;
  swapTransaction.from = from;
  swapTransaction.hash = transaction.hash.toHexString();
  swapTransaction.logIndex = transaction.index;

  swapTransaction.tokenIn = inputToken;
  swapTransaction.amountIn = inputTokenAmount;
  swapTransaction.amountInUSD = amountInUSD;

  swapTransaction.tokenOut = outputToken;
  swapTransaction.amountOut = outputTokenAmount;
  swapTransaction.amountOutUSD = amountOutUSD;

  swapTransaction.blockNumber = BigInt.fromI32(block.header.height as i32);
  swapTransaction.timestamp = BigInt.fromI32(block.header.time.seconds as i32);

  swapTransaction.save();
}

export function msgSwapExactAmountHandler(
  msgValue: Uint8Array,
  data: cosmos.TransactionData
): void {
  const events = data.tx.result.events;
  for (let idx = 0; idx < events.length; idx++) {
    if (events[idx].eventType == "token_swapped") {
      swapHandler(events[idx], data.tx, data.block);
    }
  }
}

function swapHandler(
  data: cosmos.Event,
  tx: cosmos.TxResult,
  block: cosmos.HeaderOnlyBlock
): void {
  const attributes = data.attributes;
  let poolId: string = "";
  let tokenInAmount: BigInt = constants.BIGINT_ZERO;
  let tokenInDenom: string = "";
  let tokenOutAmount: BigInt = constants.BIGINT_ZERO;
  let tokenOutDenom: string = "";

  for (let i = 0; i < attributes.length; i++) {
    const key = attributes[i].key;
    const value = attributes[i].value;
    if (key == "pool_id") {
      poolId = value;
    } else if (key == "tokens_in" || key == "tokens_out") {
      const j = tokenDataParser(value) as i32;
      const tokenAmount = BigInt.fromString(value.substring(0, j));
      const tokenDenom = value.substring(j, value.length);
      if (key == "tokens_in") {
        tokenInAmount = tokenAmount;
        tokenInDenom = tokenDenom;
      } else {
        tokenOutAmount = tokenAmount;
        tokenOutDenom = tokenDenom;
      }
    }
  }
  const liquidityPoolId = constants.Protocol.NAME.concat("-").concat(poolId);
  const liquidityPool = LiquidityPoolStore.load(liquidityPoolId);
  if (!liquidityPool) {
    return;
  }

  swap(
    poolId,
    tokenInAmount,
    tokenInDenom,
    tokenOutAmount,
    tokenOutDenom,
    data,
    tx,
    block
  );
}

function tokenDataParser(tokenData: string): number {
  let i = 0;
  while (i < tokenData.length) {
    const tokeChar = tokenData.charAt(i);
    if (
      tokeChar == "0" ||
      tokeChar == "1" ||
      tokeChar == "2" ||
      tokeChar == "3" ||
      tokeChar == "4" ||
      tokeChar == "5" ||
      tokeChar == "6" ||
      tokeChar == "7" ||
      tokeChar == "8" ||
      tokeChar == "9"
    ) {
      i++;
    } else {
      break;
    }
  }

  return i;
}

function swap(
  poolId: string,
  tokenInAmount: BigInt,
  tokenInDenom: string,
  tokenOutAmount: BigInt,
  tokenOutDenom: string,
  data: cosmos.Event,
  tx: cosmos.TxResult,
  block: cosmos.HeaderOnlyBlock
): void {
  const liquidityPoolId = constants.Protocol.NAME.concat("-").concat(poolId);
  const liquidityPool = LiquidityPoolStore.load(liquidityPoolId);
  if (!liquidityPool) {
    return;
  }

  const inputTokenBalances = liquidityPool.inputTokenBalances;
  const inputTokenAmounts = new Array<BigInt>(inputTokenBalances.length).fill(
    constants.BIGINT_ZERO
  );
  const inputTokens = liquidityPool.inputTokens;
  const tokenInIndex = inputTokens.indexOf(tokenInDenom);
  if (tokenInIndex >= 0) {
    inputTokenBalances[tokenInIndex] = inputTokenBalances[tokenInIndex].plus(
      tokenInAmount
    );
    // The input token balance should always be positive, so put a defensive checking here in case something is wrong.
    if (inputTokenBalances[tokenInIndex] <= constants.BIGINT_ZERO) {
      log.error(
        "[swap] token balance is not postive, this SHOULD NOT happen",
        []
      );
      return;
    }
    inputTokenAmounts[tokenInIndex] = tokenInAmount;
  }

  const tokenOutIndex = inputTokens.indexOf(tokenOutDenom);
  if (tokenOutIndex >= 0) {
    inputTokenBalances[tokenOutIndex] = inputTokenBalances[tokenOutIndex].minus(
      tokenOutAmount
    );
    // The input token balance should always be positive, so put a defensive checking here in case something is wrong.
    if (inputTokenBalances[tokenOutIndex] <= constants.BIGINT_ZERO) {
      log.error(
        "[swap] token balance is not postive, this SHOULD NOT happen",
        []
      );
      return;
    }
    inputTokenAmounts[tokenOutIndex] = tokenOutAmount;
  }

  liquidityPool.inputTokenBalances = inputTokenBalances;
  liquidityPool._inputTokenAmounts = inputTokenAmounts;
  liquidityPool.save();

  let volumeUSD = constants.BIGDECIMAL_ZERO;
  const prevTVL = liquidityPool.totalValueLockedUSD;
  const hasPriceData = utils.updatePoolTVL(liquidityPool, block);
  if (hasPriceData) {
    volumeUSD = updatePriceForSwap(
      liquidityPoolId,
      tokenInDenom,
      tokenInAmount,
      tokenOutDenom,
      tokenOutAmount,
      block.header
    );
    liquidityPool.cumulativeVolumeUSD = liquidityPool.cumulativeVolumeUSD.plus(
      volumeUSD
    );
    liquidityPool.save();
  }
  const sender = data.getAttributeValue("sender");
  createSwapTransaction(
    sender,
    liquidityPool,
    tx,
    block,
    tokenInDenom,
    tokenInAmount,
    volumeUSD,
    tokenOutDenom,
    tokenOutAmount,
    volumeUSD
  );
  updateTokenVolumeAndBalance(
    liquidityPoolId,
    tokenInDenom,
    tokenInAmount,
    volumeUSD,
    block
  );
  updateTokenVolumeAndBalance(
    liquidityPoolId,
    tokenOutDenom,
    tokenOutAmount,
    volumeUSD,
    block
  );
  utils.updateProtocolTotalValueLockedUSD(
    liquidityPool.totalValueLockedUSD.minus(prevTVL)
  );
  updateSupplySideRevenue(liquidityPoolId, volumeUSD, block);
  updateSnapshotsVolume(liquidityPoolId, volumeUSD, block);
  updateMetrics(block, sender, constants.UsageType.SWAP);
}

function updatePriceForSwap(
  liquidityPoolId: string,
  tokenInDenom: string,
  tokenInAmount: BigInt,
  tokenOutDenom: string,
  tokenOutAmount: BigInt,
  header: cosmos.Header
): BigDecimal {
  let volumeUSD = constants.BIGDECIMAL_ZERO;
  const tokenIn = getOrCreateToken(tokenInDenom);
  const tokenOut = getOrCreateToken(tokenOutDenom);

  if (tokenIn._isStableCoin && !tokenOut._isStableCoin) {
    volumeUSD = updateOtherTokenPrice(
      liquidityPoolId,
      tokenIn,
      tokenInAmount,
      tokenOut,
      tokenOutAmount,
      header
    );
  } else if (!tokenIn._isStableCoin && tokenOut._isStableCoin) {
    volumeUSD = updateOtherTokenPrice(
      liquidityPoolId,
      tokenOut,
      tokenOutAmount,
      tokenIn,
      tokenInAmount,
      header
    );
  } else if (
    (tokenIn.id == constants.ATOM_DENOM &&
      tokenOut.id != constants.OSMO_DENOM) ||
    (tokenIn.id == constants.OSMO_DENOM && tokenOut.id != constants.ATOM_DENOM)
  ) {
    volumeUSD = updateOtherTokenPrice(
      liquidityPoolId,
      tokenIn,
      tokenInAmount,
      tokenOut,
      tokenOutAmount,
      header
    );
  } else if (
    (tokenIn.id != constants.ATOM_DENOM &&
      tokenOut.id == constants.OSMO_DENOM) ||
    (tokenIn.id != constants.OSMO_DENOM && tokenOut.id == constants.ATOM_DENOM)
  ) {
    volumeUSD = updateOtherTokenPrice(
      liquidityPoolId,
      tokenOut,
      tokenOutAmount,
      tokenIn,
      tokenInAmount,
      header
    );
  }
  return volumeUSD;
}

function updateOtherTokenPrice(
  liquidityPoolId: string,
  baseToken: Token,
  baseTokenAmount: BigInt,
  otherToken: Token,
  otherTokenAmount: BigInt,
  header: cosmos.Header
): BigDecimal {
  const id = (header.time.seconds / constants.SECONDS_PER_DAY).toString();
  if (
    !baseToken.lastPriceUSD ||
    baseToken.lastPriceUSD <= constants.BIGDECIMAL_ZERO
    // || (otherToken._lastPriceDate != null && otherToken._lastPriceDate == id)
  ) {
    return constants.BIGDECIMAL_ZERO;
  }

  const baseTokenAmountInUSD = utils
    .convertTokenToDecimal(baseTokenAmount, baseToken.decimals)
    .times(baseToken.lastPriceUSD!);

  if (
    !otherToken.id.startsWith("gamm/pool/") &&
    (!otherToken._lastPriceDate || otherToken._lastPriceDate != id)
  ) {
    otherToken.lastPriceUSD = baseTokenAmountInUSD.div(
      utils.convertTokenToDecimal(otherTokenAmount, otherToken.decimals)
    );
    otherToken.lastPriceBlockNumber = BigInt.fromI32(header.height as i32);
    otherToken._lastPriceDate = id;
    otherToken.save();
  }

  return baseTokenAmountInUSD;
}
