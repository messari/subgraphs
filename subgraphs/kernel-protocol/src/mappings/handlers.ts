import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
} from "../sdk/util/constants";

import {
  MintFeeSet as MintFeeSetKRETH,
  RedeemFeeSet as RedeemFeeSetKRETH,
  Deposit as DepositKRETH,
  Redeemed as RedeemedKRETH,
  KRETH,
} from "../../generated/KRETH/KRETH";
import {
  MintFeeSet as MintFeeSetKSETH,
  RedeemFeeSet as RedeemFeeSetKSETH,
  Deposit as DepositKSETH,
  Redeemed as RedeemedKSETH,
  KSETH,
} from "../../generated/KSETH/KSETH";
import {
  MintFeeSet as MintFeeSetKUSD,
  RedeemFeeSet as RedeemFeeSetKUSD,
  Deposit as DepositKUSD,
  Redeemed as RedeemedKUSD,
  KUSD,
} from "../../generated/KUSD/KUSD";
import { _ERC20 } from "../../generated/KRETH/_ERC20";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    let returnPrice = BIGDECIMAL_ZERO;
    let tokenAddr = Address.fromBytes(token.id);

    if (
      [
        Address.fromString("0xf02c96dbbb92dc0325ad52b3f9f2b951f972bf00"),
        Address.fromString("0x513d27c94c0d81eed9dc2a88b4531a69993187cf"),
      ].includes(tokenAddr)
    ) {
      tokenAddr = Address.fromString(ETH_ADDRESS);
    }
    if (
      [
        Address.fromString("0x0bb9ab78aaf7179b7515e6753d89822b91e670c4"),
      ].includes(tokenAddr)
    ) {
      tokenAddr = Address.fromString(
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
      );
    }

    const customPrice = getUsdPricePerToken(tokenAddr);
    returnPrice = customPrice.usdPrice;
    return returnPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    let returnPrice = BIGDECIMAL_ZERO;
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    returnPrice = this.getTokenPrice(token);
    return returnPrice.times(_amount);
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

// krETH

export function handleMintFeeSetKRETH(event: MintFeeSetKRETH): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  pool.setMintFee(event.params.newFee);
}

export function handleRedeemFeeSetKRETH(event: RedeemFeeSetKRETH): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  pool.setRedeemFee(event.params.newFee);
}

export function handleDepositKRETH(event: DepositKRETH): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = KRETH.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const fee = pool.getFee()[0];
  pool.addRevenueNative(
    token,
    BIGINT_ZERO,
    bigDecimalToBigInt(
      event.params.krETHReceived
        .toBigDecimal()
        .times(fee.toBigDecimal().div(BIGDECIMAL_HUNDRED))
    )
  );

  const user = event.params.staker;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRedeemedKRETH(event: RedeemedKRETH): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = KRETH.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const fee = pool.getFee()[1];
  pool.addRevenueNative(
    token,
    BIGINT_ZERO,
    bigDecimalToBigInt(
      event.params.krETHBurned
        .toBigDecimal()
        .times(fee.toBigDecimal().div(BIGDECIMAL_HUNDRED))
    )
  );

  const user = event.params.staker;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

// ksETH

export function handleMintFeeSetKSETH(event: MintFeeSetKSETH): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  pool.setMintFee(event.params.newFee);
}

export function handleRedeemFeeSetKSETH(event: RedeemFeeSetKSETH): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  pool.setRedeemFee(event.params.newFee);
}

export function handleDepositKSETH(event: DepositKSETH): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = KSETH.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const fee = pool.getFee()[0];
  pool.addRevenueNative(
    token,
    BIGINT_ZERO,
    bigDecimalToBigInt(
      event.params.ksETHReceived
        .toBigDecimal()
        .times(fee.toBigDecimal().div(BIGDECIMAL_HUNDRED))
    )
  );

  const user = event.params.staker;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRedeemedKSETH(event: RedeemedKSETH): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = KSETH.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const fee = pool.getFee()[1];
  pool.addRevenueNative(
    token,
    BIGINT_ZERO,
    bigDecimalToBigInt(
      event.params.ksETHBurned
        .toBigDecimal()
        .times(fee.toBigDecimal().div(BIGDECIMAL_HUNDRED))
    )
  );

  const user = event.params.staker;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

// kUSD

export function handleMintFeeSetKUSD(event: MintFeeSetKUSD): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  pool.setMintFee(event.params.newFee);
}

export function handleRedeemFeeSetKUSD(event: RedeemFeeSetKUSD): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  pool.setRedeemFee(event.params.newFee);
}

export function handleDepositKUSD(event: DepositKUSD): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = KUSD.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const fee = pool.getFee()[0];
  pool.addRevenueNative(
    token,
    BIGINT_ZERO,
    bigDecimalToBigInt(
      event.params.kUSDReceived
        .toBigDecimal()
        .times(fee.toBigDecimal().div(BIGDECIMAL_HUNDRED))
    )
  );

  const user = event.params.staker;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRedeemedKUSD(event: RedeemedKUSD): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const token = sdk.Tokens.getOrCreateToken(event.address);
  const pool = sdk.Pools.loadPool(token.id);
  if (!pool.isInitialized) {
    pool.initialize(token.name, token.symbol, [token.id], null);
  }

  const contract = KUSD.bind(event.address);
  const supply = contract.totalSupply();
  pool.setInputTokenBalances([supply], true);

  const fee = pool.getFee()[1];
  pool.addRevenueNative(
    token,
    BIGINT_ZERO,
    bigDecimalToBigInt(
      event.params.kUSDBurned
        .toBigDecimal()
        .times(fee.toBigDecimal().div(BIGDECIMAL_HUNDRED))
    )
  );

  const user = event.params.staker;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}
