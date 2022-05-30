import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
  BIG_INT_ZERO,
  SIDECHAIN_SUBSTITUTES,
  SUSHI_FACTORY_ADDRESS,
  THREE_CRV_ADDRESS,
  UNI_FACTORY_ADDRESS,
  UNI_V3_FACTORY_ADDRESS,
  UNI_V3_QUOTER_ADDRESS,
  USDT_ADDRESS,
  WBTC_ADDRESS,
  WETH_ADDRESS,
} from "./constants/index";
import { Factory } from "../../generated/templates/CurvePoolTemplateV2/Factory";
import { Pair } from "../../generated/templates/CurvePoolTemplateV2/Pair";
import { FactoryV3 } from "../../generated/templates/CurvePoolTemplateV2/FactoryV3";
import { Quoter } from "../../generated/templates/CurvePoolTemplateV2/Quoter";
import { ERC20 } from "../../generated/templates/CurvePoolTemplateV2/ERC20";
import { exponentToBigDecimal, exponentToBigInt } from "./utils/numbers";

export function getEthRate(token: Address): BigDecimal {
  let eth = BIG_DECIMAL_ONE;

  if (token != WETH_ADDRESS) {
    let factory = Factory.bind(SUSHI_FACTORY_ADDRESS);
    let addressCall = factory.try_getPair(token, WETH_ADDRESS);
    let address = ADDRESS_ZERO;
    if (!addressCall.reverted) {
      address = addressCall.value;
    }
    if (address == ADDRESS_ZERO) {
      // if no pair on sushi, we try uni v2
      log.debug("No sushi pair found for {}", [token.toHexString()]);
      factory = Factory.bind(UNI_FACTORY_ADDRESS);
      addressCall = factory.try_getPair(token, WETH_ADDRESS);
      if (!addressCall.reverted) {
        address = addressCall.value;
      }
      // if no pair on v2 either we try uni v3
      if (address == ADDRESS_ZERO) {
        log.debug("No Uni v2 pair found for {}", [token.toHexString()]);
        return getEthRateUniV3(token);
      }
    }

    const pair = Pair.bind(address);

    const reservesCall = pair.try_getReserves();
    if (reservesCall.reverted) {
      return eth;
    }
    const reserves = reservesCall.value;
    if (reserves.value1 == BIG_INT_ZERO || reserves.value0 == BIG_INT_ZERO) {
      return eth;
    }

    eth =
      pair.token0() == WETH_ADDRESS
        ? reserves.value0.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value1.toBigDecimal())
        : reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value0.toBigDecimal());

    return eth.div(BIG_DECIMAL_1E18);
  }

  return eth;
}

export function getEthRateUniV3(token: Address): BigDecimal {
  const factory = FactoryV3.bind(UNI_V3_FACTORY_ADDRESS);
  let fee = 3000;
  // first try the 0.3% pool
  let poolCall = factory.try_getPool(token, WETH_ADDRESS, fee);
  if (poolCall.reverted || poolCall.value == ADDRESS_ZERO) {
    log.debug("No Uni v3 pair (.3%) found for {}", [token.toHexString()]);
    // if it fails, try 1%
    fee = 10000;
    poolCall = factory.try_getPool(token, WETH_ADDRESS, fee);
    if (poolCall.reverted || poolCall.value == ADDRESS_ZERO) {
      log.debug("No Uni v3 pair (1%) found for {}", [token.toHexString()]);
      return BIG_DECIMAL_ZERO;
    }
  }
  const quoter = Quoter.bind(UNI_V3_QUOTER_ADDRESS);
  const decimals = getDecimals(token);
  const rate = quoter.try_quoteExactInputSingle(
    token,
    WETH_ADDRESS,
    fee,
    exponentToBigInt(decimals.toI32()),
    BIG_INT_ZERO,
  );
  if (!rate.reverted) {
    log.debug("Rate for {}: {}", [token.toHexString(), rate.value.toString()]);
    return rate.value.toBigDecimal().div(exponentToBigDecimal(decimals.toI32()));
  }
  log.error("Error getting a quote for {} at fee {}", [token.toHexString(), fee.toString()]);
  return BIG_DECIMAL_ZERO;
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
    return BIG_DECIMAL_ONE;
  }
  const decimalsA = getDecimals(tokenA);
  const decimalsB = getDecimals(tokenB);
  const ethRateA = getEthRate(tokenA).times(BIG_DECIMAL_1E18);
  const ethRateB = getEthRate(tokenB).times(BIG_DECIMAL_1E18);
  if (ethRateB == BIG_DECIMAL_ZERO) {
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
  const usdt = BIG_DECIMAL_ONE;
  if (SIDECHAIN_SUBSTITUTES.has(token.toHexString())) {
    token = SIDECHAIN_SUBSTITUTES.get(token.toHexString());
  }
  if (token != USDT_ADDRESS && token != THREE_CRV_ADDRESS) {
    return getTokenAValueInTokenB(token, USDT_ADDRESS);
  }
  return usdt;
}

export function getBtcRate(token: Address): BigDecimal {
  const wbtc = BIG_DECIMAL_ONE;

  if (token != WBTC_ADDRESS) {
    return getTokenAValueInTokenB(token, WBTC_ADDRESS);
  }

  return wbtc;
}
