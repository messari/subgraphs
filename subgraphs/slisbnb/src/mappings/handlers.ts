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
import { WETH_ADDRESS as BNB_ADDRESS_BSC } from "../prices/config/bsc";
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

import { _ERC20 } from "../../generated/ListaStakeManager/_ERC20";
import {
  Deposit,
  RequestWithdraw,
  ClaimWithdrawal,
  RewardsCompounded,
} from "../../generated/ListaStakeManager/ListaStakeManager";
import { ChainlinkDataFeed } from "../../generated/ListaStakeManager/ChainlinkDataFeed";
import { slisBNB } from "../../generated/ListaStakeManager/slisBNB";
import { Token } from "../../generated/schema";
import { CustomPriceType } from "../prices/common/types";

const conf = new ProtocolConfig(
  NetworkConfigs.getLSTAddress().toHexString(),
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
    if (network == Network.BSC && pricedTokenAddr == BNB_ADDRESS_BSC) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        Address.fromString("0x0567f2323251f0aab15c8dfb1967e4e8a7d42aee") // BNB / USD feed
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
    if (network == Network.BSC && pricedTokenAddr == BNB_ADDRESS_BSC) {
      const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
        Address.fromString("0x0567f2323251f0aab15c8dfb1967e4e8a7d42aee") // BNB / USD feed
      );

      const result = chainlinkDataFeedContract.latestAnswer();
      const decimals = chainlinkDataFeedContract.decimals();
      const usdPricePerToken = CustomPriceType.initialize(
        result.toBigDecimal(),
        decimals as i32,
        "ChainlinkFeed"
      );
      returnedPrice = usdPricePerToken.usdPrice
        .times(pricedTokenMultiplier)
        .times(_amount);
    } else {
      returnedPrice = getUsdPrice(pricedTokenAddr, _amount).times(
        pricedTokenMultiplier
      );
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

export function handleDeposit(event: Deposit): void {
  log.warning("[Deposit] src: {} amount: {} tx: {}", [
    event.params._src.toHexString(),
    event.params._amount.toString(),
    event.transaction.hash.toHexString(),
  ]);

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null, false);
  }

  const slisBNBContract = slisBNB.bind(NetworkConfigs.getLSTAddress());
  const supply = slisBNBContract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRequestWithdraw(event: RequestWithdraw): void {
  log.warning("[RequestWithdraw] account: {} amountInSlisBnb: {} tx: {}", [
    event.params._account.toHexString(),
    event.params._amountInSlisBnb.toString(),
    event.transaction.hash.toHexString(),
  ]);

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleClaimWithdrawal(event: ClaimWithdrawal): void {
  log.warning("[ClaimWithdrawal] account: {} amount: {} tx: {}", [
    event.params._account.toHexString(),
    event.params._amount.toString(),
    event.transaction.hash.toHexString(),
  ]);

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null, false);
  }

  const slisBNBContract = slisBNB.bind(NetworkConfigs.getLSTAddress());
  const supply = slisBNBContract.totalSupply();
  pool.setInputTokenBalances([supply], true);
}

export function handleRewardsCompounded(event: RewardsCompounded): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null, false);
  }

  const amount = event.params._amount;
  const protocolSide = BigDecimal.fromString("5")
    .div(BigDecimal.fromString("100"))
    .times(amount.toBigDecimal());
  const supplySide = BigDecimal.fromString("95")
    .div(BigDecimal.fromString("100"))
    .times(amount.toBigDecimal());

  log.warning("[RewardsCompounded] amount: {} protocol: {} supply: {} tx: {}", [
    event.params._amount.toString(),
    protocolSide.toString(),
    supplySide.toString(),
    event.transaction.hash.toHexString(),
  ]);

  pool.addRevenueNative(
    token,
    bigDecimalToBigInt(protocolSide),
    bigDecimalToBigInt(supplySide)
  );
}
