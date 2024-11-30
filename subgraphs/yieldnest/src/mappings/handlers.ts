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

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  Network,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import { Transfer, YNETH } from "../../generated/YNETH/YNETH";
import { RewardsProcessed } from "../../generated/YNETH/RewardsDistributor";
import { AssetRegistry } from "../../generated/YNETH/AssetRegistry";
import { _ERC20 } from "../../generated/YNETH/_ERC20";
import { Token } from "../../generated/schema";
import { getUpdatedPricedToken } from "./helpers";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const pricedToken = getUpdatedPricedToken(Address.fromBytes(token.id));
    const pricedTokenAddr = pricedToken.addr;
    const pricedTokenMultiplier = pricedToken.multiplier;
    const pricedTokenChanged = pricedToken.changed;

    const returnedPrice = getUsdPricePerToken(pricedTokenAddr).usdPrice.times(
      pricedTokenMultiplier
    );
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
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    const pricedToken = getUpdatedPricedToken(Address.fromBytes(token.id));
    const pricedTokenAddr = pricedToken.addr;
    const pricedTokenMultiplier = pricedToken.multiplier;
    const pricedTokenChanged = pricedToken.changed;

    const returnedPrice = getUsdPrice(pricedTokenAddr, _amount).times(
      pricedTokenMultiplier
    );
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
  if (
    event.params.from == Address.fromString(ZERO_ADDRESS) ||
    event.params.to == Address.fromString(ZERO_ADDRESS)
  ) {
    const sdk = SDK.initializeFromEvent(
      conf,
      new Pricer(),
      new TokenInit(),
      event
    );

    let token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
    const network = dataSource.network().toUpperCase().replace("-", "_");
    if (network == Network.BSC) {
      const BNB_ADDRESS = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
      token = sdk.Tokens.getOrCreateToken(Address.fromString(BNB_ADDRESS));
    }
    const pool = sdk.Pools.loadPool(token.id);
    if (!pool.isInitialized) {
      pool.initialize(token.name, token.symbol, [token.id], null);
    }

    let balance = BIGINT_ZERO;
    const ynETHContract = YNETH.bind(event.address);
    const balanceCall = ynETHContract.try_totalAssets();
    if (!balanceCall.reverted) {
      balance = balanceCall.value;
      pool.setInputTokenBalances([balance], true);
    }

    // Other Assets
    const registryContract = AssetRegistry.bind(
      Address.fromString(NetworkConfigs.getAssetRegistry())
    );
    const assetsCall = registryContract.try_getAssets();
    const balancesCall = registryContract.try_getAllAssetBalances();
    if (!assetsCall.reverted && !balancesCall.reverted) {
      const assets = assetsCall.value;
      const balances = balancesCall.value;

      for (let i = 0; i < assets.length; i++) {
        const token = sdk.Tokens.getOrCreateToken(assets[i]);
        const pool = sdk.Pools.loadPool(token.id);
        if (!pool.isInitialized) {
          pool.initialize(token.name, token.symbol, [token.id], null);
        }

        pool.setInputTokenBalances([balances[i]], true);
      }
    }

    const user = event.transaction.from;
    const account = sdk.Accounts.loadAccount(user);
    account.trackActivity();
  }
}

export function handleRewardsProcessed(event: RewardsProcessed): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }
  pool.addRevenueNative(token, event.params.netRewards, event.params.fees);
}
