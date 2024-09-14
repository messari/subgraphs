import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGINT_ZERO, ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import {
  UserStake,
  UserUnstake,
  UserUnstakeRequested,
  PLXTAO,
} from "../../generated/PLXTAO/PLXTAO";
import { _ERC20 } from "../../generated/PLXTAO/_ERC20";
import { ChainlinkDataFeed } from "../../generated/PLXTAO/ChainlinkDataFeed";
import { Token } from "../../generated/schema";
import { CustomPriceType } from "../prices/common/types";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token, block: BigInt): BigDecimal {
    let returnedPrice = new CustomPriceType();
    const pricedTokenAddr = Address.fromBytes(token.id);

    if (
      pricedTokenAddr == NetworkConfigs.getTaoAddress() &&
      block.gt(BigInt.fromString("19782964"))
    ) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        NetworkConfigs.getChainlinkDataFeed() // TAO / USD feed
      );

      const result = chainlinkDataFeedContract.latestAnswer();
      const decimals = chainlinkDataFeedContract.decimals();
      const usdPricePerToken = CustomPriceType.initialize(
        result.toBigDecimal(),
        decimals as i32,
        "ChainlinkFeed"
      );
      returnedPrice = usdPricePerToken;
    } else {
      returnedPrice = getUsdPricePerToken(pricedTokenAddr);
    }
    return returnedPrice.usdPrice;
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

export function handleUserStake(event: UserStake): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getTaoAddress());

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Tensorplex Staked TAO", "plxTAO", [token.id], null);
  }

  const plxTAOContract = PLXTAO.bind(event.address);
  const supply = plxTAOContract.totalSupply();
  const balace = supply
    .toBigDecimal()
    .div(bigIntToBigDecimal(plxTAOContract.exchangeRate()));
  pool.setInputTokenBalances([bigDecimalToBigInt(balace)], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();

  // https://docs.tensorplex.ai/tensorplex-docs/tensorplex-lst/fees
  const baseFee = BigInt.fromString("20000000");
  const fee = baseFee
    .plus(event.params.inTaoAmt)
    .toBigDecimal()
    .times(BigDecimal.fromString("0.001"));
  pool.addRevenueNative(token, BIGINT_ZERO, bigDecimalToBigInt(fee));
}

export function handleUserUnstakeRequested(event: UserUnstakeRequested): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getTaoAddress());

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Tensorplex Staked TAO", "plxTAO", [token.id], null);
  }

  // https://docs.tensorplex.ai/tensorplex-docs/tensorplex-lst/fees
  const baseFee = BigInt.fromString("50000000");
  const fee = baseFee
    .plus(event.params.outTaoAmt)
    .toBigDecimal()
    .times(BigDecimal.fromString("0.001"));
  pool.addRevenueNative(token, BIGINT_ZERO, bigDecimalToBigInt(fee));

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleUserUnstake(event: UserUnstake): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getTaoAddress());

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize("Tensorplex Staked TAO", "plxTAO", [token.id], null);
  }

  const plxTAOContract = PLXTAO.bind(event.address);
  const supply = plxTAOContract.totalSupply();
  const balace = supply
    .toBigDecimal()
    .div(bigIntToBigDecimal(plxTAOContract.exchangeRate()));
  pool.setInputTokenBalances([bigDecimalToBigInt(balace)], true);
}
