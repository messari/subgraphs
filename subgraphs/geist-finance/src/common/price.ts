import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { Token, _PoolAddressesProvider } from "../../generated/schema";
import { AaveOracle } from "../../generated/templates/LendingPool/AaveOracle";
import { SpookySwapGEISTFTM } from "../../generated/templates/LendingPool/SpookySwapGEISTFTM";

import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "./utils/constants";

import * as addresses from "./utils/addresses";
import { bigIntToBigDecimal } from "./utils/numbers";
import { getTokenById } from "./token";

export function setPriceOracleAddress(
  poolAddressesProviderAddress: Address,
  priceOracleAddress: Address
): void {
  const poolAddressesProvider = new _PoolAddressesProvider(
    poolAddressesProviderAddress.toHexString()
  );
  const priceOracle = AaveOracle.bind(priceOracleAddress);
  poolAddressesProvider.priceOracleAddress = priceOracleAddress.toHexString();
  poolAddressesProvider.priceOracleCurrency = "USD";
  poolAddressesProvider.priceOracleDecimals = 18;
  poolAddressesProvider.save();
}

export function amountInUSD(amount: BigInt, token: Token): BigDecimal {
  if (amount == BIGINT_ZERO) {
    return BIGDECIMAL_ZERO;
  }
  if (token.underlyingAsset) {
    return amountInUSD(amount, getTokenById(token.underlyingAsset!));
  }
  return bigIntToBigDecimal(amount, token.decimals).times(
    getAssetPrice(Address.fromString(token.id))
  );
}

export function getAssetPrice(tokenAddress: Address): BigDecimal {
  const oracle = AaveOracle.bind(addresses.PRICE_ORACLE_ADDRESS);
  // The GEIST oracle returns prices in USD, however this only works for specific tokens
  // for other tokens, this must be converted.

  let assetPrice: BigDecimal = BIGDECIMAL_ZERO;
  let tryPriceUSDC = oracle.try_getAssetPrice(addresses.TOKEN_ADDRESS_USDC);
  let priceUSDC: BigDecimal = BIGDECIMAL_ZERO;

  if (!tryPriceUSDC.reverted) {
    priceUSDC = new BigDecimal(tryPriceUSDC.value);
  } else {
    log.error(
      "Unable to get price of USDC from oracle. Setting assetPrice={}",
      [assetPrice.toString()]
    );
    return assetPrice;
  }

  if (tokenAddress == addresses.TOKEN_ADDRESS_GEIST) {
    /* 
        For the GEIST token, the price is derived from the
        ratio of FTM-GEIST reserves on SpookySwap multiplied by
        the price of WFTM from the oracle
      */
    let geistFtmLP = SpookySwapGEISTFTM.bind(addresses.GEIST_FTM_LP_ADDRESS);

    let reserves = geistFtmLP.try_getReserves();

    if (reserves.reverted) {
      log.error("Unable to get reserves for GEIST-FTM, setting assetPrice={}", [
        assetPrice.toString(),
      ]);
      return assetPrice;
    }
    let reserveFTM = reserves.value.value0;
    let reserveGEIST = reserves.value.value1;

    let priceGEISTinFTM = reserveFTM.div(reserveGEIST);
    let priceFTMinUSD = oracle.getAssetPrice(addresses.TOKEN_ADDRESS_WFTM);
    assetPrice = bigIntToBigDecimal(priceGEISTinFTM.times(priceFTMinUSD), 18);

    // log.info(
    //     "SpookySwap LP: reserveFTM={}, reserveGEIST={}, priceGEISTinFTM={}, priceFTMinUSD={}, priceGEISTinUSD={}",
    //     [
    //         reserveFTM.toString(),
    //         reserveGEIST.toString(),
    //         priceGEISTinFTM.toString(),
    //         priceFTMinUSD.toString(),
    //         assetPrice.toString()
    //     ]
    // )
  } else {
    // For other tokens get price from oracle
    // Map prices of gTokens to non-gTokens to get price from oracle
    // TODO: Maybe a dict would be a cleaner mapping
    if (tokenAddress == addresses.TOKEN_ADDRESS_gWBTC) {
      tokenAddress = addresses.TOKEN_ADDRESS_BTC;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gfUSDT) {
      tokenAddress = addresses.TOKEN_ADDRESS_fUSDT;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gUSDC) {
      tokenAddress = addresses.TOKEN_ADDRESS_USDC;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gDAI) {
      tokenAddress = addresses.TOKEN_ADDRESS_DAI;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gMIM) {
      tokenAddress = addresses.TOKEN_ADDRESS_MIM;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gLINK) {
      tokenAddress = addresses.TOKEN_ADDRESS_LINK;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gCRV) {
      tokenAddress = addresses.TOKEN_ADDRESS_CRV;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gETH) {
      tokenAddress = addresses.TOKEN_ADDRESS_ETH;
    } else if (tokenAddress == addresses.TOKEN_ADDRESS_gFTM) {
      tokenAddress = addresses.TOKEN_ADDRESS_WFTM;
    }

    const tryAssetPriceInUSD = oracle.try_getAssetPrice(tokenAddress);

    if (!tryAssetPriceInUSD.reverted) {
      assetPrice = new BigDecimal(tryAssetPriceInUSD.value);
    } else {
      log.error("Unable to get USD price for token address={}", [
        tokenAddress.toHexString(),
      ]);
    }
  }

  let assetPriceInUSDC = assetPrice.div(priceUSDC);
  log.info("Price for token address={} is {} USDC", [
    tokenAddress.toHexString(),
    assetPriceInUSDC.toString(),
  ]);
  return assetPriceInUSDC.truncate(3);
}
