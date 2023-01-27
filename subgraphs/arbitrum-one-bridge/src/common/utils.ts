import { Token } from "../../generated/schema";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { TokenPricer } from "../sdk/protocols/config";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { TokenInitializer, TokenParams } from "../sdk/protocols/bridge/tokens";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { _ERC20 } from "../../generated/ERC20Gateway/_ERC20";

export class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const price = getUsdPricePerToken(Address.fromBytes(token.id));
    return price.usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
  }
}

export class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const name = this.fetchTokenName(address);
    const symbol = this.fetchTokenSymbol(address);
    const decimals = this.fetchTokenDecimals(address) as i32;

    return {
      name,
      symbol,
      decimals,
    };
  }

  fetchTokenName(tokenAddress: Address): string {
    const tokenContract = _ERC20.bind(tokenAddress);
    const call = tokenContract.try_name();
    if (call.reverted) {
      return tokenAddress.toHexString();
    } else {
      return call.value;
    }
  }

  fetchTokenSymbol(tokenAddress: Address): string {
    const tokenContract = _ERC20.bind(tokenAddress);
    const call = tokenContract.try_symbol();
    if (call.reverted) {
      return " ";
    } else {
      return call.value;
    }
  }

  fetchTokenDecimals(tokenAddress: Address): number {
    const tokenContract = _ERC20.bind(tokenAddress);
    const call = tokenContract.try_decimals();
    if (call.reverted) {
      return 0;
    } else {
      return call.value.toI32();
    }
  }
}
