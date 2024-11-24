import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { getUpdatedPricedToken } from "./helpers";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
  ZERO_ADDRESS,
} from "../sdk/util/constants";

import { Transfer, INETH } from "../../generated/INETH/INETH";
import {
  Deposit,
  Redeem,
  Withdraw,
  FlashWithdraw,
  INVault,
} from "../../generated/INETH/INVault";
import { Strategy } from "../../generated/INETH/Strategy";
import { _ERC20 } from "../../generated/INETH/_ERC20";
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

export function handleTransfer(event: Transfer): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  let token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  let balance = BIGINT_ZERO;
  const inETHContract = INETH.bind(event.address);
  const balanceCall = inETHContract.try_totalAssets();
  if (!balanceCall.reverted) {
    balance = balanceCall.value;
    pool.setInputTokenBalances([balance], true);
  }

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleDeposit(event: Deposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const vaultContract = INVault.bind(event.address);
  const strategy = vaultContract.strategy();
  const strategyContract = Strategy.bind(strategy);
  const asset = strategyContract.underlyingToken();

  let token = sdk.Tokens.getOrCreateToken(asset);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  let balance = BIGINT_ZERO;
  const inVaultContract = INVault.bind(event.address);
  const balanceCall = inVaultContract.try_getTotalDeposited();
  if (!balanceCall.reverted) {
    balance = balanceCall.value;
    pool.setInputTokenBalances([balance], true);
  }

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

  const vaultContract = INVault.bind(event.address);
  const strategy = vaultContract.strategy();
  const strategyContract = Strategy.bind(strategy);
  const asset = strategyContract.underlyingToken();

  let token = sdk.Tokens.getOrCreateToken(asset);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  let balance = BIGINT_ZERO;
  const inVaultContract = INVault.bind(event.address);
  const balanceCall = inVaultContract.try_getTotalDeposited();
  if (!balanceCall.reverted) {
    balance = balanceCall.value;
    pool.setInputTokenBalances([balance], true);
  }

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleWithdraw(event: Withdraw): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const vaultContract = INVault.bind(event.address);
  const strategy = vaultContract.strategy();
  const strategyContract = Strategy.bind(strategy);
  const asset = strategyContract.underlyingToken();

  let token = sdk.Tokens.getOrCreateToken(asset);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  let balance = BIGINT_ZERO;
  const inVaultContract = INVault.bind(event.address);
  const balanceCall = inVaultContract.try_getTotalDeposited();
  if (!balanceCall.reverted) {
    balance = balanceCall.value;
    pool.setInputTokenBalances([balance], true);
  }

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleFlashWithdraw(event: FlashWithdraw): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const vaultContract = INVault.bind(event.address);
  const strategy = vaultContract.strategy();
  const strategyContract = Strategy.bind(strategy);
  const asset = strategyContract.underlyingToken();

  let token = sdk.Tokens.getOrCreateToken(asset);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  let balance = BIGINT_ZERO;
  const inVaultContract = INVault.bind(event.address);
  const balanceCall = inVaultContract.try_getTotalDeposited();
  if (!balanceCall.reverted) {
    balance = balanceCall.value;
    pool.setInputTokenBalances([balance], true);
  }

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();

  pool.addRevenueNative(token, BIGINT_ZERO, event.params.fee);
}
