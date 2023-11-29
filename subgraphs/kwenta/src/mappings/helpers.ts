import {
  Address,
  BigInt,
  Bytes,
  dataSource,
  ethereum,
} from "@graphprotocol/graph-ts";

import { Pool } from "../sdk/protocols/perpfutures/pool";
import { BIGINT_ZERO } from "../sdk/util/constants";

import {
  Token,
  _FundingRate,
  _MarketKey,
  _SmartMarginAccount,
} from "../../generated/schema";
import { SDK } from "../sdk/protocols/perpfutures";
import { NetworkConfigs } from "../../configurations/configure";
import { bigIntToBigDecimal } from "../sdk/util/numbers";
import { PerpsV2MarketProxyable } from "../../generated/templates/PerpsV2Market/PerpsV2MarketProxyable";

export function createTokenAmountArray(
  pool: Pool,
  tokens: Token[],
  amounts: BigInt[]
): BigInt[] {
  if (tokens.length != amounts.length) {
    return new Array<BigInt>();
  }

  const tokenAmounts = new Array<BigInt>(pool.getInputTokens().length).fill(
    BIGINT_ZERO
  );

  for (let idx = 0; idx < amounts.length; idx++) {
    const indexOfToken = pool.getInputTokens().indexOf(tokens[idx].id);
    tokenAmounts[indexOfToken] = amounts[idx];
  }

  return tokenAmounts;
}

export function getFundingRateId(pool: Pool, fundingIndex: BigInt): Bytes {
  return pool
    .getBytesID()
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromByteArray(Bytes.fromBigInt(fundingIndex)));
}

export function liquidation(
  event: ethereum.Event,
  sendingAccount: Address,
  liquidator: Address,
  totalFees: BigInt,
  stakerFees: BigInt,
  sdk: SDK
): void {
  const pool = sdk.Pools.loadPool(dataSource.address());
  const smartMarginAccount = _SmartMarginAccount.load(sendingAccount);
  const accountAddress = smartMarginAccount
    ? Address.fromBytes(smartMarginAccount.owner)
    : sendingAccount;

  const loadAccountResponse = sdk.Accounts.loadAccount(accountAddress);
  const account = loadAccountResponse.account;
  if (loadAccountResponse.isNewUser) {
    const protocol = sdk.Protocol;
    protocol.addUser();
    pool.addUser();
  }
  const token = sdk.Tokens.getOrCreateToken(NetworkConfigs.getSUSDAddress());

  const position = sdk.Positions.loadLastPosition(pool, account);
  if (position != null) {
    let fundingRate = BIGINT_ZERO;

    const positionFunding = _FundingRate.load(
      getFundingRateId(pool, position.getFundingIndex())
    );
    if (positionFunding != null) {
      fundingRate = positionFunding.funding;
    }
    const pnl = position
      .getRealisedPnlUsd()
      .minus(bigIntToBigDecimal(totalFees));
    account.liquidate(
      pool,
      Address.fromBytes(token.id),
      Address.fromBytes(token.id),
      position.position.collateralBalance,
      liquidator,
      accountAddress,
      position.getBytesID(),
      pnl
    );
    position.addLiquidationCount();
    position.setBalanceClosed(token, BIGINT_ZERO);
    position.setCollateralBalanceClosed(token, BIGINT_ZERO);
    position.setRealisedPnlUsdClosed(pnl);
    position.setFundingrateClosed(bigIntToBigDecimal(fundingRate));

    position.closePosition();
    pool.addClosedInflowVolumeByToken(token, stakerFees);
  }
}

export function updateOpenInterest(
  marketAddress: Address,
  pool: Pool,
  lastPrice: BigInt
): void {
  const contract = PerpsV2MarketProxyable.bind(marketAddress);
  const marketSizeCall = contract.try_marketSize();
  const marketSkewCall = contract.try_marketSkew();
  let marketSize = BIGINT_ZERO;
  let marketSkew = BIGINT_ZERO;
  if (!marketSizeCall.reverted && !marketSkewCall.reverted) {
    marketSize = marketSizeCall.value;
    marketSkew = marketSkewCall.value;
  }

  const shortOpenInterstAmount = marketSize
    .minus(marketSkew)
    .div(BigInt.fromI32(2));
  const longOpenInterstAmount = marketSize
    .plus(marketSkew)
    .div(BigInt.fromI32(2));
  pool.setLongOpenInterest(longOpenInterstAmount, lastPrice);
  pool.setShortOpenInterest(shortOpenInterstAmount, lastPrice);
}

export function loadMarketKey(marketKey: Bytes, pool: Pool): Bytes {
  let marketKeyEntity = _MarketKey.load(marketKey);
  if (marketKeyEntity == null) {
    marketKeyEntity = new _MarketKey(marketKey);
  }
  marketKeyEntity.market = pool.getBytesID();
  marketKeyEntity.save();
  return marketKeyEntity.id;
}
