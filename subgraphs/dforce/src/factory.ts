import { log } from "@graphprotocol/graph-ts";
import {
  Factory,
  MarketAdded,
  MintPaused,
  RedeemPaused,
  BorrowPaused,
  TransferPaused,
  NewCollateralFactor,
  NewLiquidationIncentive,
} from "../generated/Factory/Factory";
import { iToken, Reward } from "../generated/templates";
import {
  MANTISSA_DECIMALS,
  BIGDECIMAL_ONE,
  FACTORY_ADDRESS,
  BIGINT_ZERO,
  BIGDECIMAL_HUNDRED,
} from "./common/constants";
import {
  getOrCreateToken,
  getOrCreateUnderlyingToken,
  getOrCreateMarket,
  getOrCreateProtocol,
  getOrCreateMarketStatus,
} from "./common/getters";
import { Market, _MarketStatus } from "../generated/schema";
import { anyTrue, decimalsToBigDecimal } from "./common/utils";
import { NewRewardDistributor } from "../generated/Factory/Factory";

export function handleAdded(event: MarketAdded): void {
  getOrCreateProtocol();

  getOrCreateToken(event.params.iToken);
  getOrCreateUnderlyingToken(event.params.iToken);

  let marketAddr = event.params.iToken.toHexString();
  getOrCreateMarket(marketAddr, event);

  // trigger iToken template
  iToken.create(event.params.iToken);
}

// toggle market.isActive based on pause status of mint/redeem/transfer
export function handleMintPaused(event: MintPaused): void {
  let marketId = event.params.iToken.toHexString();
  let market = getOrCreateMarket(marketId, event);
  let _marketStatus = getOrCreateMarketStatus(marketId);

  _marketStatus.mintPaused = event.params.paused;
  // isActive = false if any one of mint/redeem/transfer is paused
  market.isActive = !anyTrue([_marketStatus.mintPaused, _marketStatus.redeemPaused, _marketStatus.transferPaused]);

  market.save();
  _marketStatus.save();
}

// toggle market.isActive based on pause status of mint/redeem/transfer
export function handleRedeemPaused(event: RedeemPaused): void {
  let marketId = event.params.iToken.toHexString();
  let market = getOrCreateMarket(marketId, event);
  let _marketStatus = getOrCreateMarketStatus(marketId);

  _marketStatus.redeemPaused = event.params.paused;
  // isActive = false if any one of mint/redeem/transfer is paused
  market.isActive = !anyTrue([_marketStatus.mintPaused, _marketStatus.redeemPaused, _marketStatus.transferPaused]);

  market.save();
  _marketStatus.save();
}

// toggle market.isActive based on pause status of mint/redeem/transfer
// transfer pause stops transfer of all iTokens
export function handleTransferPaused(event: TransferPaused): void {
  let protocol = getOrCreateProtocol();
  let markets = protocol.markets;
  for (let i = 0; i < markets.length; i++) {
    let marketId = markets[i];
    let market = getOrCreateMarket(marketId, event);
    let _marketStatus = getOrCreateMarketStatus(marketId);
    _marketStatus.transferPaused = event.params.paused;
    // isActive = false if any one of mint/redeem/transfer is paused
    market.isActive = !anyTrue([_marketStatus.mintPaused, _marketStatus.redeemPaused, _marketStatus.transferPaused]);

    market.save();
    _marketStatus.save();
  }
}

export function handleBorrowPaused(event: BorrowPaused): void {
  // toggle market.canBorrowFrom based on BorrowPaused event
  let marketId = event.params.iToken.toHexString();
  let market = Market.load(marketId);
  if (market != null) {
    market.canBorrowFrom = !event.params.paused;
    market.save();
  } else {
    log.warning("Market {} does not exist.", [marketId]);
  }
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let marketId = event.params.iToken.toHexString();
  let market = getOrCreateMarket(marketId, event);
  let ltvFactor = event.params.newCollateralFactorMantissa
    .toBigDecimal()
    .div(decimalsToBigDecimal(MANTISSA_DECIMALS))
    .times(BIGDECIMAL_HUNDRED);
  market.maximumLTV = ltvFactor;
  market.liquidationThreshold = ltvFactor;
  market.save();
}

export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  // NewLiquidationIncentive applies to all markets
  let protocol = getOrCreateProtocol();
  let markets = protocol.markets;
  for (let i = 0; i < markets.length; i++) {
    let market = getOrCreateMarket(markets[i], event);
    let liquidationPenalty = event.params.newLiquidationIncentiveMantissa
      .toBigDecimal()
      .div(decimalsToBigDecimal(MANTISSA_DECIMALS))
      .minus(BIGDECIMAL_ONE)
      .times(BIGDECIMAL_HUNDRED);
    market.liquidationPenalty = liquidationPenalty;

    market.save();
  }
}

export function handleNewRewardDistributor(event: NewRewardDistributor): void {
  // trigger RewardDistributor template
  Reward.create(event.params._newRewardDistributor);
}
