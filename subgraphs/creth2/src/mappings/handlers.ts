import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

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

import { Transfer as TransferCream } from "../../generated/Cream/Cream";
import { Transfer as TransferCreth, CRETH } from "../../generated/CRETH/CRETH";
import { _ERC20 } from "../../generated/Cream/_ERC20";
import { ChainlinkDataFeed } from "../../generated/CRETH/ChainlinkDataFeed";
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
      Address.fromBytes(token.id) ==
      Address.fromString(NetworkConfigs.getProtocolId())
    ) {
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

export function handleTransferCreth(event: TransferCreth): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  const pool = sdk.Pools.loadPool(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = CRETH.bind(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  if (event.params.from == Address.fromString(ZERO_ADDRESS)) {
    const user = event.params.to;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
  if (event.params.to == Address.fromString(ZERO_ADDRESS)) {
    const user = event.params.from;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
}

export function handleTransferCream(event: TransferCream): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  const pool = sdk.Pools.loadPool(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = CRETH.bind(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);
}
