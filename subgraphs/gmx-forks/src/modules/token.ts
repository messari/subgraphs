import {
  TokenInitializer,
  TokenParams,
} from "../sdk/protocols/perpfutures/tokens";
import * as utils from "../common/utils";
import { Token } from "../../generated/schema";
import * as constants from "../common/constants";
import { TokenPricer } from "../sdk/protocols/config";
import { _ERC20 } from "../../generated/MlpManager/_ERC20";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { MlpManager } from "../../generated/MlpManager/MlpManager";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

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
    let tokenPrice = getUsdPricePerToken(tokenAddress).usdPrice;
    if (tokenAddress.equals(constants.ESCROWED_MMY_ADDRESS)) {
      log.warning("[tokenPrice] esGMX price {}", [tokenPrice.toString()]);
    }
    if (tokenPrice.equals(constants.BIGDECIMAL_ZERO)) {
      if (tokenAddress.equals(constants.ESCROWED_MMY_ADDRESS)) {
        tokenPrice = getUsdPricePerToken(constants.MMY_ADDRESS).usdPrice;
        log.warning("[tokenPrice] esGMX price {}", [tokenPrice.toString()]);
      }
      if (tokenAddress.equals(constants.MLP_ADDRESS)) {
        for (let i = 0; i < constants.MLP_MANAGER_ADDRESSES.length; i++) {
          const mlpManagerContract = MlpManager.bind(
            constants.MLP_MANAGER_ADDRESSES[i]
          );
          tokenPrice = utils.bigIntToBigDecimal(
            utils.readValue(
              mlpManagerContract.try_getPrice(false),
              constants.BIGINT_ZERO
            ),
            constants.PRICE_PRECISION_DECIMALS
          );

          if (!tokenPrice.equals(constants.BIGDECIMAL_ZERO)) break;
        }
      }
    }
    return tokenPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const tokenAddress = Address.fromBytes(token.id);

    let amountVauleUSD = getUsdPrice(
      tokenAddress,
      utils.bigIntToBigDecimal(amount, token.decimals),
      null
    );
    if (tokenAddress.equals(constants.ESCROWED_MMY_ADDRESS)) {
      log.warning("[tokenPrice] esGMX valueUSD {} amount {}", [
        amountVauleUSD.toString(),
        amount.toString(),
      ]);
    }

    if (amountVauleUSD.equals(constants.BIGDECIMAL_ZERO)) {
      if (tokenAddress.equals(constants.ESCROWED_MMY_ADDRESS)) {
        amountVauleUSD = getUsdPrice(
          constants.MMY_ADDRESS,
          utils.bigIntToBigDecimal(amount, token.decimals),
          null
        );
        log.warning("[tokenPrice] esGMX valueUSD {} amount {}", [
          amountVauleUSD.toString(),
          amount.toString(),
        ]);
      }
      if (tokenAddress.equals(constants.MLP_ADDRESS)) {
        for (let i = 0; i < constants.MLP_MANAGER_ADDRESSES.length; i++) {
          const mlpManagerContract = MlpManager.bind(
            constants.MLP_MANAGER_ADDRESSES[i]
          );
          amountVauleUSD = utils
            .bigIntToBigDecimal(
              utils.readValue(
                mlpManagerContract.try_getPrice(false),
                constants.BIGINT_ZERO
              ),
              constants.PRICE_PRECISION_DECIMALS
            )
            .times(utils.bigIntToBigDecimal(amount, token.decimals));

          if (!amountVauleUSD.equals(constants.BIGDECIMAL_ZERO)) break;
        }
      }
    }
    return amountVauleUSD;
  }
}
