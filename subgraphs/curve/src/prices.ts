import { Address, BigDecimal, BigInt, bigInt, log } from "@graphprotocol/graph-ts";
import { SushiSwapRouter } from "../generated/MainRegistry/SushiSwapRouter";
import { LiquidityPool } from "../generated/schema";
import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO, BIGINT_ZERO, DEFAULT_DECIMALS, ZERO_ADDRESS } from "./common/constants";
import { getOrCreateToken } from "./common/getters";
import {
  bigIntToBigDecimal,
  divBigDecimal,
  divBigInt,
  exponentToBigDecimal,
  exponentToBigInt,
} from "./common/utils/numbers";
import * as constants from "./prices/common/constants";
import { UniswapFactory as Factory } from "../generated/MainRegistry/UniswapFactory";
import { UniswapFactoryV3 } from "../generated/MainRegistry/UniswapFactoryV3";
import { Quoter } from "../generated/MainRegistry/Quoter";
import { UniswapPair } from "../generated/MainRegistry/UniswapPair";
import { RedeemableKeep3r } from "../generated/MainRegistry/RedeemableKeep3r";

export function getFactoryAddress(network: string, protocol: string): Address {
  if (protocol == "sushi") {
    return SushiSwapRouter.bind(constants.SUSHISWAP_ROUTER_ADDRESSES.get(network)!).factory();
  }
  return SushiSwapRouter.bind(constants.UNISWAP_CONTRACT_ADDRESSES.get(network)!).factory();
}

export function getEthRateUniV3(tokenAddr: Address, network: string): BigDecimal {
  const factory = UniswapFactoryV3.bind(constants.UNI_V3_FACTORY_ADDRESS);
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);
  const WETH_ADDRESS = tokensMapping!.get("WETH")!;

  let fee = 3000;
  // first try the 0.3% pool
  let poolCall = factory.try_getPool(tokenAddr, WETH_ADDRESS, fee);
  if (poolCall.reverted || poolCall.value == Address.fromString(ZERO_ADDRESS)) {
    log.debug("No Uni v3 pair (.3%) found for {}", [tokenAddr.toHexString()]);
    // if it fails, try 1%
    fee = 10000;
    poolCall = factory.try_getPool(tokenAddr, WETH_ADDRESS, fee);
    if (poolCall.reverted || poolCall.value == Address.fromString(ZERO_ADDRESS)) {
      log.debug("No Uni v3 pair (1%) found for {}", [tokenAddr.toHexString()]);
      return constants.BIGDECIMAL_ZERO;
    }
  }
  const quoter = Quoter.bind(constants.UNI_V3_QUOTER);
  const decimals = getOrCreateToken(tokenAddr).decimals;
  const rate = quoter.try_quoteExactInputSingle(
    tokenAddr,
    WETH_ADDRESS,
    fee,
    exponentToBigInt(BigInt.fromI32(decimals)),
    BIGINT_ZERO,
  );
  if (!rate.reverted) {
    log.debug("Rate for {}: {}", [tokenAddr.toHexString(), rate.value.toString()]);
    return divBigDecimal(rate.value.toBigDecimal(), exponentToBigDecimal(decimals));
  }
  log.error("Error getting a quote for {} at fee {}", [tokenAddr.toHexString(), fee.toString()]);
  return BIGDECIMAL_ZERO;
}

export function getEthRate(tokenAddr: Address, network: string): BigDecimal {
  let eth = BIGDECIMAL_ONE;
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);
  const WETH_ADDRESS = tokensMapping!.get("WETH")!;
  if (tokenAddr != WETH_ADDRESS) {
    let SUSHI_FACTORY_ADDRESS = getFactoryAddress(network, "SUSHI");
    let factory = Factory.bind(SUSHI_FACTORY_ADDRESS);
    let address = factory.getPair(tokenAddr, WETH_ADDRESS);

    if (address == Address.fromString(ZERO_ADDRESS)) {
      // if no pair on sushi, we try uni v2
      log.debug("No sushi pair found for {}", [tokenAddr.toHexString()]);
      let UNI_FACTORY_ADDRESS = getFactoryAddress(network, "uni");
      factory = Factory.bind(UNI_FACTORY_ADDRESS);
      address = factory.getPair(tokenAddr, WETH_ADDRESS);

      // if no pair on v2 either we try uni v3
      if (address == Address.fromString(ZERO_ADDRESS)) {
        log.debug("No Uni v2 pair found for {}", [tokenAddr.toHexString()]);
        return getEthRateUniV3(tokenAddr, network);
      }
    }

    const pair = UniswapPair.bind(address);

    const reserves = pair.getReserves();

    eth =
      pair.token0() == WETH_ADDRESS
        ? divBigDecimal(
            reserves.value0.toBigDecimal().times(constants.BIG_DECIMAL_1E18),
            reserves.value1.toBigDecimal(),
          )
        : divBigDecimal(
            reserves.value1.toBigDecimal().times(constants.BIG_DECIMAL_1E18),
            reserves.value0.toBigDecimal(),
          );

    return eth.div(constants.BIG_DECIMAL_1E18);
  }

  return eth;
}

