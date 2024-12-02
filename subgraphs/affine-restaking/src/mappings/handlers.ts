import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import { Deposit, Withdraw, LRTEth } from "../../generated/STETH/LRTEth";
import { Transfer, LRTLinea } from "../../generated/WETH/LRTLinea";
import { _ERC20 } from "../../generated/STETH/_ERC20";
import { ChainlinkDataFeed } from "../../generated/STETH/ChainlinkDataFeed";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    if (
      [
        Address.fromString("0xae7ab96520de3a18e5e111b5eaab095312d7fe84"),
        Address.fromString("0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0"),
      ].includes(Address.fromBytes(token.id))
    ) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        Address.fromString("0xcfe54b5cd566ab89272946f602d76ea879cab4a8") // stETH / USD feed on Eth
      );
      const result = chainlinkDataFeedContract.latestAnswer();
      const decimals = chainlinkDataFeedContract.decimals();
      return bigIntToBigDecimal(result, decimals);
    }
    if (
      [
        Address.fromString("0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f"),
      ].includes(Address.fromBytes(token.id))
    ) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        Address.fromString("0x3c6cd9cc7c7a4c2cf5a82734cd249d7d593354da") // ETH / USD feed on Linea
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
  const contract = LRTEth.bind(event.address);

  const token = sdk.Tokens.getOrCreateToken(contract.asset());
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const balance = contract.totalAssets();
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
  const contract = LRTEth.bind(event.address);

  const token = sdk.Tokens.getOrCreateToken(contract.asset());
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const balance = contract.totalAssets();
  pool.setInputTokenBalances([balance], true);

  const user = event.params.caller;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleTransfer(event: Transfer): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const contract = LRTLinea.bind(event.address);

  const token = sdk.Tokens.getOrCreateToken(contract.baseAsset());
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const supply = contract.totalSupply();
  const sharePrice = contract.sharePrice();
  const decimals = contract.decimals();
  const balance = bigDecimalToBigInt(
    supply.toBigDecimal().times(bigIntToBigDecimal(sharePrice, decimals))
  );
  pool.setInputTokenBalances([balance], true);

  if (
    event.params.from == Address.fromString(ZERO_ADDRESS) ||
    event.params.to == Address.fromString(ZERO_ADDRESS)
  ) {
    const user = event.transaction.from;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
}
