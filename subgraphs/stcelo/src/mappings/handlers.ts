import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGDECIMAL_ZERO, ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import {
  VotesScheduled,
  CeloWithdrawalScheduled,
  CeloWithdrawalStarted,
  STCELO,
} from "../../generated/STCELO/STCELO";
import { _ERC20 } from "../../generated/STCELO/_ERC20";
import { ChainlinkDataFeed } from "../../generated/STCELO/ChainlinkDataFeed";
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
      Address.fromBytes(token.id) == NetworkConfigs.getLST() &&
      block > BigInt.fromString("19588039")
    ) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        Address.fromString("0x0568fd19986748ceff3301e55c0eb1e729e0ab7e") // CELO / USD feed
      );
      const result = chainlinkDataFeedContract.latestAnswer();
      const decimals = chainlinkDataFeedContract.decimals();
      return bigIntToBigDecimal(result, decimals);
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

export function handleVotesScheduled(event: VotesScheduled): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLST());
  const pool = sdk.Pools.loadPool(NetworkConfigs.getLST());
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = STCELO.bind(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  const supply = contract.getTotalCelo();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleCeloWithdrawalScheduled(
  event: CeloWithdrawalScheduled
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLST());
  const pool = sdk.Pools.loadPool(NetworkConfigs.getLST());
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = STCELO.bind(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  const supply = contract.getTotalCelo();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleCeloWithdrawalStarted(
  event: CeloWithdrawalStarted
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLST());
  const pool = sdk.Pools.loadPool(NetworkConfigs.getLST());
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = STCELO.bind(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  const supply = contract.getTotalCelo();
  pool.setInputTokenBalances([supply], true);
}