export function getBtcRate(token: Address, network: string): BigDecimal {
  const wbtc = BIGDECIMAL_ONE;
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);
  const WBTC_ADDRESS = tokensMapping!.get("WBTC")!;
  if (token != WBTC_ADDRESS) {
    return getTokenAValueInTokenB(token, WBTC_ADDRESS, network);
  }
  return wbtc;
}

function getRKp3rPrice(): BigDecimal {
  const RKp3rContract = RedeemableKeep3r.bind(constants.RKP3R_ADDRESS);
  const discount = RKp3rContract.discount();
  const priceResult = RKp3rContract.try_price();
  if (priceResult.reverted) {
    return BIGDECIMAL_ZERO;
  }

  return divBigDecimal(
    divBigInt(priceResult.value.times(discount), BigInt.fromI32(100)).toBigDecimal(),
    constants.BIG_DECIMAL_1E6,
  );
}

export function getTokenAValueInTokenB(tokenA: Address, tokenB: Address, network: string): BigDecimal {
  if (tokenA == tokenB) {
    return BIGDECIMAL_ONE;
  }
  const decimalsA = getOrCreateToken(tokenA).decimals;
  const decimalsB = getOrCreateToken(tokenB).decimals;
  const ethRateA = BigInt.fromString(
    getEthRate(tokenA, network)
      .times(constants.BIG_DECIMAL_1E18)
      .toString(),
  );
  const ethRateB = BigInt.fromString(
    getEthRate(tokenB, network)
      .times(constants.BIG_DECIMAL_1E18)
      .toString(),
  );
  return divBigDecimal(bigIntToBigDecimal(ethRateA, decimalsA), bigIntToBigDecimal(ethRateB, decimalsB));
}

export function getUsdRate(tokenAddr: Address, network: string): BigDecimal {
  const usdt = BIGDECIMAL_ONE;
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);
  const USDT_ADDRESS = tokensMapping!.get("USDT")!;
  const THREE_CRV_ADDRESS = tokensMapping!.get("3CRV")!;
  if (tokenAddr != USDT_ADDRESS && tokenAddr != THREE_CRV_ADDRESS) {
    return getTokenAValueInTokenB(tokenAddr, USDT_ADDRESS, network);
  }
  return usdt;
}

export function getTokenValueInLpUnderlyingToken(tokenAddr: Address, lpToken: Address, network: string): BigDecimal {
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);
  if (lpToken == constants.LINK_LP_TOKEN_ADDRESS) {
    const LINK_ADDRESS = tokensMapping!.get("LINK")!;
    return getTokenAValueInTokenB(tokenAddr, LINK_ADDRESS, network);
  } else if (lpToken == Address.fromString(constants.CVX_CRV_LP_TOKEN)) {
    const CRV_ADDRESS = tokensMapping!.get("CRV")!;
    return getTokenAValueInTokenB(tokenAddr, CRV_ADDRESS, network);
  }
  return BIGDECIMAL_ONE;
}

export function getTokenPriceForAssetType(tokenAddr: Address, pool: LiquidityPool, network: string): BigDecimal {
  let tokensMapping = constants.WHITELIST_TOKENS_MAP.get(network);
  const RKP3R_ADDRESS = tokensMapping!.get("RKP3R")!;
  if (tokenAddr == RKP3R_ADDRESS) {
    return getRKp3rPrice();
  }
  if (pool.assetType == 0 || pool.assetType == 4) {
    // USD
    return getUsdRate(tokenAddr, network);
  } else if (pool.assetType == 1) {
    // ETH
    return getEthRate(tokenAddr, network);
  } else if (pool.assetType == 2) {
    // BTC
    return getBtcRate(tokenAddr, network);
  } else {
    // Other
    return getTokenValueInLpUnderlyingToken(tokenAddr, Address.fromString(pool.outputToken), network);
  }
}
