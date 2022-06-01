import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { PancakeFactory } from "../../../generated/Factory/PancakeFactory";
import { Pair } from "../../../generated/Factory/Pair";
import { ERC20 } from "../../../generated/factory/ERC20";
import { exponentToBigDecimal } from "../utils/numbers";
import {
  ADDRESS_ZERO,
  BBTC_ADDRESS,
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  BIG_DECIMAL_1E18,
  BUSD_ADDRESS,
  PANCAKE_FACTORY_ADDRESS,
  SIDECHAIN_SUBSTITUTES,
  USDC_ADDRESS,
  WBNB_ADDRESS,
  ZERO_ADDRESS,
} from "../constants";

export function getEthRate(token: Address): BigDecimal {
  let eth = BIGDECIMAL_ONE;

  if (token != WBNB_ADDRESS) {
    let factory = PancakeFactory.bind(PANCAKE_FACTORY_ADDRESS);
    let addressCall = factory.try_getPair(token, WBNB_ADDRESS);
    let address = ADDRESS_ZERO;
    if (!addressCall.reverted) {
      address = addressCall.value;
    }

    const pair = Pair.bind(address);

    const reservesCall = pair.try_getReserves();
    if (reservesCall.reverted) {
      return eth;
    }
    const reserves = reservesCall.value;
    if (reserves.value1 == BIGINT_ZERO || reserves.value0 == BIGINT_ZERO) {
      return eth;
    }

    eth =
      pair.token0() == WBNB_ADDRESS
        ? reserves.value0.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value1.toBigDecimal())
        : reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value0.toBigDecimal());

    return eth.div(BIG_DECIMAL_1E18);
  }

  return eth;
}

export function getDecimals(token: Address): BigInt {
  const tokenContract = ERC20.bind(token);
  const decimalsResult = tokenContract.try_decimals();
  return decimalsResult.reverted ? BigInt.fromI32(18) : BigInt.fromI32(decimalsResult.value);
}

// Computes the value of one unit of Token A in units of Token B
// Only works if both tokens have an ETH pair on Sushi
export function getTokenAValueInTokenB(tokenA: Address, tokenB: Address): BigDecimal {
  if (tokenA == tokenB) {
    return BIGDECIMAL_ONE;
  }
  const decimalsA = getDecimals(tokenA);
  const decimalsB = getDecimals(tokenB);
  const ethRateA = getEthRate(tokenA).times(BIG_DECIMAL_1E18);
  const ethRateB = getEthRate(tokenB).times(BIG_DECIMAL_1E18);
  if (ethRateB == BIGDECIMAL_ZERO) {
    log.error("Error calculating rate for token A {} ({}) and token B {} ({})", [
      tokenA.toHexString(),
      ethRateA.toString(),
      tokenB.toHexString(),
      ethRateB.toString(),
    ]);
  }
  return ethRateA
    .div(ethRateB)
    .times(exponentToBigDecimal(decimalsA.toI32()))
    .div(exponentToBigDecimal(decimalsB.toI32()));
}

export function getUsdRate(token: Address): BigDecimal {
  const usd = BIGDECIMAL_ONE;
  if (SIDECHAIN_SUBSTITUTES.has(token.toHexString())) {
    token = SIDECHAIN_SUBSTITUTES.get(token.toHexString());
  }
  if (token != BUSD_ADDRESS && token != USDC_ADDRESS) {
    return getTokenAValueInTokenB(token, BUSD_ADDRESS);
  }
  return usd;
}

export function getBtcRate(token: Address): BigDecimal {
  const wbtc = BIGDECIMAL_ONE;

  if (token != BBTC_ADDRESS) {
    return getTokenAValueInTokenB(token, BBTC_ADDRESS);
  }

  return wbtc;
}
