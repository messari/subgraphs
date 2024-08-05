import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { WETH_ADDRESS as WAVAX_ADDRESS_AVALANCHE } from "../prices/config/avalanche";
import { CustomPriceType } from "../prices/common/types";
import { getUpdatedPricedToken } from "./helpers";

import { SDK } from "../sdk/protocols/generic";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  Network,
} from "../sdk/util/constants";

import { _ERC20 } from "../../generated/SAVAX/_ERC20";
import { ChainlinkDataFeed } from "../../generated/SAVAX/ChainlinkDataFeed";
import {
  SAVAX,
  Submitted,
  Redeem,
  AccrueRewards,
} from "../../generated/SAVAX/SAVAX";
import { AccrueRewards as AccrueRewardsOld } from "../../generated/SAVAXOldImplementation/SAVAXOldImplementation";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getSAVAXAddress().toHexString(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    let returnedPrice = BIGDECIMAL_ZERO;

    const pricedToken = getUpdatedPricedToken(Address.fromBytes(token.id));
    const pricedTokenAddr = pricedToken.addr;
    const pricedTokenMultiplier = pricedToken.multiplier;
    const pricedTokenChanged = pricedToken.changed;

    const network = dataSource.network().toUpperCase().replace("-", "_");
    if (network == Network.AVALANCHE) {
      if (pricedTokenAddr == WAVAX_ADDRESS_AVALANCHE) {
        const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
          Address.fromString("0x0a77230d17318075983913bc2145db16c7366156") // AVAX / USD feed
        );

        const result = chainlinkDataFeedContract.latestAnswer();
        const decimals = chainlinkDataFeedContract.decimals();
        const usdPricePerToken = CustomPriceType.initialize(
          result.toBigDecimal(),
          decimals as i32,
          "ChainlinkFeed"
        );
        returnedPrice = usdPricePerToken.usdPrice.times(pricedTokenMultiplier);
      } else {
        returnedPrice = getUsdPricePerToken(pricedTokenAddr).usdPrice.times(
          pricedTokenMultiplier
        );
      }
    }
    if (pricedTokenChanged) {
      log.debug(
        "[getTokenPrice] inputToken: {} pricedToken: {} multiplier: {} returnedPrice: {}",
        [
          token.id.toHexString(),
          pricedTokenAddr.toHexString(),
          pricedTokenMultiplier.toString(),
          returnedPrice.toString(),
        ]
      );
    }

    return returnedPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    let returnedPrice = BIGDECIMAL_ZERO;
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    const pricedToken = getUpdatedPricedToken(Address.fromBytes(token.id));
    const pricedTokenAddr = pricedToken.addr;
    const pricedTokenMultiplier = pricedToken.multiplier;
    const pricedTokenChanged = pricedToken.changed;

    const network = dataSource.network().toUpperCase().replace("-", "_");
    if (network == Network.AVALANCHE) {
      if (pricedTokenAddr == WAVAX_ADDRESS_AVALANCHE) {
        const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
          Address.fromString("0x0a77230d17318075983913bc2145db16c7366156") // AVAX / USD feed
        );

        const result = chainlinkDataFeedContract.latestAnswer();
        const decimals = chainlinkDataFeedContract.decimals();
        const usdPricePerToken = CustomPriceType.initialize(
          result.toBigDecimal(),
          decimals as i32,
          "ChainlinkFeed"
        );
        returnedPrice = usdPricePerToken.usdPrice
          .times(_amount)
          .times(pricedTokenMultiplier);
      } else {
        returnedPrice = getUsdPrice(pricedTokenAddr, _amount).times(
          pricedTokenMultiplier
        );
      }
    }
    if (pricedTokenChanged) {
      log.debug(
        "[getAmountValueUSD] inputToken: {} pricedToken: {} multiplier: {} amount: {} returnedPrice: {}",
        [
          token.id.toHexString(),
          pricedTokenAddr.toHexString(),
          pricedTokenMultiplier.toString(),
          _amount.toString(),
          returnedPrice.toString(),
        ]
      );
    }

    return returnedPrice;
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

export function handleSubmitted(event: Submitted): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getAVAXAddress());
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getSAVAXAddress()
  );

  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token.id],
      outputToken,
      false
    );
  }

  const sAVAX = SAVAX.bind(event.address);

  const balance = sAVAX.totalPooledAvax();
  pool.setInputTokenBalances([balance], true);

  const supply = sAVAX.totalSupply();
  pool.setOutputTokenSupply(outputToken, supply);

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
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getAVAXAddress());
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getSAVAXAddress()
  );

  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token.id],
      outputToken,
      false
    );
  }

  const sAVAX = SAVAX.bind(event.address);

  const balance = sAVAX.totalPooledAvax();
  pool.setInputTokenBalances([balance], true);

  const supply = sAVAX.totalSupply();
  pool.setOutputTokenSupply(outputToken, supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleAccrueRewards(event: AccrueRewards): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getAVAXAddress());
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getSAVAXAddress()
  );

  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token.id],
      outputToken,
      false
    );
  }

  const sAVAX = SAVAX.bind(event.address);

  const balance = sAVAX.totalPooledAvax();
  pool.setInputTokenBalances([balance], true);

  const supply = sAVAX.totalSupply();
  pool.setOutputTokenSupply(outputToken, supply);

  pool.addRevenueNative(
    token,
    event.params.protocolRewardAmount,
    event.params.userRewardAmount
  );
}

export function handleAccrueRewardsOld(event: AccrueRewardsOld): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getAVAXAddress());
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getSAVAXAddress()
  );

  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token.id],
      outputToken,
      false
    );
  }

  const amount = event.params.value;
  const protocolSide = BigDecimal.fromString("10")
    .div(BigDecimal.fromString("100"))
    .times(amount.toBigDecimal());
  const supplySide = BigDecimal.fromString("90")
    .div(BigDecimal.fromString("100"))
    .times(amount.toBigDecimal());

  pool.addRevenueNative(
    token,
    bigDecimalToBigInt(protocolSide),
    bigDecimalToBigInt(supplySide)
  );
}
