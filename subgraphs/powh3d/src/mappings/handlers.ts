import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGDECIMAL_ZERO, ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import {
  onTokenPurchase,
  onTokenSell,
  onReinvestment,
  onWithdraw,
  Hourglass,
} from "../../generated/Hourglass/Hourglass";
import { _ERC20 } from "../../generated/Hourglass/_ERC20";
import { ChainlinkDataFeed } from "../../generated/Hourglass/ChainlinkDataFeed";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token, block: BigInt): BigDecimal {
    if (
      Address.fromBytes(token.id) == Address.fromString(ETH_ADDRESS) &&
      block > BigInt.fromString("10606501")
    ) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        Address.fromString("0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419") // ETH / USD feed
      );
      const resultCall = chainlinkDataFeedContract.try_latestAnswer();
      const decimalsCall = chainlinkDataFeedContract.try_decimals();

      if (!resultCall.reverted && !decimalsCall.reverted) {
        return bigIntToBigDecimal(resultCall.value, decimalsCall.value);
      }
    }

    return BIGDECIMAL_ZERO;
  }

  getAmountValueUSD(token: Token, amount: BigInt, block: BigInt): BigDecimal {
    const usdPrice = this.getTokenPrice(token, block);
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

export function handleOnTokenPurchase(event: onTokenPurchase): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = Hourglass.bind(event.address);
  const balance = contract.totalEthereumBalance();
  pool.setInputTokenBalances([balance], true);

  const user = event.params.customerAddress;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleOnTokenSell(event: onTokenSell): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = Hourglass.bind(event.address);
  const balance = contract.totalEthereumBalance();
  pool.setInputTokenBalances([balance], true);

  const user = event.params.customerAddress;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleOnReinvestment(event: onReinvestment): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = Hourglass.bind(event.address);
  const balance = contract.totalEthereumBalance();
  pool.setInputTokenBalances([balance], true);

  const user = event.params.customerAddress;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleOnWithdraw(event: onWithdraw): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = Hourglass.bind(event.address);
  const balance = contract.totalEthereumBalance();
  pool.setInputTokenBalances([balance], true);

  const user = event.params.customerAddress;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}
