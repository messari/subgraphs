import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { ChainlinkTruUsdcOracle } from "../../generated/templates/TruefiPool2/ChainlinkTruUsdcOracle";
import { ChainlinkTruUsdtOracle } from "../../generated/templates/TruefiPool2/ChainlinkTruUsdtOracle";
import { ChainlinkTruBusdOracle } from "../../generated/templates/TruefiPool2/ChainlinkTruBusdOracle";
import { ChainlinkTruTusdOracle } from "../../generated/templates/TruefiPool2/ChainlinkTruTusdOracle";
import { getTokenById } from "./token";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  STABLECOIN_USDT_ADDRESS,
  STABLECOIN_USDC_ADDRESS,
  STABLECOIN_BUSD_ADDRESS,
  STABLECOIN_TUSD_ADDRESS,
  TRU_USDC_ORACLE_ADDRESS,
  TRU_USDT_ORACLE_ADDRESS,
  TRU_BUSD_ORACLE_ADDRESS,
  TRU_TUSD_ORACLE_ADDRESS,
  BIGDECIMAL_ONE,
  BIGINT_ONE,
} from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getUsdPricePerToken } from "../prices/index";
import { DEFAULT_DECIMALS } from "../prices/common/constants";

export function amountInUSD(amount: BigInt, token: Token): BigDecimal {
  if (amount == BIGINT_ZERO) {
    return BIGDECIMAL_ZERO;
  }

  if (token.underlyingAsset) {
    return amountInUSD(amount, getTokenById(token.underlyingAsset!));
  }

  return bigIntToBigDecimal(amount, token.decimals).times(getTokenPrice(token));
}

export function getTokenPrice(token: Token): BigDecimal {
  if (token.id == STABLECOIN_USDC_ADDRESS) {
    return getUsdcPrice(token.decimals);
  } else if (token.id == STABLECOIN_USDT_ADDRESS) {
    return getUsdtPrice(token.decimals);
  } else if (token.id == STABLECOIN_BUSD_ADDRESS) {
    return getBusdPrice(token.decimals);
  } else if (token.id == STABLECOIN_TUSD_ADDRESS) {
    return getTusdPrice(token.decimals);
  }

  // Use external oracle to get non-stablecoin price as TrueFi doesn't provide oracle for them yet.
  let customPrice = getUsdPricePerToken(Address.fromString(token.id));
  let priceUSD = customPrice.usdPrice.div(customPrice.decimalsBaseTen);
  return priceUSD;
}

export function amountInUSDForTru(amount: BigInt, token: Token): BigDecimal {
  if (amount == BIGINT_ZERO) {
    return BIGDECIMAL_ZERO;
  }
  return bigIntToBigDecimal(amount, token.decimals).times(
    getTruPrice(token.decimals)
  );
}

function getTruPrice(decimals: i32): BigDecimal {
  const priceOracleAddress = Address.fromString(TRU_USDC_ORACLE_ADDRESS);
  const priceOracle = ChainlinkTruUsdcOracle.bind(priceOracleAddress);
  const tryGetLatestTruPrice = priceOracle.try_getLatestTruPrice();
  if (tryGetLatestTruPrice.reverted) {
    log.warning(
      "Failed to fetch latest Tru price, contract call reverted. Price oracle: {}",
      [priceOracleAddress.toHexString()]
    );
    return BIGDECIMAL_ZERO;
  }

  return bigIntToBigDecimal(tryGetLatestTruPrice.value, decimals);
}

function getUsdcPrice(decimals: i32): BigDecimal {
  const priceOracleAddress = Address.fromString(TRU_USDC_ORACLE_ADDRESS);
  const priceOracle = ChainlinkTruUsdcOracle.bind(priceOracleAddress);
  const tryTokenToUsd = priceOracle.try_tokenToUsd(BIGINT_ONE);
  if (tryTokenToUsd.reverted) {
    return BIGDECIMAL_ONE;
  }

  return bigIntToBigDecimal(
    tryTokenToUsd.value,
    DEFAULT_DECIMALS.toI32() - decimals
  );
}

function getUsdtPrice(decimals: i32): BigDecimal {
  const priceOracleAddress = Address.fromString(TRU_USDT_ORACLE_ADDRESS);
  const priceOracle = ChainlinkTruUsdtOracle.bind(priceOracleAddress);
  const tryTokenToUsd = priceOracle.try_tokenToUsd(BIGINT_ONE);
  if (tryTokenToUsd.reverted) {
    return BIGDECIMAL_ONE;
  }

  return bigIntToBigDecimal(
    tryTokenToUsd.value,
    DEFAULT_DECIMALS.toI32() - decimals
  );
}
function getBusdPrice(decimals: i32): BigDecimal {
  const priceOracleAddress = Address.fromString(TRU_BUSD_ORACLE_ADDRESS);
  const priceOracle = ChainlinkTruBusdOracle.bind(priceOracleAddress);
  const tryTokenToUsd = priceOracle.try_tokenToUsd(BIGINT_ONE);
  if (tryTokenToUsd.reverted) {
    return BIGDECIMAL_ONE;
  }

  return bigIntToBigDecimal(
    tryTokenToUsd.value,
    DEFAULT_DECIMALS.toI32() - decimals
  );
}

function getTusdPrice(decimals: i32): BigDecimal {
  const priceOracleAddress = Address.fromString(TRU_TUSD_ORACLE_ADDRESS);
  const priceOracle = ChainlinkTruTusdOracle.bind(priceOracleAddress);
  const tryTokenToUsd = priceOracle.try_tokenToUsd(BIGINT_ONE);
  if (tryTokenToUsd.reverted) {
    return BIGDECIMAL_ONE;
  }

  return bigIntToBigDecimal(
    tryTokenToUsd.value,
    DEFAULT_DECIMALS.toI32() - decimals
  );
}
