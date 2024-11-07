import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGDECIMAL_ZERO, INT_ZERO, ZERO_ADDRESS } from "../sdk/util/constants";

import {
  Transfer as TransferStakedGnoToken,
  StakedGnoToken,
} from "../../generated/StakedGnoToken/StakedGnoToken";
import { _ERC20 } from "../../generated/StakedGnoToken/_ERC20";
import { ChainlinkDataFeed } from "../../generated/StakedGnoToken/ChainlinkDataFeed";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

const GNO_ADDRESS = "0x9c58bacc331c9aa871afd802db6379a98e80cedb";

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    if (Address.fromBytes(token.id) == Address.fromString(GNO_ADDRESS)) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        Address.fromString("0x22441d81416430a54336ab28765abd31a792ad37") // GNO / USD feed
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

    if (address == Address.fromString(GNO_ADDRESS)) {
      name = "Gnosis Token on xDai";
      symbol = "GNO";
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

export function handleTransferStakedGnoToken(
  event: TransferStakedGnoToken
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(GNO_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Staked Gno Token", "sGNO", [token.id], null);
  }

  const contract = StakedGnoToken.bind(event.address);
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
