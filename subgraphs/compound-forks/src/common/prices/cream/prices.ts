import { BIGDECIMAL_ZERO } from "../../../common/utils/constants";
import { Token, LendingProtocol, Market } from "../../../../generated/schema";
import { Address, BigDecimal, log } from "@graphprotocol/graph-ts";
import { PriceOracle2 } from "../../../../generated/Comptroller/PriceOracle2";
import { exponentToBigDecimal } from "../../utils/utils";
import { CETH_ADDRESS, protocolAddress } from "../../../data";

// returns the token price
export function getUSDPriceOfToken(market: Market, blockNumber: i32): BigDecimal {
  let cTokenAddress = market.id;
  let getToken = Token.load(market.inputTokens[0]);
  if (getToken == null) {
    log.error("Couldn't find input token for market {}", [market.id]);
    return BIGDECIMAL_ZERO;
  }
  let getTokenAddress = getToken.id;
  let getTokenDecimals = getToken.decimals;
  let tokenPrice: BigDecimal;

  let ethPriceUSD = getUSDPriceETH();

  if (cTokenAddress == CETH_ADDRESS) {
    tokenPrice = ethPriceUSD.truncate(getTokenDecimals);
  } else {
    let tokenPriceUSD = getTokenPrice(
      Address.fromString(cTokenAddress),
      Address.fromString(getTokenAddress),
      getTokenDecimals,
    );
    tokenPrice = tokenPriceUSD.truncate(getTokenDecimals);
  }
  return tokenPrice;
}

/////////////////
//// Helpers ////
/////////////////

// get usd price of underlying tokens (NOT eth)
export function getTokenPrice(cTokenAddress: Address, underlyingAddress: Address, underlyingDecimals: i32): BigDecimal {
  let protocol = LendingProtocol.load(protocolAddress)!;
  let oracleAddress = changetype<Address>(protocol._priceOracle);
  let underlyingPrice: BigDecimal;
  let mantissaFactorBD = exponentToBigDecimal(18);

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
  let mantissaDecimalFactor = 18 - underlyingDecimals + 18;
  let bdFactor = exponentToBigDecimal(mantissaDecimalFactor);
  let priceOracle = PriceOracle2.bind(oracleAddress);
  let tryPrice = priceOracle.try_getUnderlyingPrice(cTokenAddress);

  underlyingPrice = tryPrice.reverted ? BIGDECIMAL_ZERO : tryPrice.value.toBigDecimal().div(bdFactor);

  return underlyingPrice;
}

export function getUSDPriceETH(): BigDecimal {
  let protocol = LendingProtocol.load(protocolAddress)!;
  let mantissaFactorBD = exponentToBigDecimal(18);
  let oracleAddress = changetype<Address>(protocol._priceOracle);
  let priceOracle = PriceOracle2.bind(oracleAddress);
  let tryPrice = priceOracle.try_getUnderlyingPrice(Address.fromString(CETH_ADDRESS));

  let ethPriceInUSD = tryPrice.reverted ? BIGDECIMAL_ZERO : tryPrice.value.toBigDecimal().div(mantissaFactorBD);

  return ethPriceInUSD;
}
