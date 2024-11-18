import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import { Transfer, StakedAvail } from "../../generated/StakedAvail/StakedAvail";
import { _ERC20 } from "../../generated/StakedAvail/_ERC20";
import { _Deployments, Token } from "../../generated/schema";
import { getAvailPrice } from "./helpers";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    if (
      Address.fromBytes(token.id) ==
      Address.fromString("0xeeb4d8400aeefafc1b2953e0094134a887c76bd8")
    ) {
      const ethPriceUSD = getUsdPricePerToken(
        Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2")
      ).usdPrice;
      return getAvailPrice(ethPriceUSD);
    }
    return BIGDECIMAL_ZERO;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    let returnPrice = BIGDECIMAL_ZERO;
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    returnPrice = this.getTokenPrice(token);
    return returnPrice.times(_amount);
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

export function handleTransfer(event: Transfer): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const contract = StakedAvail.bind(event.address);
  const token = sdk.Tokens.getOrCreateToken(contract.avail());
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const supply = contract.assets();
  pool.setInputTokenBalances([supply], true);

  if (
    event.params.from == Address.fromString(ZERO_ADDRESS) ||
    event.params.to == Address.fromString(ZERO_ADDRESS)
  ) {
    const user = event.transaction.from;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
}
