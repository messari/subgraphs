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
import { WETH_ADDRESS_BSC } from "../prices/config/bsc";
import { getUpdatedPricedToken } from "./helpers";

import { SDK } from "../sdk/protocols/generic";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  Network,
} from "../sdk/util/constants";

import { _ERC20 } from "../../generated/WBETH/_ERC20";
import { ChainlinkDataFeed } from "../../generated/WBETH/ChainlinkDataFeed";
import { WBETH, Mint, Burn } from "../../generated/WBETH/WBETH";
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
    if (network == Network.MAINNET) {
      returnedPrice = getUsdPricePerToken(pricedTokenAddr).usdPrice.times(
        pricedTokenMultiplier
      );
    }
    if (network == Network.BSC) {
      if (pricedTokenAddr == WETH_ADDRESS_BSC) {
        const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
          Address.fromString("0x2a3796273d47c4ed363b361d3aefb7f7e2a13782") // BETH / USD feed
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
    if (network == Network.MAINNET) {
      returnedPrice = getUsdPrice(pricedTokenAddr, _amount).times(
        pricedTokenMultiplier
      );
    }
    if (network == Network.BSC) {
      if (pricedTokenAddr == WETH_ADDRESS_BSC) {
        const chainlinkDataFeedContract = ChainlinkDataFeed.bind(
          Address.fromString("0x2a3796273d47c4ed363b361d3aefb7f7e2a13782") // BETH / USD feed
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

export function handleMint(event: Mint): void {
  log.warning("[Mint] user: {} amount: {} to: {} tx: {}", [
    event.params.minter.toHexString(),
    event.params.amount.toString(),
    event.params.to.toHexString(),
    event.transaction.hash.toHexString(),
  ]);

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.address);

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null, false);
  }

  const wbETH = WBETH.bind(event.address);
  const supply = wbETH.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleBurn(event: Burn): void {
  log.warning("[Burn] user: {} amount: {} tx: {}", [
    event.params.burner.toHexString(),
    event.params.amount.toString(),
    event.transaction.hash.toHexString(),
  ]);

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.address);

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null, false);
  }

  const wbETH = WBETH.bind(event.address);
  const supply = wbETH.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}
