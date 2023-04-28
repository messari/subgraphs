import * as utils from "../common/utils";
import { Token } from "../../generated/schema";
import * as constants from "../common/constants";
import { TokenPricer } from "../sdk/protocols/config";
import { _ERC20 } from "../../generated/MlpManager/_ERC20";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  TokenInitializer,
  TokenParams,
} from "../sdk/protocols/perpfutures/tokens";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

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
  getTokenPrice(token: Token): BigDecimal {
    const tokenAddress = Address.fromBytes(token.id);
    const tokenPrice = getUsdPricePerToken(tokenAddress).usdPrice;
    return tokenPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const tokenAddress = Address.fromBytes(token.id);
    const amountVauleUSD = getUsdPrice(
      tokenAddress,
      utils.bigIntToBigDecimal(amount, token.decimals)
    );
    return amountVauleUSD;
  }
}
