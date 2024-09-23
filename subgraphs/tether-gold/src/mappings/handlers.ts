import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_THOUSAND,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
} from "../sdk/util/constants";

import { Transfer, Mint, Redeem, XAUT } from "../../generated/XAUT/XAUT";
import { _ERC20 } from "../../generated/XAUT/_ERC20";
import { ChainlinkDataFeed } from "../../generated/XAUT/ChainlinkDataFeed";
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
      const result = chainlinkDataFeedContract.latestAnswer();
      const decimals = chainlinkDataFeedContract.decimals();
      log.warning("[pricer] price: {}", [
        bigIntToBigDecimal(result, decimals).toString(),
      ]);
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
    pool.initialize("Tether Gold", "XAUT", [token.id], null);
  }
  const XAUTContract = XAUT.bind(event.address);
  const supply = XAUTContract.totalSupply();
  pool.setInputTokenBalances([supply], true);
}

export function handleMint(event: Mint): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Tether Gold", "XAUT", [token.id], null);
  }
  // https://tether.to/en/fees/
  const fee = event.params._amount
    .toBigDecimal()
    .times(BigDecimal.fromString("0.001"));
  pool.addRevenueNative(token, BIGINT_ZERO, bigDecimalToBigInt(fee));

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRedeem(event: Redeem): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Tether Gold", "XAUT", [token.id], null);
  }
  // https://tether.to/en/fees/
  const dynamicFee = event.params._amount
    .toBigDecimal()
    .times(BigDecimal.fromString("0.001"));
  const dynamicFeeUSD = sdk.Pricer.getAmountValueUSD(
    token,
    bigDecimalToBigInt(dynamicFee),
    event.block.number
  );
  let feeUSD = BIGDECIMAL_THOUSAND;
  if (dynamicFeeUSD > BIGDECIMAL_THOUSAND) {
    feeUSD = dynamicFeeUSD;
  }
  pool.addRevenueUSD(feeUSD, BIGDECIMAL_ZERO);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}
