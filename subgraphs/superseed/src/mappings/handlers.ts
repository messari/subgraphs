import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ONE,
  BIGINT_MINUS_ONE,
  ETH_ADDRESS,
  INT_ZERO,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import { TokensPurchase } from "../../generated/SuperSaleDeposit/SuperSaleDeposit";
import { _ERC20 } from "../../generated/SuperSaleDeposit/_ERC20";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    return BIGDECIMAL_ONE;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return BIGDECIMAL_ONE.times(_amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = "eth";
      symbol = "ETH";
      decimals = 18 as i32;
    } else {
      const erc20 = _ERC20.bind(address);
      name = erc20.name();
      symbol = erc20.symbol();
      decimals = erc20.decimals().toI32();
    }
    return new TokenParams(name, symbol, decimals);
  }
}

export function handleTokensPurchase(event: TokensPurchase): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const tokenAddr = Address.fromString(
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
  );
  const token = sdk.Tokens.getOrCreateToken(tokenAddr);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }
  pool.addInputTokenBalances([event.params.depositedAmount], true);

  const user = event.params.user;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}
