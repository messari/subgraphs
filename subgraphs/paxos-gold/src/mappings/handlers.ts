import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import { Transfer, FeeCollected, PAXG } from "../../generated/PAXG/PAXG";
import { _ERC20 } from "../../generated/PAXG/_ERC20";
import { ChainlinkDataFeed } from "../../generated/PAXG/ChainlinkDataFeed";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token, block: BigInt): BigDecimal {
    if (block > BigInt.fromString("10606502")) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        NetworkConfigs.getChainlinkDataFeed() // XAU / USD feed
      );
      const answerCall = chainlinkDataFeedContract.try_latestAnswer();
      const decimalsCall = chainlinkDataFeedContract.try_decimals();
      if (!answerCall.reverted && !decimalsCall.reverted) {
        return bigIntToBigDecimal(answerCall.value, decimalsCall.value);
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

export function handleTransfer(event: Transfer): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Paxos Gold", "PAXG", [token.id], null);
  }
  const pAXGContract = PAXG.bind(event.address);
  const supply = pAXGContract.totalSupply();
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

export function handleFeeCollected(event: FeeCollected): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Paxos Gold", "PAXG", [token.id], null);
  }
  const fee = event.params.value;
  pool.addRevenueNative(token, BIGINT_ZERO, fee);
}
