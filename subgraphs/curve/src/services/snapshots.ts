import { LiquidityPool, TokenSnapshot } from "../../generated/schema";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import {
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_1E8,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
  FOREX_ORACLES,
  FOREX_TOKENS,
  USDT_ADDRESS,
  WBTC_ADDRESS,
  SYNTH_TOKENS,
  WETH_ADDRESS,
} from "../common/constants/index";
import { CurvePool } from "../../generated/templates/CurvePoolTemplate/CurvePool";
import { ChainlinkAggregator } from "../../generated/templates/CurvePoolTemplateV2/ChainlinkAggregator";
import { CurvePoolV2 } from "../../generated/templates/RegistryTemplate/CurvePoolV2";
import { getUsdRate } from "../common/pricing";
import { BIGDECIMAL_ZERO, SNAPSHOT_SECONDS } from "../common/constants";
import { RedeemableKeep3r } from "../../generated/templates/CurvePoolTemplateV2/RedeemableKeep3r";
import { BIG_DECIMAL_1E6, RKP3R_ADDRESS } from "../common/constants/index";
import { getBalancerLpPriceUSD, isBalancerToken } from "../common/prices/balancer";
import { getCtokenPriceUSD, isCtoken } from "../common/prices/compound";
import { getIearnPriceUSD, getYearnTokenV2PriceUSD, isIearnToken, isYearnTokenV2 } from "../common/prices/yearn";
import { getAtokenPriceUSD, isAtoken } from "../common/prices/aave";
import { getIdleTokenPriceUSD, isIdleToken } from "../common/prices/idle";

function isKp3rToken(tokenAddr: Address): boolean {
  if (tokenAddr.equals(RKP3R_ADDRESS)) {
    return true;
  }
  return false;
}

function getRKp3rPrice(): BigDecimal {
  const RKp3rContract = RedeemableKeep3r.bind(RKP3R_ADDRESS);
  const discount = RKp3rContract.discount();
  const priceResult = RKp3rContract.try_price();
  if (priceResult.reverted) {
    return BIG_DECIMAL_ZERO;
  }
  return priceResult.value.times(discount).div(BigInt.fromI32(100)).toBigDecimal().div(BIG_DECIMAL_1E6);
}

export function getForexUsdRate(token: string): BigDecimal {
  // returns the amount of USD 1 unit of the foreign currency is worth
  const priceOracle = ChainlinkAggregator.bind(FOREX_ORACLES.get(token));
  const conversionRateReponse = priceOracle.try_latestAnswer();
  const conversionRate = conversionRateReponse.reverted
    ? BIG_DECIMAL_ONE
    : conversionRateReponse.value.toBigDecimal().div(BIG_DECIMAL_1E8);
  log.debug("Answer from Forex oracle {} for token {}: {}", [
    FOREX_ORACLES.get(token).toHexString(),
    token,
    conversionRate.toString(),
  ]);

  return conversionRate;
}

export function getTokenPriceSnapshot(tokenAddr: Address, timestamp: BigInt, forex: boolean): BigDecimal {
  let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(tokenAddr, timestamp));
  if (tokenSnapshot) {
    return tokenSnapshot.price;
  }
  if (isKp3rToken(tokenAddr)) {
    // kp3r token
    return getRKp3rPrice();
  }
  if (isBalancerToken(tokenAddr)) {
    // balancer
    return getBalancerLpPriceUSD(tokenAddr, timestamp);
  }
  if (isCtoken(tokenAddr)) {
    // ctoken
    return getCtokenPriceUSD(tokenAddr, timestamp);
  }
  if (isIearnToken(tokenAddr)) {
    // yearn v1
    return getIearnPriceUSD(tokenAddr, timestamp);
  }
  if (isAtoken(tokenAddr)) {
    // aave
    return getAtokenPriceUSD(tokenAddr, timestamp);
  }
  if (isYearnTokenV2(tokenAddr)) {
    return getYearnTokenV2PriceUSD(tokenAddr, timestamp);
  }
  if (isIdleToken(tokenAddr)){
    return getIdleTokenPriceUSD(tokenAddr,timestamp);
  }
  tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(tokenAddr, timestamp));
  let priceUSD = BIGDECIMAL_ZERO;
  if (forex) {
    priceUSD = getForexUsdRate(tokenAddr.toHexString());
  } else {
    priceUSD = getUsdRate(tokenAddr);
  }
  tokenSnapshot.price = priceUSD;
  tokenSnapshot.save();
  return priceUSD;
}

