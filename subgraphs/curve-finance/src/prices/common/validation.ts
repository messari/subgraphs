import * as utils from "./utils";
import * as constants from "./constants";
import { Token } from "../../../generated/schema";
import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { getOrCreateDexAmmProtocol } from "../../common/initializers";

export function protocolLevelPriceValidation(
  token: Token,
  latestPrice: BigDecimal
): BigDecimal {
  const protocol = getOrCreateDexAmmProtocol();

  if (constants.BLACKLISTED_TOKENS.includes(Address.fromString(token.id)))
    return constants.BIGDECIMAL_ZERO;

  const tokenTVLDelta = utils.absBigDecimal(
    latestPrice
      .times(
        utils
          .getTokenSupply(Address.fromString(token.id))
          .toBigDecimal()
          .div(utils.exponentToBigDecimal(token.decimals))
      )
      .minus(token._totalValueLockedUSD)
  );

  const protocolTVLPercentageDelta = utils.absBigDecimal(
    utils.safeDiv(tokenTVLDelta, protocol.totalValueLockedUSD)
  );

  if (protocolTVLPercentageDelta.gt(constants.BIGDECIMAL_FIVE_PERCENT)) {
    if (token._largeTVLImpactBuffer < constants.PRICE_CHANGE_BUFFER_LIMIT) {
      token._largeTVLImpactBuffer += 1;
      token.save();

      return token.lastPriceUSD!;
    }
  }

  if (
    !token.lastPriceUSD ||
    token.lastPriceUSD!.equals(constants.BIGDECIMAL_ZERO)
  ) {
    token.save();

    return latestPrice;
  }

  // If priceSoFar 10x greater or less than token.lastPriceUSD, use token.lastPriceUSD
  // Increment buffer so that it allows large price jumps if seen repeatedly
  if (
    latestPrice.gt(token.lastPriceUSD!.times(constants.BIGDECIMAL_TWO)) ||
    latestPrice.lt(token.lastPriceUSD!.div(constants.BIGDECIMAL_TWO))
  ) {
    if (token._largePriceChangeBuffer < constants.PRICE_CHANGE_BUFFER_LIMIT) {
      token._largePriceChangeBuffer += 1;
      token.save();

      return token.lastPriceUSD!;
    }
  }

  token._largePriceChangeBuffer = 0;
  token._largeTVLImpactBuffer = 0;
  token.save();

  return latestPrice;
}
