import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";
import { getUpdatedPricedToken } from "./helpers";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { ETH_ADDRESS, INT_ZERO, ZERO_ADDRESS } from "../sdk/util/constants";

import {
  Stake,
  RequestWithdraw,
  ClaimWithdraw,
} from "../../generated/OraStakeRouter/OraStakeRouter";
import { OraStakePool } from "../../generated/OraStakeRouter/OraStakePool";
import { _ERC20 } from "../../generated/OraStakeRouter/_ERC20";
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

export function handleStake(event: Stake): void {
  if (
    [
      Address.fromString("0x4f5e12233ed7ca1699894174fcbd77c7ed60b03d"),
      Address.fromString("0x07b022bd57e22c8c5abc577535cf25e483dae3df"),
    ].includes(event.params.pool)
  ) {
    return;
  }

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const poolContract = OraStakePool.bind(event.params.pool);
  let tokenAddr = poolContract.stakingTokenAddress();
  if (tokenAddr == Address.fromString(ZERO_ADDRESS)) {
    tokenAddr = Address.fromString(ETH_ADDRESS);
  }
  const token = sdk.Tokens.getOrCreateToken(tokenAddr);
  const pool = sdk.Pools.loadPool(event.params.pool);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }
  pool.setInputTokenBalances([poolContract.totalAssets()], true);

  const user = event.params.user;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRequestWithdraw(event: RequestWithdraw): void {
  if (
    [
      Address.fromString("0x4f5e12233ed7ca1699894174fcbd77c7ed60b03d"),
      Address.fromString("0x07b022bd57e22c8c5abc577535cf25e483dae3df"),
    ].includes(event.params.pool)
  ) {
    return;
  }

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const user = event.params.user;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleClaimWithdraw(event: ClaimWithdraw): void {
  if (
    [
      Address.fromString("0x4f5e12233ed7ca1699894174fcbd77c7ed60b03d"),
      Address.fromString("0x07b022bd57e22c8c5abc577535cf25e483dae3df"),
    ].includes(event.params.pool)
  ) {
    return;
  }

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const poolContract = OraStakePool.bind(event.params.pool);
  let tokenAddr = poolContract.stakingTokenAddress();
  if (tokenAddr == Address.fromString(ZERO_ADDRESS)) {
    tokenAddr = Address.fromString(ETH_ADDRESS);
  }
  const token = sdk.Tokens.getOrCreateToken(tokenAddr);
  const pool = sdk.Pools.loadPool(event.params.pool);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }
  pool.setInputTokenBalances([poolContract.totalAssets()], true);
}
