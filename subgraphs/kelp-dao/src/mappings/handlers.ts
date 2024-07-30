import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { getUpdatedPricedToken } from "./helpers";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { BIGINT_MINUS_ONE, ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import { Token } from "../../generated/schema";
import {
  AssetDeposit,
  ETHDeposit,
} from "../../generated/LRTDepositPool/LRTDepositPool";
import { RSETH } from "../../generated/LRTDepositPool/RSETH";
import {
  AssetWithdrawalQueued,
  AssetWithdrawalFinalized,
} from "../../generated/LRTWithdrawalManager/LRTWithdrawalManager";
import { _ERC20 } from "../../generated/LRTDepositPool/_ERC20";

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
        log.debug("[getTokenParams] nameCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const symbolCall = erc20.try_symbol();
      if (!symbolCall.reverted) {
        symbol = symbolCall.value;
      } else {
        log.debug("[getTokenParams] symbolCall reverted for {}", [
          address.toHexString(),
        ]);
      }
      const decimalsCall = erc20.try_decimals();
      if (!decimalsCall.reverted) {
        decimals = decimalsCall.value.toI32();
      } else {
        log.debug("[getTokenParams] decimalsCall reverted for {}", [
          address.toHexString(),
        ]);
      }
    }
    const tokenParams = new TokenParams(name, symbol, decimals);

    return tokenParams;
  }
}

export function handleAssetDeposit(event: AssetDeposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.params.asset);
  const outputToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getLRT())
  );

  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], outputToken, true);
  }

  const amount = event.params.depositAmount;
  pool.addInputTokenBalances([amount], true);

  const lrtContract = RSETH.bind(Address.fromString(NetworkConfigs.getLRT()));
  const supply = lrtContract.totalSupply();
  pool.setOutputTokenSupply(outputToken, supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleETHDeposit(event: ETHDeposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const outputToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getLRT())
  );

  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], outputToken, true);
  }

  const amount = event.params.depositAmount;
  pool.addInputTokenBalances([amount], true);

  const lrtContract = RSETH.bind(Address.fromString(NetworkConfigs.getLRT()));
  const supply = lrtContract.totalSupply();
  pool.setOutputTokenSupply(outputToken, supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleAssetWithdrawalQueued(
  event: AssetWithdrawalQueued
): void {
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

export function handleAssetWithdrawalFinalized(
  event: AssetWithdrawalFinalized
): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(event.params.asset);
  const outputToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getLRT())
  );

  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], outputToken, true);
  }

  const amount = event.params.amountReceived;
  pool.addInputTokenBalances([amount.times(BIGINT_MINUS_ONE)], true);

  const lrtContract = RSETH.bind(Address.fromString(NetworkConfigs.getLRT()));
  const supply = lrtContract.totalSupply();
  pool.setOutputTokenSupply(outputToken, supply);
}
