import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { bigDecimalToBigInt, bigIntToBigDecimal } from "../sdk/util/numbers";
import { ETH_ADDRESS, INT_ZERO } from "../sdk/util/constants";

import { Token } from "../../generated/schema";
import { _ERC20 } from "../../generated/LSETH/_ERC20";
import { LSETH, PulledELFees, UserDeposit } from "../../generated/LSETH/LSETH";
import {
  RequestedRedeem,
  ClaimedRedeemRequest,
} from "../../generated/RedeemManager/RedeemManager";

const conf = new ProtocolConfig(
  NetworkConfigs.getProtocolId(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    return getUsdPricePerToken(Address.fromBytes(token.id)).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const _amount = bigIntToBigDecimal(amount, token.decimals);
    return getUsdPrice(Address.fromBytes(token.id), _amount);
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

export function handlePulledELFees(event: PulledELFees): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const outputToken = sdk.Tokens.getOrCreateToken(event.address);

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token.id],
      outputToken,
      true
    );
  }

  const fee = event.params.amount;
  const rewards = BigDecimal.fromString("85")
    .div(BigDecimal.fromString("15"))
    .times(fee.toBigDecimal());

  pool.addRevenueNative(token, fee, bigDecimalToBigInt(rewards));

  const lstContract = LSETH.bind(event.address);
  const supply = lstContract.totalSupply();
  pool.setOutputTokenSupply(outputToken, supply);
}

export function handleUserDeposit(event: UserDeposit): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const outputToken = sdk.Tokens.getOrCreateToken(event.address);

  const pool = sdk.Pools.loadPool(event.address);
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token.id],
      outputToken,
      true
    );
  }

  const lstContract = LSETH.bind(event.address);

  const underlyingSupply = lstContract.totalUnderlyingSupply();
  pool.setInputTokenBalances([underlyingSupply], true);

  const supply = lstContract.totalSupply();
  pool.setOutputTokenSupply(outputToken, supply);

  const user = event.transaction.from;
  const account = sdk.Accounts.loadAccount(user);
  account.trackActivity();
}

export function handleRequestedRedeem(event: RequestedRedeem): void {
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

export function handleClaimedRedeemRequest(event: ClaimedRedeemRequest): void {
  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const outputToken = sdk.Tokens.getOrCreateToken(
    Address.fromString(NetworkConfigs.getProtocolId())
  );

  const pool = sdk.Pools.loadPool(
    Address.fromString(NetworkConfigs.getProtocolId())
  );
  if (!pool.isInitialized) {
    pool.initialize(
      outputToken.name,
      outputToken.symbol,
      [token.id],
      outputToken,
      true
    );
  }

  const lstContract = LSETH.bind(
    Address.fromString(NetworkConfigs.getProtocolId())
  );

  const underlyingSupply = lstContract.totalUnderlyingSupply();
  pool.setInputTokenBalances([underlyingSupply], true);

  const supply = lstContract.totalSupply();
  pool.setOutputTokenSupply(outputToken, supply);
}
