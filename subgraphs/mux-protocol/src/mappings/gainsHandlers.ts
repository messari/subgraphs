import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  LimitExecuted,
  MarketExecuted,
} from "../../generated/CallbacksV6.3/Callbacks";
import { PairInfo } from "../../generated/CallbacksV6.3/PairInfo";
import { Referrals } from "../../generated/CallbacksV6.3/Referrals";

import { LiquidityPool, Token } from "../../generated/schema";
import { EventType } from "../entities/event";
import { getOrCreateToken } from "../entities/token";
import {
  getOrCreateAccount,
  incrementAccountEventCount,
} from "../entities/account";
import { incrementProtocolEventCount } from "../entities/protocol";
import {
  getOrCreateLiquidityPool,
  updatePoolFundingRate,
} from "../entities/pool";
import { takeSnapshots } from "../entities/snapshots";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DAI_ADDRESS_ARBITRUM,
  GAINS_POOL_NAME,
  GAINS_POOL_SYMBOL,
  GAINS_PRECISION_DECIMALS,
  BIGDECIMAL_HUNDRED,
  GAINS_PAIRINFO_ADDRESS,
  GAINS_VAULT_ADDRESS,
  GAINS_REFERRALS_ADDRESS,
  GAINS_MUX_REFERRER_ADDRESS,
  INT_THREE,
  INT_TWO,
} from "../utils/constants";
import { convertToDecimal, exponentToBigDecimal } from "../utils/numbers";
import { RewardIntervalType, getRewardsPerDay } from "../entities/rewards";
import { handleUpdatePositionEvent } from "./handlers";

// Event emitted when a trade executes immediately, at the market price
export function handleMarketExecuted(event: MarketExecuted): void {
  const daiAddress = Address.fromString(DAI_ADDRESS_ARBITRUM);
  let eventType = EventType.CollateralOut;
  if (event.params.open) {
    eventType = EventType.CollateralIn;
  }
  handleGainsUpdatePositionEvent(
    event,
    event.params.t.trader,
    daiAddress,
    event.params.positionSizeDai,
    daiAddress,
    event.params.positionSizeDai.times(event.params.t.leverage),
    event.params.t.buy,
    eventType,
    event.params.percentProfit,
    event.params.t.pairIndex
  );
}

// Event emitted when a trade executes at exact price set if price reaches threshold
export function handleLimitExecuted(event: LimitExecuted): void {
  const daiAddress = Address.fromString(DAI_ADDRESS_ARBITRUM);
  // orderType [TP, SL, LIQ, OPEN] (0-index)
  let eventType = EventType.CollateralOut;
  if (event.params.orderType == INT_THREE) {
    eventType = EventType.CollateralIn;
  } else if (event.params.orderType == INT_TWO) {
    eventType = EventType.Liquidated;
  }
  handleGainsUpdatePositionEvent(
    event,
    event.params.t.trader,
    daiAddress,
    event.params.positionSizeDai,
    daiAddress,
    event.params.positionSizeDai.times(event.params.t.leverage),
    event.params.t.buy,
    eventType,
    event.params.percentProfit,
    event.params.t.pairIndex
  );
}

export function handleGainsUpdatePositionEvent(
  event: ethereum.Event,
  accountAddress: Address,
  collateralTokenAddress: Address,
  collateralAmountDelta: BigInt,
  indexTokenAddress: Address,
  indexTokenAmountDelta: BigInt,
  isLong: boolean,
  eventType: EventType,
  percentProfit: BigInt,
  PairIndex: BigInt
): void {
  // If the referrer address from Gains Trade Referrals contract call is not related with MUX protocol, the trading does not come from MUX protocol.
  const referralsContract = Referrals.bind(
    Address.fromString(GAINS_REFERRALS_ADDRESS)
  );
  const referrer = referralsContract.getTraderReferrer(accountAddress);
  if (referrer.toHexString().toLowerCase() != GAINS_MUX_REFERRER_ADDRESS) {
    return;
  }

  const pool = getOrCreateLiquidityPool(
    event,
    Address.fromString(GAINS_VAULT_ADDRESS),
    GAINS_POOL_NAME,
    GAINS_POOL_SYMBOL
  );
  takeSnapshots(event, pool);

  const account = getOrCreateAccount(event, pool, accountAddress);
  incrementAccountEventCount(
    event,
    pool,
    account,
    eventType,
    indexTokenAmountDelta
  );
  incrementProtocolEventCount(event, eventType, indexTokenAmountDelta);

  const indexToken = getOrCreateToken(event, indexTokenAddress);
  const sizeUSDDelta = convertToDecimal(
    indexTokenAmountDelta,
    indexToken.decimals
  ).times(indexToken.lastPriceUSD!);
  const collateralToken = getOrCreateToken(event, collateralTokenAddress);
  const collateralUSDDelta = convertToDecimal(
    collateralAmountDelta,
    collateralToken.decimals
  ).times(collateralToken.lastPriceUSD!);
  setFundingRate(event, pool, collateralToken, PairIndex);

  const pnlUSD = collateralUSDDelta
    .times(convertToDecimal(percentProfit, GAINS_PRECISION_DECIMALS))
    .div(BIGDECIMAL_HUNDRED)
    .times(collateralUSDDelta);
  let positionBalance = BIGINT_ZERO;
  let positionBalanceUSD = BIGDECIMAL_ZERO;
  let positionCollateralBalance = BIGINT_ZERO;
  let positionCollateralBalanceUSD = BIGDECIMAL_ZERO;
  if (eventType == EventType.CollateralIn) {
    positionBalance = indexTokenAmountDelta;
    positionBalanceUSD = sizeUSDDelta;
    positionCollateralBalance = collateralAmountDelta;
    positionCollateralBalanceUSD = collateralUSDDelta;
  }

  handleUpdatePositionEvent(
    event,
    pool,
    account,
    collateralToken,
    collateralAmountDelta,
    collateralUSDDelta,
    positionCollateralBalance,
    positionCollateralBalanceUSD,
    indexToken,
    sizeUSDDelta,
    positionBalance,
    positionBalanceUSD,
    pnlUSD,
    isLong,
    eventType,
    pnlUSD
  );
}

function setFundingRate(
  event: ethereum.Event,
  pool: LiquidityPool,
  token: Token,
  pairIndex: BigInt
): BigDecimal {
  const pairInfoContract = PairInfo.bind(
    Address.fromString(GAINS_PAIRINFO_ADDRESS)
  );
  const fundingRatePerBlockCall =
    pairInfoContract.try_getFundingFeePerBlockP(pairIndex);
  if (fundingRatePerBlockCall.reverted) {
    return BIGDECIMAL_ZERO;
  }
  const fundingRatePerBlock = fundingRatePerBlockCall.value;
  const fundingRatePerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    fundingRatePerBlock.toBigDecimal(),
    RewardIntervalType.BLOCK
  ).div(exponentToBigDecimal(GAINS_PRECISION_DECIMALS));
  updatePoolFundingRate(event, pool, token, fundingRatePerDay);

  return fundingRatePerDay;
}
