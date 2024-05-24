import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from "@graphprotocol/graph-ts";

import { Versions } from "../versions";
import { NetworkConfigs } from "../../configurations/configure";
import { getUsdPrice, getUsdPricePerToken } from "../prices";

import { SDK } from "../sdk/protocols/generic";
import { TokenInitializer, TokenParams } from "../sdk/protocols/generic/tokens";
import { ProtocolConfig, TokenPricer } from "../sdk/protocols/config";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import {
  BIGINT_MINUS_ONE,
  BIGINT_TEN,
  ETH_ADDRESS,
  INT_ZERO,
} from "../sdk/util/constants";

import {
  Staked,
  UnstakeRequested,
  UnstakeRequestClaimed,
} from "../../generated/Staking/Staking";
import {
  FeesCollected,
  ReturnsAggregator,
} from "../../generated/ReturnsAggregator/ReturnsAggregator";
import { _ERC20 } from "../../generated/Staking/_ERC20";
import { METH } from "../../generated/Staking/METH";
import { Token, _UnstakeRequest } from "../../generated/schema";

const conf = new ProtocolConfig(
  NetworkConfigs.getLSTAddress().toHexString(),
  NetworkConfigs.getProtocolName(),
  NetworkConfigs.getProtocolSlug(),
  Versions
);

class Pricer implements TokenPricer {
  getTokenPrice(token: Token): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);

    return getUsdPricePerToken(pricedToken).usdPrice;
  }

  getAmountValueUSD(token: Token, amount: BigInt): BigDecimal {
    const pricedToken = Address.fromBytes(token.id);
    const _amount = bigIntToBigDecimal(amount, token.decimals);

    return getUsdPrice(pricedToken, _amount);
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

export function handleStaked(event: Staked): void {
  const staker = event.params.staker;
  const ethAmount = event.params.ethAmount;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], lst, true);
  }
  pool.addInputTokenBalances([ethAmount], true);

  const mETH = METH.bind(Address.fromBytes(lst.id));
  const supply = mETH.totalSupply();
  pool.setOutputTokenSupply(lst, supply);

  const account = sdk.Accounts.loadAccount(staker);
  account.trackActivity();
}

export function handleUnstakeRequested(event: UnstakeRequested): void {
  const staker = event.params.staker;
  const ethAmount = event.params.ethAmount;
  const nonce = event.params.id;

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );

  const account = sdk.Accounts.loadAccount(staker);
  account.trackActivity();

  const requestId = staker
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromUTF8(nonce.toString()));
  const unstakeRequest = new _UnstakeRequest(requestId);
  unstakeRequest.account = staker;
  unstakeRequest.nonce = nonce;
  unstakeRequest.amount = ethAmount;
  unstakeRequest.claimed = false;
  unstakeRequest.save();
}

export function handleUnstakeRequestClaimed(
  event: UnstakeRequestClaimed
): void {
  const staker = event.params.staker;
  const nonce = event.params.id;

  const requestId = staker
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromUTF8(nonce.toString()));
  const unstakeRequest = _UnstakeRequest.load(requestId);
  if (!unstakeRequest) {
    log.warning(
      "[UnstakeRequestClaimed] no unstake request found for staker: {} nonce: {}",
      [staker.toHexString(), nonce.toString()]
    );
    return;
  }

  const ethAmount = unstakeRequest.amount;
  unstakeRequest.claimed = true;
  unstakeRequest.save();

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], lst, true);
  }
  pool.addInputTokenBalances([ethAmount.times(BIGINT_MINUS_ONE)], true);

  const mETH = METH.bind(Address.fromBytes(lst.id));
  const supply = mETH.totalSupply();
  pool.setOutputTokenSupply(lst, supply);
}

export function handleFeesCollected(event: FeesCollected): void {
  const protocolSideamount = event.params.amount;

  const contract = ReturnsAggregator.bind(event.address);
  const feeBPSCall = contract.try_feesBasisPoints();
  if (feeBPSCall.reverted) {
    log.warning(
      "[FeesCollected] feesBasisPoints call failed on contract address: {}",
      [event.address.toHexString()]
    );
    return;
  }
  const feeBPS = feeBPSCall.value;
  const supplySideAmount = protocolSideamount.times(
    BigInt.fromI32(1 - feeBPS / 10000).times(BIGINT_TEN)
  );

  const sdk = SDK.initializeFromEvent(
    conf,
    new Pricer(),
    new TokenInit(),
    event
  );
  const token = sdk.Tokens.getOrCreateToken(Address.fromString(ETH_ADDRESS));
  const lst = sdk.Tokens.getOrCreateToken(NetworkConfigs.getLSTAddress());

  const pool = sdk.Pools.loadPool(lst.id);
  if (!pool.isInitialized) {
    pool.initialize(lst.name, lst.symbol, [token.id], lst, true);
  }
  pool.addRevenueNative(token, protocolSideamount, supplySideAmount);
}
