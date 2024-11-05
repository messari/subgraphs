import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGDECIMAL_ZERO, ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import {
  Deposit,
  Withdraw,
  Rewards,
  MEVETH,
} from "../../generated/MEVETH/MEVETH";
import { _ERC20 } from "../../generated/MEVETH/_ERC20";
import { ChainlinkDataFeed } from "../../generated/MEVETH/ChainlinkDataFeed";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    if (Address.fromBytes(token.id) == Address.fromString(ETH_ADDRESS)) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        Address.fromString("0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419") // ETH / USD feed
      );
      const result = chainlinkDataFeedContract.latestAnswer();
      const decimals = chainlinkDataFeedContract.decimals();
      return bigIntToBigDecimal(result, decimals);
    }
    return BIGDECIMAL_ZERO;
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

export function handleDeposit(event: Deposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], null);
  }

  const contract = MEVETH.bind(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  const fractionResult = contract.fraction();
  const balance = fractionResult.getElastic();
  pool.setInputTokenBalances([balance], true);

  const user = event.params.caller;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], null);
  }

  const contract = MEVETH.bind(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  const fractionResult = contract.fraction();
  const balance = fractionResult.getElastic();
  pool.setInputTokenBalances([balance], true);

  const user = event.params.caller;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRewards(event: Rewards): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], null);
  }

  const rewards = event.params.amount;
  const protocolSide = rewards
    .toBigDecimal()
    .times(BigDecimal.fromString("0.1"));
  const supplySide = rewards.toBigDecimal().minus(protocolSide);
  pool.addRevenueNative(
    token,
    bigDecimalToBigInt(supplySide),
    bigDecimalToBigInt(protocolSide)
  );
}
