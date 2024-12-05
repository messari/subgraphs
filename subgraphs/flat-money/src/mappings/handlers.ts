import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGDECIMAL_HUNDRED,
  BIGDECIMAL_ZERO,
  BIGINT_MINUS_ONE,
  BIGINT_ZERO,
  ETH_ADDRESS,
  INT_ZERO,
} from "../sdk/util/constants";

import { Deposit, Withdraw, UNIT } from "../../generated/UNIT/UNIT";
import { PositionLiquidated } from "../../generated/UNIT/LiquidationModule";
import { OrderExecuted } from "../../generated/UNIT/DelayedOrder";
import { _ERC20 } from "../../generated/UNIT/_ERC20";
import { ChainlinkDataFeed } from "../../generated/UNIT/ChainlinkDataFeed";
import { Token } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);
const rETHAddr = Address.fromString(
  "0xb6fe221fe9eef5aba221c348ba20a1bf5e73624c"
);
const UNITAddr = Address.fromString(
  "0xb95fb324b8a2faf8ec4f76e3df46c718402736e2"
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    if (Address.fromBytes(token.id) == rETHAddr) {
      const datafeedETHUSD = ChainlinkDataFeed.bind(
        Address.fromString("0x71041dddad3595f9ced3dccfbe3d1f4b0a16bb70") // ETH / USD feed
      );
      const resultETHUSD = datafeedETHUSD.latestAnswer();
      const decimalsETHUSD = datafeedETHUSD.decimals();
      const ETHUSD = bigIntToBigDecimal(resultETHUSD, decimalsETHUSD);

      const datafeedRETHETH = ChainlinkDataFeed.bind(
        Address.fromString("0xf397bf97280b488ca19ee3093e81c0a77f02e9a5") // rETH / ETH feed
      );
      const resultRETHETH = datafeedRETHETH.latestAnswer();
      const decimalsRETHETH = datafeedRETHETH.decimals();
      const RETHETH = bigIntToBigDecimal(resultRETHETH, decimalsRETHETH);

      return RETHETH.times(ETHUSD);
    }
    return BIGDECIMAL_ZERO;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const usdPrice = this.getTokenPrice(token);
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

export function handleDeposit(event: Deposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(rETHAddr);
  const outputToken = sdk.Tokens.getOrCreateToken(UNITAddr);
  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(outputToken.name, outputToken.symbol, [token.id], null);
  }

  pool.addInputTokenBalances([event.params.depositAmount], true);
  pool.addOutputTokenSupply(event.params.mintedAmount);

  const user = event.params.depositor;
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
  const token = sdk.Tokens.getOrCreateToken(rETHAddr);
  const outputToken = sdk.Tokens.getOrCreateToken(UNITAddr);
  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(outputToken.name, outputToken.symbol, [token.id], null);
  }

  pool.addInputTokenBalances(
    [event.params.withdrawAmount.times(BIGINT_MINUS_ONE)],
    true
  );
  pool.addOutputTokenSupply(event.params.burnedAmount.times(BIGINT_MINUS_ONE));

  const contract = UNIT.bind(event.address);
  const withdrawFee = contract.stableWithdrawFee();
  const withdrawFeeAmount = bigDecimalToBigInt(
    event.params.withdrawAmount
      .toBigDecimal()
      .times(bigIntToBigDecimal(withdrawFee))
  );
  pool.addRevenueNative(token, withdrawFeeAmount, BIGINT_ZERO);

  const user = event.params.withdrawer;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handlePositionLiquidated(event: PositionLiquidated): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(rETHAddr);
  const outputToken = sdk.Tokens.getOrCreateToken(UNITAddr);
  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(outputToken.name, outputToken.symbol, [token.id], null);
  }

  pool.addRevenueNative(token, event.params.liquidationFee, BIGINT_ZERO);
}

export function handleOrderExecuted(event: OrderExecuted): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(rETHAddr);
  const outputToken = sdk.Tokens.getOrCreateToken(UNITAddr);
  const pool = sdk.Pools.loadPool(outputToken.id);
  if (!pool.isInitialized) {
    pool.initialize(outputToken.name, outputToken.symbol, [token.id], null);
  }

  pool.addRevenueNative(token, event.params.keeperFee, BIGINT_ZERO);
}
