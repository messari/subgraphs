import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_NINE,
  BIGDECIMAL_ONE,
  BIGDECIMAL_TEN,
  BIGINT_MINUS_ONE,
  ETH_ADDRESS,
  INT_ZERO,
} from "../sdk/util/constants";

import {
  Deposit,
  NewRewardsCycle,
  SFRXETH,
  Withdraw,
} from "../../generated/SFRXETH/SFRXETH";
import { _ERC20 } from "../../generated/SFRXETH/_ERC20";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getLSTAddress().toHexString(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);

    return getUsdPricePerToken(pricedToken).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    return getUsdPrice(pricedToken, _amount);
  }
}

class TokenInit implements TokenInitializer {
  getTokenParams(address: Address): TokenParams {
    const erc20 = _ERC20.bind(address);
    let name = "unknown";
    let symbol = "UNKNOWN";
    let decimals = INT_ZERO as i32;

    if (address == Address.fromString(ETH_ADDRESS)) {
      name = "eth";
      symbol = "ETH";
      decimals = 18 as i32;
    } else {
      const nameCall = erc20.try_name();
      if (!nameCall.reverted) {
        name = nameCall.value;
      } else {
        log.warning("[getTokenParams] nameCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const symbolCall = erc20.try_symbol();
      if (!symbolCall.reverted) {
        symbol = symbolCall.value;
      } else {
        log.warning("[getTokenParams] symbolCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const decimalsCall = erc20.try_decimals();
      if (!decimalsCall.reverted) {
        decimals = decimalsCall.value.toI32();
      } else {
        log.warning("[getTokenParams] decimalsCall reverted for {}", [
          address.toHexString(),
        ]);
      }
    }
    const tokenParams = new TokenParams(name, symbol, decimals);

    return tokenParams;
  }
}

export function handleDeposit(event: Deposit): void {
  const staker = event.params.owner;
  const amount = event.params.assets;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  // Technically input token should be frxETH and not ETH
  // We're using ETH here since there is no pricing available for frxETH and frxETH is pegged to ETH
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], lst, true);
  }
  pool.addInputTokenBalances([amount], true);

  const sfrxETH = SFRXETH.bind(Address.fromBytes(lst.id));
  const supply = sfrxETH.totalSupply();
  pool.setOutputTokenSupply(lst, supply);

  const account = sdk.Accounts.loadAccount(staker);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const staker = event.params.receiver;
  const amount = event.params.assets;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], lst, true);
  }
  pool.addInputTokenBalances([amount.times(BIGINT_MINUS_ONE)], true);

  const sfrxETH = SFRXETH.bind(Address.fromBytes(lst.id));
  const supply = sfrxETH.totalSupply();
  pool.setOutputTokenSupply(lst, supply);

  const account = sdk.Accounts.loadAccount(staker);
  account.trackActivity();
}

export function handleNewRewardsCycle(event: NewRewardsCycle): void {
  const amount = event.params.rewardAmount;
  const protocolMultiple = BIGDECIMAL_ONE.div(BIGDECIMAL_TEN);
  const protocolSideAmount = bigDecimalToBigInt(
    amount.toBigDecimal().times(protocolMultiple)
  );
  const supplySideMultiple = BIGDECIMAL_NINE.div(BIGDECIMAL_TEN);
  const supplySideAmount = bigDecimalToBigInt(
    amount.toBigDecimal().times(supplySideMultiple)
  );

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], lst, true);
  }
  pool.addRevenueNative(token, protocolSideAmount, supplySideAmount);
}
