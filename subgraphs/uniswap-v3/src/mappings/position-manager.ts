import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  DecreaseLiquidity,
  IncreaseLiquidity,
  Transfer,
} from "../../generated/NonFungiblePositionManager/NonFungiblePositionManager";
import { Position, Token } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
} from "../common/constants";
import { getLiquidityPool } from "../common/entities/pool";
import {
  getOrCreatePosition,
  savePositionSnapshot,
} from "../common/entities/position";
import { getOrCreateToken } from "../common/entities/token";
import {
  convertTokenToDecimal,
  safeDivBigDecimal,
  sumBigIntListByIndex,
} from "../common/utils/utils";
import { getOrCreateProtocol } from "../common/entities/protocol";

export function getUSDValueFromNativeTokens(
  tokens: Token[],
  amounts: BigInt[]
): BigDecimal {
  let usdValue = BIGDECIMAL_ZERO;
  for (let i = INT_ZERO; i < tokens.length; i++) {
    const amountConverted = convertTokenToDecimal(
      amounts[i],
      tokens[i].decimals
    );
    usdValue = usdValue.plus(
      amountConverted.times(tokens[i].lastPriceUSD as BigDecimal)
    );
  }
  return usdValue;
}

export function handleIncreaseLiquidity(event: IncreaseLiquidity): void {
  const position = getOrCreatePosition(event, event.params.tokenId);

  // position was not able to be fetched
  if (position == null) {
    return;
  }

  const pool = getLiquidityPool(Address.fromBytes(position.pool));
  const protocol = getOrCreateProtocol();

  if (!pool) {
    log.warning("Pool not found for position: {}", [position.id.toHexString()]);
    return;
  }

  if (position.liquidity == BIGINT_ZERO) {
    if (isReOpened(position)) {
      pool.openPositionCount += INT_ONE;
      pool.closedPositionCount -= INT_ONE;
      protocol.openPositionCount += INT_ONE;
      protocol.cumulativePositionCount += INT_ONE;
      position.hashClosed = null;
      position.blockNumberClosed = null;
      position.timestampClosed = null;
    } else {
      pool.openPositionCount += INT_ONE;
      pool.positionCount = INT_ONE;
    }
  }

  const token0 = getOrCreateToken(event, pool.inputTokens[INT_ZERO]);
  const token1 = getOrCreateToken(event, pool.inputTokens[INT_ONE]);

  position.liquidity = position.liquidity.plus(event.params.liquidity);
  position.liquidityUSD = safeDivBigDecimal(
    position.liquidity.toBigDecimal(),
    pool.totalLiquidity.toBigDecimal()
  ).times(pool.totalLiquidityUSD);
  position.cumulativeDepositTokenAmounts = sumBigIntListByIndex([
    position.cumulativeDepositTokenAmounts,
    [event.params.amount0, event.params.amount1],
  ]);
  position.cumulativeDepositUSD = getUSDValueFromNativeTokens(
    [token0, token1],
    position.cumulativeDepositTokenAmounts
  );
  position.depositCount += INT_ONE;

  position.save();

  savePositionSnapshot(position, event);
}

export function handleDecreaseLiquidity(event: DecreaseLiquidity): void {
  const position = getOrCreatePosition(event, event.params.tokenId);

  // position was not able to be fetched
  if (position == null) {
    return;
  }

  const pool = getLiquidityPool(Address.fromBytes(position.pool));
  const protocol = getOrCreateProtocol();

  if (!pool) {
    log.warning("Pool not found for position: {}", [position.id.toHexString()]);
    return;
  }

  const token0 = getOrCreateToken(event, pool.inputTokens[INT_ZERO]);
  const token1 = getOrCreateToken(event, pool.inputTokens[INT_ONE]);

  position.liquidity = position.liquidity.plus(event.params.liquidity);
  position.liquidityUSD = safeDivBigDecimal(
    position.liquidity.toBigDecimal(),
    pool.totalLiquidity.toBigDecimal()
  ).times(pool.totalLiquidityUSD);
  position.cumulativeWithdrawTokenAmounts = sumBigIntListByIndex([
    position.cumulativeWithdrawTokenAmounts,
    [event.params.amount0, event.params.amount1],
  ]);
  position.cumulativeWithdrawUSD = getUSDValueFromNativeTokens(
    [token0, token1],
    position.cumulativeWithdrawTokenAmounts
  );
  position.withdrawCount += INT_ONE;

  if (isClosed(position)) {
    pool.openPositionCount -= INT_ONE;
    pool.closedPositionCount += INT_ONE;
    protocol.openPositionCount -= INT_ONE;
    position.hashClosed = event.transaction.hash;
    position.blockNumberClosed = event.block.number;
    position.timestampClosed = event.block.timestamp;
  }

  position.save();

  savePositionSnapshot(position, event);
}

export function handleTransfer(event: Transfer): void {
  const position = getOrCreatePosition(event, event.params.tokenId);

  // position was not able to be fetched
  if (position == null) {
    return;
  }

  position.account = event.params.to;
  position.save();
}

function isClosed(position: Position): boolean {
  return position.liquidity == BIGINT_ZERO;
}

function isReOpened(position: Position): boolean {
  if (position.hashClosed) {
    return true;
  }
  return false;
}
