import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ONE,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import { Transfer, FeeProcessed, USYC } from "../../generated/USYC/USYC";
import { _ERC20 } from "../../generated/USYC/_ERC20";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);
const TREASURY = Address.fromString(
  "0xdd82875f0840aad58a455a70b88eed9f59cec7c7"
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    log.debug("[getTokenPrice] token: {}", [token.id.toHexString()]);
    return BIGDECIMAL_ONE;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const usdPrice = this.getTokenPrice(token);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    return usdPrice.times(_amount);
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
  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = USYC.bind(event.address);
  const supply = contract.balanceOf(TREASURY);
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

export function handleFeeProcessed(event: FeeProcessed): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  pool.addRevenueNative(token, BIGINT_ZERO, event.params.fee);
}
