import * as utils from "../common/utils";
import { Token } from "../../generated/schema";
import * as constants from "../common/constants";
import { TokenPricer } from "../sdk/protocols/config";
import { getEthPriceUsd, getLptPriceEth } from "./prices";
import { ERC20 } from "../../generated/BondingManager/ERC20";
import { Minter } from "../../generated/BondingManager/Minter";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";

export class TokenInitialize implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const tokenContract = ERC20.bind(address);
    const name = utils.readValue(tokenContract.try_name(), "");
    const symbol = utils.readValue(tokenContract.try_symbol(), "");
    const decimals = utils
      .readValue(tokenContract.try_decimals(), constants.BIGINT_ZERO)
      .toI32();
    const tokenParams = new TokenParams(name, symbol, decimals);

    return tokenParams;
  }
}

export class TokenPrice implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const tokenAddress = Address.fromBytes(token.id);
    if (tokenAddress.equals(constants.LPT_ADDRESS)) {
      const lptPriceEth = getLptPriceEth();
      const ethPriceUSD = getEthPriceUsd();

      return lptPriceEth.times(ethPriceUSD);
    }
    if (tokenAddress.equals(constants.WETH_ADDRESS)) {
      const ethPriceUSD = getEthPriceUsd();

      return ethPriceUSD;
    }
    const tokenPrice = constants.BIGDECIMAL_ZERO;

    return tokenPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const tokenAddress = Address.fromBytes(token.id);

    if (tokenAddress.equals(constants.LPT_ADDRESS)) {
      const lptPriceEth = getLptPriceEth();
      const ethPriceUSD = getEthPriceUsd();
      const amountDecimal = utils.bigIntToBigDecimal(
        amount,
        token.decimals as u8
      );
      return amountDecimal.times(ethPriceUSD).times(lptPriceEth);
    }

    if (tokenAddress.equals(constants.WETH_ADDRESS)) {
      const ethPriceUSD = getEthPriceUsd();
      const amountDecimal = utils.bigIntToBigDecimal(
        amount,
        token.decimals as u8
      );
      return amountDecimal.times(ethPriceUSD);
    }

    return constants.BIGDECIMAL_ZERO;
  }
}

export function getTotalRewardTokens(): BigInt {
  const minterContract = Minter.bind(constants.MINTER_ADDRESS);
  const totalSupply = utils.readValue<BigInt>(
    minterContract.try_getGlobalTotalSupply(),
    constants.BIGINT_ZERO
  );
  const inflationRate = utils.readValue<BigInt>(
    minterContract.try_inflation(),
    constants.BIGINT_ZERO
  );

  const rewardTokens = totalSupply
    .times(inflationRate)
    .div(constants.BIGINT_TEN.pow(9));

  return rewardTokens;
}
