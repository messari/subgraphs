import {
  TokenInitializer,
  TokenParams,
} from "../sdk/protocols/perpfutures/tokens";
import * as utils from "../common/utils";
import { Token } from "../../generated/schema";
import * as constants from "../common/constants";
import { TokenPricer } from "../sdk/protocols/config";
import { _ERC20 } from "../../generated/templates/MlpManagerTemplate/_ERC20";
import { getUsdPricePerToken } from "../prices";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

export class TokenInitialize implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const tokenContract = _ERC20.bind(address);
    const name = utils.readValue(tokenContract.try_name(), "");
    const symbol = utils.readValue(tokenContract.try_symbol(), "");
    const decimals = utils
      .readValue(tokenContract.try_decimals(), constants.BIGINT_ZERO)
      .toI32();
    return { name, symbol, decimals };
  }
}

export class TokenPrice implements TokenPricer {
  getTokenPrice(token: Token, block: ethereum.Block): BigDecimal {
    const tokenAddress = Address.fromBytes(token.id);
    let tokenPrice = constants.BIGDECIMAL_ZERO;
    if (token.lastPriceUSD) tokenPrice = token.lastPriceUSD!;

    if (token._setByEvent) return tokenPrice;

    // mlp price is calculated by the SDK
    if (tokenAddress == constants.MLP_ADDRESS) {
      return tokenPrice;
    }

    if (
      token.lastPriceUSD &&
      token.lastPriceBlockNumber &&
      block.number
        .minus(token.lastPriceBlockNumber!)
        .lt(constants.PRICE_CACHING_BLOCKS)
    ) {
      return tokenPrice;
    }

    // for escrowed token, use the price of it non escrowed version
    if (tokenAddress.equals(constants.ESCROWED_MMY_ADDRESS)) {
      tokenPrice = getUsdPricePerToken(constants.MMY_ADDRESS, block).usdPrice;
    } else {
      tokenPrice = getUsdPricePerToken(tokenAddress, block).usdPrice;
    }

    token.lastPriceUSD = tokenPrice;
    token.lastPriceBlockNumber = block.number;
    token._setByEvent = false;
    token.save();

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
      return tokenPrice.times(utils.bigIntToBigDecimal(amount, token.decimals));

    // mlp price is calculated by the SDK
    if (tokenAddress == constants.MLP_ADDRESS) {
      return tokenPrice.times(utils.bigIntToBigDecimal(amount, token.decimals));
    }

    if (
      token.lastPriceUSD &&
      token.lastPriceBlockNumber &&
      block.number
        .minus(token.lastPriceBlockNumber!)
        .lt(constants.PRICE_CACHING_BLOCKS)
    ) {
      return tokenPrice.times(utils.bigIntToBigDecimal(amount, token.decimals));
    }

    // for escrowed token, use the price of its non escrowed version
    if (tokenAddress.equals(constants.ESCROWED_MMY_ADDRESS)) {
      tokenPrice = getUsdPricePerToken(constants.MMY_ADDRESS, block).usdPrice;
    } else {
      tokenPrice = getUsdPricePerToken(tokenAddress, block).usdPrice;
    }

    token.lastPriceUSD = tokenPrice;
    token.lastPriceBlockNumber = block.number;
    token._setByEvent = false;
    token.save();

    return tokenPrice.times(utils.bigIntToBigDecimal(amount, token.decimals));
  }
}
