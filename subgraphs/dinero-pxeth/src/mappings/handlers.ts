import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { getUpdatedPricedToken } from "./helpers";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import { ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import {
  Deposit,
  ValidatorDeposit,
  EmergencyWithdrawal,
  InitiateRedemption,
  RedeemWithPxEth,
} from "../../generated/PirexETH/PirexETH";
import { DistributeFees } from "../../generated/PirexFees/PirexFees";
import { PXETH } from "../../generated/PirexETH/PXETH";
import { _ERC20 } from "../../generated/PirexETH/_ERC20";
import { Token } from "../../generated/schema";

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

export function handleDeposit(event: Deposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getLSTAddress()
  );

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], outputToken);
  }

  const pxETH = PXETH.bind(NetworkConfigs.getLSTAddress());
  const supply = pxETH.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleValidatorDeposit(event: ValidatorDeposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getLSTAddress()
  );

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], outputToken);
  }

  const pxETH = PXETH.bind(NetworkConfigs.getLSTAddress());
  const supply = pxETH.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleEmergencyWithdrawal(event: EmergencyWithdrawal): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getLSTAddress()
  );

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], outputToken);
  }

  const pxETH = PXETH.bind(NetworkConfigs.getLSTAddress());
  const supply = pxETH.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleInitiateRedemption(event: InitiateRedemption): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getLSTAddress()
  );

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], outputToken);
  }

  const pxETH = PXETH.bind(NetworkConfigs.getLSTAddress());
  const supply = pxETH.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRedeemWithPxEth(event: RedeemWithPxEth): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getLSTAddress()
  );

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], outputToken);
  }

  const pxETH = PXETH.bind(NetworkConfigs.getLSTAddress());
  const supply = pxETH.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleDistributeFees(event: DistributeFees): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const outputToken = sdk.Tokens.getOrCreateToken(
    NetworkConfigs.getLSTAddress()
  );

  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], outputToken);
  }

  const fee = event.params.amount; // 10% of yield
  const rewards = BigDecimal.fromString("9").times(fee.toBigDecimal()); // 90% of yield

  pool.addRevenueNative(token, bigDecimalToBigInt(rewards), fee);
}
