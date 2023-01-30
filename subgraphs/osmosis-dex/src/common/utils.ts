import { BigInt, ethereum, BigDecimal, cosmos } from "@graphprotocol/graph-ts";
import {
  LiquidityPool as LiquidityPoolStore,
  _TokenPrice,
} from "../../generated/schema";
import { MsgPoolParams } from "../modules/Decoder";
import { PoolFeesType } from "./types";
import {
  getOrCreateToken,
  getOrCreateDexAmmProtocol,
  getOrCreateLiquidityPoolFee,
} from "./initializer";
import * as constants from "../common/constants";
import * as utils from "../common/utils";

export function bigDecimalToBigInt(n: BigDecimal): BigInt {
  return BigInt.fromString(n.toString().split(".")[0]);
}

export function enumToPrefix(snake: string): string {
  return snake.toLowerCase().replace("_", "-") + "-";
}

export function prefixID(enumString: string, ID: string): string {
  return enumToPrefix(enumString) + ID;
}

export function readValue<T>(
  callResult: ethereum.CallResult<T>,
  defaultValue: T
): T {
  return callResult.reverted ? defaultValue : callResult.value;
}

export function calculateAverage(items: BigDecimal[]): BigDecimal {
  let sum = BigDecimal.fromString("0");
  for (let i = 0; i < items.length; i++) {
    sum = sum.plus(items[i]);
  }

  return sum.div(
    BigDecimal.fromString(BigInt.fromI32(items.length).toString())
  );
}

export function updatePoolTVL(
  liquidityPool: LiquidityPoolStore,
  block: cosmos.HeaderOnlyBlock
): bool {
  const index = updateBaseTokenPrice(liquidityPool, block) as i32;
  if (index < 0) {
    return false;
  }

  const inputTokens = liquidityPool.inputTokens;
  const token = getOrCreateToken(inputTokens[index]);
  let lastPrice = constants.BIGDECIMAL_ZERO;
  if (token.lastPriceUSD !== null) {
    lastPrice = token.lastPriceUSD!;
  }

  const inputTokenBalances = liquidityPool.inputTokenBalances;
  const inputTokenWeights = liquidityPool.inputTokenWeights;
  const amountUSD = utils
    .convertTokenToDecimal(inputTokenBalances[index], token.decimals)
    .times(lastPrice);
  liquidityPool.totalValueLockedUSD = amountUSD
    .times(constants.BIGDECIMAL_HUNDRED)
    .div(inputTokenWeights[index]);
  liquidityPool.save();

  return true;
}

function updateBaseTokenPrice(
  liquidityPool: LiquidityPoolStore,
  block: cosmos.HeaderOnlyBlock
): number {
  const inputTokens = liquidityPool.inputTokens;
  let stableCoinIndex = -1;
  let osmoIndex = -1;
  let atomIndex = -1;
  for (let i = 0; i < inputTokens.length; i++) {
    const tmpToken = getOrCreateToken(inputTokens[i]);
    if (tmpToken._isStableCoin) {
      stableCoinIndex = i;
      break;
    } else if (tmpToken.id == constants.ATOM_DENOM) {
      atomIndex = i;
    } else if (tmpToken.id == constants.OSMO_DENOM) {
      osmoIndex = i;
    }
  }

  if (stableCoinIndex < 0 && osmoIndex < 0 && atomIndex < 0) {
    return -1;
  }

  const id = (block.header.time.seconds / constants.SECONDS_PER_DAY).toString();
  let index = -1;
  if (stableCoinIndex >= 0) {
    index = stableCoinIndex;
  } else if (atomIndex >= 0) {
    index = atomIndex;
  } else if (osmoIndex >= 0) {
    index = osmoIndex;
  }

  const token = getOrCreateToken(inputTokens[index]);
  if (
    stableCoinIndex < 0 &&
    block.header.height < (constants.STABLE_COIN_START_BLOCK as u64) &&
    (!token._lastPriceDate || token._lastPriceDate != id)
  ) {
    // Load price retrieved from offchain data source
    const tokenPrice = _TokenPrice.load(id);
    if (tokenPrice != null) {
      if (token.id == constants.ATOM_DENOM) {
        token.lastPriceUSD = tokenPrice.cosmos;
      } else if (token.id == constants.OSMO_DENOM) {
        token.lastPriceUSD = tokenPrice.osmosis;
      }
    }
    token.lastPriceBlockNumber = BigInt.fromI32(block.header.height as i32);
    token._lastPriceDate = id;
    token.save();
  }

  return index;
}

export function getPoolFees(
  liquidityPoolId: string,
  poolParams: MsgPoolParams | null
): PoolFeesType {
  let swapFee = constants.BIGDECIMAL_ZERO;
  if (poolParams != null && poolParams.swapFee !== null) {
    swapFee = poolParams.swapFee
      .div(constants.BIGINT_TEN.pow(18).toBigDecimal())
      .times(constants.BIGDECIMAL_HUNDRED);
  }
  const tradingFeeId =
    utils.enumToPrefix(constants.LiquidityPoolFeeType.FIXED_TRADING_FEE) +
    liquidityPoolId;
  const tradingFee = getOrCreateLiquidityPoolFee(
    tradingFeeId,
    constants.LiquidityPoolFeeType.FIXED_TRADING_FEE,
    swapFee
  );

  let protocolFees = constants.BIGDECIMAL_ZERO;
  if (poolParams != null && poolParams.exitFee !== null) {
    protocolFees = poolParams.exitFee
      .div(constants.BIGINT_TEN.pow(18).toBigDecimal())
      .times(constants.BIGDECIMAL_HUNDRED);
  }

  const protocolFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE) +
    liquidityPoolId;
  const protocolFee = getOrCreateLiquidityPoolFee(
    protocolFeeId,
    constants.LiquidityPoolFeeType.FIXED_PROTOCOL_FEE,
    protocolFees
  );

  const lpFeeId =
    enumToPrefix(constants.LiquidityPoolFeeType.FIXED_LP_FEE) + liquidityPoolId;
  const lpFee = getOrCreateLiquidityPoolFee(
    lpFeeId,
    constants.LiquidityPoolFeeType.FIXED_LP_FEE,
    swapFee
  );

  return new PoolFeesType(tradingFee, protocolFee, lpFee);
}

export function updateProtocolTotalValueLockedUSD(tvlChange: BigDecimal): void {
  const protocol = getOrCreateDexAmmProtocol();
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(tvlChange);
  protocol.save();
}

export function updateProtocolAfterNewLiquidityPool(
  tvlChange: BigDecimal
): void {
  const protocol = getOrCreateDexAmmProtocol();
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(tvlChange);
  protocol.totalPoolCount += 1;
  protocol.save();
}

// Round BigDecimal to whole number
export function roundToWholeNumber(n: BigDecimal): BigDecimal {
  return n.truncate(0);
}

// convert emitted values to tokens count
export function convertTokenToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: i32
): BigDecimal {
  if (exchangeDecimals == 0) {
    return tokenAmount.toBigDecimal();
  }

  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
}

// convert decimals
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = constants.BIGDECIMAL_ONE;
  for (
    let i = constants.INT_ZERO;
    i < (decimals as i32);
    i = i + constants.INT_ONE
  ) {
    bd = bd.times(constants.BIGDECIMAL_TEN);
  }
  return bd;
}
