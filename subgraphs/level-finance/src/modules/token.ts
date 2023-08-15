import {
  TokenInitializer,
  TokenParams,
} from "../sdk/protocols/perpfutures/tokens";
import * as utils from "../common/utils";
import { Token } from "../../generated/schema";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { TokenPricer } from "../sdk/protocols/config";
import { ERC20 } from "../../generated/Pool/ERC20";
import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

export class TokenInitialize implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const tokenContract = ERC20.bind(address);
    const name = utils.readValue(tokenContract.try_name(), "");
    const symbol = utils.readValue(tokenContract.try_symbol(), "");
    const decimals = utils.readValue(tokenContract.try_decimals(), 0);
    return { name, symbol, decimals };
  }
}

export class TokenPrice implements TokenPricer {
  getTokenPrice(token: Token, block: ethereum.Block): BigDecimal {
    const tokenAddress = Address.fromBytes(token.id);
    let tokenPrice = constants.BIGDECIMAL_ZERO;
    if (token.lastPriceUSD) tokenPrice = token.lastPriceUSD!;

    if (token._setByEvent) return tokenPrice;
    if (
      token.lastPriceUSD &&
      token.lastPriceBlockNumber &&
      block.number
        .minus(token.lastPriceBlockNumber!)
        .lt(constants.PRICE_CACHING_BLOCKS)
    ) {
      return tokenPrice;
    }

    tokenPrice = getUsdPricePerToken(tokenAddress, block).usdPrice;

    token.lastPriceUSD = tokenPrice;
    token.lastPriceBlockNumber = block.number;
    token._setByEvent = false;
    token.save();

    log.warning("[getTokenPrice] tokenAddress {} name {} price {}", [
      tokenAddress.toHexString(),
      token.name,
      tokenPrice.toString(),
    ]);

    return tokenPrice;
  }

  getAmountValueUSD(
    token: Token,
    amount: BigInt,
    block: ethereum.Block
  ): BigDecimal {
    const tokenAddress = Address.fromBytes(token.id);
    let tokenPrice = constants.BIGDECIMAL_ZERO;
    if (token.lastPriceUSD) tokenPrice = token.lastPriceUSD!;

    if (token._setByEvent)
      tokenPrice.times(utils.bigIntToBigDecimal(amount, token.decimals));

    if (
      token.lastPriceUSD &&
      token.lastPriceBlockNumber &&
      block.number
        .minus(token.lastPriceBlockNumber!)
        .lt(constants.PRICE_CACHING_BLOCKS)
    ) {
      return tokenPrice.times(utils.bigIntToBigDecimal(amount, token.decimals));
    }
    tokenPrice = getUsdPricePerToken(tokenAddress, block).usdPrice;
    token.lastPriceUSD = tokenPrice;
    token.lastPriceBlockNumber = block.number;
    token._setByEvent = false;
    token.save();

    log.warning("[getAmountValueUSD] tokenAddress {} name {} price {}", [
      tokenAddress.toHexString(),
      token.name,
      tokenPrice.toString(),
    ]);

    return tokenPrice.times(utils.bigIntToBigDecimal(amount, token.decimals));
  }
}
