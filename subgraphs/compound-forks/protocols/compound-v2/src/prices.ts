// compound's price oracle price getter
import {
  COMPTROLLER_ADDRESS,
  PRICE_ORACLE1_ADDRESS,
  USDC_ADDRESS,
  CETH_ADDRESS,
  CUSDC_ADDRESS,
  CUSDT_ADDRESS,
  CTUSD_ADDRESS,
  USDC_DECIMALS,
} from "./constants";
import { Token, LendingProtocol, Market } from "../../../generated/schema";
import { Address, BigDecimal, log } from "@graphprotocol/graph-ts";
import { PriceOracle2 } from "../../../generated/Comptroller/PriceOracle2";
import { PriceOracle1 } from "../../../generated/Comptroller/PriceOracle1";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  exponentToBigDecimal,
} from "../../../src/constants";

// returns the token price
export function getUSDPriceOfToken(
  market: Market,
  blockNumber: i32
): BigDecimal {
  const cTokenAddress = market.id;
  const getToken = Token.load(market.inputToken);
  if (getToken == null) {
    log.error("Couldn't find input token for market {}", [market.id]);
    return BIGDECIMAL_ZERO;
  }
  const getTokenAddress = getToken.id;
  const getTokenDecimals = getToken.decimals;
  let tokenPrice: BigDecimal;

  // get usd price of token
  if (blockNumber > 10678764) {
    // after block 10678764 ETH price was calculated in USD instead of USDC
    const ethPriceUSD = getUSDPriceETH();

    if (cTokenAddress == CETH_ADDRESS) {
      tokenPrice = ethPriceUSD.truncate(getTokenDecimals);
    } else {
      const tokenPriceUSD = getTokenPrice(
        blockNumber,
        Address.fromString(cTokenAddress),
        Address.fromString(getTokenAddress),
        getTokenDecimals
      );
      tokenPrice = tokenPriceUSD.truncate(getTokenDecimals);
    }
  } else {
    const usdPriceinInETH = getUSDCPriceETH(blockNumber);

    if (cTokenAddress == CETH_ADDRESS) {
      tokenPrice =
        BIGDECIMAL_ONE.div(usdPriceinInETH).truncate(getTokenDecimals);
    } else {
      const tokenPriceETH = getTokenPrice(
        blockNumber,
        Address.fromString(cTokenAddress),
        Address.fromString(getTokenAddress),
        getTokenDecimals
      );
      const underlyingPrice = tokenPriceETH.truncate(getTokenDecimals);
      if (
        cTokenAddress == CUSDC_ADDRESS ||
        cTokenAddress == CUSDT_ADDRESS ||
        cTokenAddress == CTUSD_ADDRESS
      ) {
        tokenPrice = BIGDECIMAL_ONE;
      } else {
        tokenPrice = underlyingPrice
          .div(usdPriceinInETH)
          .truncate(getTokenDecimals);
      }
    }
  }
  return tokenPrice;
}

/////////////////
//// Helpers ////
/////////////////

// get usd price of underlying tokens (NOT eth)
function getTokenPrice(
  blockNumber: i32,
  cTokenAddress: Address,
  underlyingAddress: Address,
  underlyingDecimals: i32
): BigDecimal {
  const protocol = LendingProtocol.load(COMPTROLLER_ADDRESS)!;
  const oracle2Address = Address.fromString(protocol._priceOracle);
  let underlyingPrice: BigDecimal;
  const mantissaFactorBD = exponentToBigDecimal(18);

  /**
   * Note: The first Price oracle was only used for the first ~100 blocks:
   *    https://etherscan.io/address/0x02557a5E05DeFeFFD4cAe6D83eA3d173B272c904
   *
   * PriceOracle2 is used starting aroun block 7715908 and we need the cToken
   * address. This returns the value without factoring in decimals and wei.
   *
   * So the number is divided by (ethDecimals - tokenDecimals) and again by mantissa
   * USDC = 10 ^ ((18 - 6) + 18) = 10 ^ 30
   *
   */
  if (blockNumber > 7715908) {
    // calculate using PriceOracle2
    const mantissaDecimalFactor = 18 - underlyingDecimals + 18;
    const bdFactor = exponentToBigDecimal(mantissaDecimalFactor);
    const priceOracle2 = PriceOracle2.bind(oracle2Address);
    const tryPrice = priceOracle2.try_getUnderlyingPrice(cTokenAddress);

    underlyingPrice = tryPrice.reverted
      ? BIGDECIMAL_ZERO
      : tryPrice.value.toBigDecimal().div(bdFactor);
  } else {
    /**
     * Calculate using PriceOracle1
     *
     * Note: this returns the value already factoring in token decimals and wei,
     * therefore we only need to divide by the mantissa, 10^18
     */
    const priceOracle1 = PriceOracle1.bind(
      Address.fromString(PRICE_ORACLE1_ADDRESS)
    );
    underlyingPrice = priceOracle1
      .getPrice(underlyingAddress)
      .toBigDecimal()
      .div(mantissaFactorBD);
  }

  return underlyingPrice;
}

// get usdc price of ETH
function getUSDCPriceETH(blockNumber: i32): BigDecimal {
  const protocol = LendingProtocol.load(COMPTROLLER_ADDRESS)!;
  const oracle2Address = Address.fromString(protocol._priceOracle);
  let usdcPrice: BigDecimal;
  const mantissaFactorBD = exponentToBigDecimal(18);

  // see getTokenPrice() for explanation
  if (blockNumber > 7715908) {
    const priceOracle2 = PriceOracle2.bind(oracle2Address);
    const mantissaDecimalFactorUSDC = 18 - USDC_DECIMALS + 18;
    const bdFactorUSDC = exponentToBigDecimal(mantissaDecimalFactorUSDC);
    const tryPrice = priceOracle2.try_getUnderlyingPrice(
      Address.fromString(CUSDC_ADDRESS)
    );

    usdcPrice = tryPrice.reverted
      ? BIGDECIMAL_ZERO
      : tryPrice.value.toBigDecimal().div(bdFactorUSDC);
  } else {
    const priceOracle1 = PriceOracle1.bind(
      Address.fromString(PRICE_ORACLE1_ADDRESS)
    );
    usdcPrice = priceOracle1
      .getPrice(Address.fromString(USDC_ADDRESS))
      .toBigDecimal()
      .div(mantissaFactorBD);
  }
  return usdcPrice;
}

function getUSDPriceETH(): BigDecimal {
  const protocol = LendingProtocol.load(COMPTROLLER_ADDRESS)!;
  const mantissaFactorBD = exponentToBigDecimal(18);
  const oracle2Address = Address.fromString(protocol._priceOracle);
  const priceOracle2 = PriceOracle2.bind(oracle2Address);
  const tryPrice = priceOracle2.try_getUnderlyingPrice(
    Address.fromString(CETH_ADDRESS)
  );

  const ethPriceInUSD = tryPrice.reverted
    ? BIGDECIMAL_ZERO
    : tryPrice.value.toBigDecimal().div(mantissaFactorBD);

  return ethPriceInUSD;
}