export function getStableCryptoTokenPrice(pool: LiquidityPool, timestamp: BigInt): BigDecimal {
  // we use this for stable crypto pools where one assets may not be traded
  // outside of curve. we just try to get a price out of one of the assets traded
  // and use that
  let price = BIG_DECIMAL_ZERO;
  for (let i = 0; i < pool.inputTokens.length; ++i) {
    let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(Address.fromString(pool.inputTokens[i]), timestamp));
    if (tokenSnapshot) {
      return tokenSnapshot.price;
    }
    tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(Address.fromString(pool.inputTokens[i]), timestamp));
    price = getUsdRate(Address.fromString(pool.inputTokens[i]));
    if (price != BIG_DECIMAL_ZERO) {
      tokenSnapshot.price = price;
      tokenSnapshot.save();
      break;
    }
  }
  return price;
}

export function getCryptoTokenPrice(tokenAddr: Address, timestamp: BigInt, pool: LiquidityPool): BigDecimal {
  let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(tokenAddr, timestamp));
  if (tokenSnapshot) {
    return tokenSnapshot.price;
  }
  tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(tokenAddr, timestamp));
  let price = FOREX_TOKENS.includes(tokenAddr.toHexString())
    ? getForexUsdRate(tokenAddr.toHexString())
    : getUsdRate(tokenAddr);
  if (price == BIG_DECIMAL_ZERO && SYNTH_TOKENS.has(tokenAddr.toHexString())) {
    log.warning("Invalid price found for {}", [tokenAddr.toHexString()]);
    price = getUsdRate(SYNTH_TOKENS.get(tokenAddr.toHexString()));
    const poolContract = CurvePoolV2.bind(Address.fromString(pool.id));
    const priceOracleResult = poolContract.try_price_oracle();
    if (!priceOracleResult.reverted) {
      price = price.times(priceOracleResult.value.toBigDecimal().div(BIG_DECIMAL_1E18));
    } else {
      log.warning("Price oracle reverted {}", [tokenAddr.toHexString()]);
    }
  }
  tokenSnapshot.price = price;
  tokenSnapshot.save();
  return price;
}

export function getPoolAssetPrice(pool: LiquidityPool, timestamp: BigInt): BigDecimal {
  if (FOREX_ORACLES.has(pool.id)) {
    return getTokenPriceSnapshot(Address.fromString(pool.outputToken), timestamp, true);
  } else if (pool.assetType == 1) {
    return getTokenPriceSnapshot(WETH_ADDRESS, timestamp, false);
  } else if (pool.assetType == 2) {
    return getTokenPriceSnapshot(WBTC_ADDRESS, timestamp, false);
  } else if (pool.assetType == 0) {
    return getTokenPriceSnapshot(USDT_ADDRESS, timestamp, false);
  } else {
    return getStableCryptoTokenPrice(pool, timestamp);
  }
}

export function getLpTokenPriceUSD(pool: LiquidityPool, timestamp: BigInt): BigDecimal {
  let tokenSnapshot = TokenSnapshot.load(createTokenSnapshotID(Address.fromString(pool.id), timestamp));
  if (tokenSnapshot) {
    return tokenSnapshot.price;
  }
  tokenSnapshot = new TokenSnapshot(createTokenSnapshotID(Address.fromString(pool.id), timestamp));
  let curvePool = CurvePool.bind(Address.fromString(pool.id));
  let assetPriceUSD = getPoolAssetPrice(pool, timestamp);
  let virtualPrice = curvePool.try_get_virtual_price();
  if (virtualPrice.reverted) {
    tokenSnapshot.price = assetPriceUSD;
    tokenSnapshot.save();
    return assetPriceUSD;
  }
  let price = assetPriceUSD.times(virtualPrice.value.toBigDecimal().div(BIG_DECIMAL_1E18));
  tokenSnapshot.price = price;
  tokenSnapshot.save();
  return price;
}

export function createTokenSnapshotID(tokenAddr: Address, timestamp: BigInt): string {
  return tokenAddr.toHexString() + "-" + timestamp.div(BigInt.fromI32(SNAPSHOT_SECONDS)).toString();
}

export function getTokenPrice(token: Address, pool: LiquidityPool, timestamp: BigInt): BigDecimal {
  if (!pool.isV2) {
    const latestPrice = getTokenPriceSnapshot(token, timestamp, FOREX_TOKENS.includes(token.toHexString()));
    return latestPrice;
  }
  return getCryptoTokenPrice(token, timestamp, pool);
}
