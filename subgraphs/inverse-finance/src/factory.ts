import { Address, log } from "@graphprotocol/graph-ts";
import { CToken } from "../generated/templates";
import {
  Factory,
  MarketListed,
  ActionPaused,
  ActionPaused1,
  NewCloseFactor,
  NewCollateralFactor,
  NewLiquidationIncentive,
  DistributedBorrowerComp,
  DistributedSupplierComp,
} from "../generated/Factory/Factory";
import { MANTISSA_DECIMALS, BIGDECIMAL_ONE, FACTORY_ADDRESS, BIGINT_ZERO, BIGDECIMAL_HUNDRED } from './common/constants';
import { getOrCreateToken, getOrCreateUnderlyingToken, getOrCreateMarket, getOrCreateProtocol } from "./common/getters";
import { Market } from "../generated/schema";
import { updateMarketEmission } from "./common/helpers";
import { decimalsToBigDecimal } from "./common/utils";

export function handleMarketListed(event: MarketListed): void {
  let protocol = getOrCreateProtocol();

  getOrCreateToken(event.params.cToken);
  getOrCreateUnderlyingToken(event.params.cToken);

  let marketAddr = event.params.cToken.toHexString();
  getOrCreateMarket(marketAddr, event);

  // trigger CToken template
  CToken.create(event.params.cToken);
}

export function handleTransferSeizePaused(event: ActionPaused): void {
  // TransferSeizePaused applies to all markets
  if (event.params.action == "Transfer") {
    // reset market.isActive based on whether 'Transfer' is paused
    // 'Transfer' pause pauses all markets
    // once 'Transfer' is paused, it is no longer possible to deposit/withdraw
    let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));
    let marketAddrs = factoryContract.getAllMarkets();
    for (let i = 0; i < marketAddrs.length; i++) {
      let marketId = marketAddrs[i].toHexString();
      let market = Market.load(marketId);

      if (market != null) {
        market.isActive = !event.params.pauseState;

        market.save();
      } else {
        log.warning("Market {} does not exist.", [marketId]);
      }
    }
  }
}

export function handleMintBorrowPaused(event: ActionPaused1): void {
  // reset market.canBorrowFrom with ActionPaused event
  if (event.params.action == "Borrow") {
    let marketId = event.params.cToken.toHexString();
    let market = Market.load(marketId);
    if (market != null) {
      market.canBorrowFrom = !event.params.pauseState;
      market.save();
    } else {
      log.warning("Market {} does not exist.", [marketId]);
    }
  }
}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let marketId = event.params.cToken.toHexString();
  let market = Market.load(marketId);
  if (market != null) {
    let ltvFactor = event.params.newCollateralFactorMantissa
      .toBigDecimal()
      .div(decimalsToBigDecimal(MANTISSA_DECIMALS))
      .times(BIGDECIMAL_HUNDRED);
    market.maximumLTV = ltvFactor;
    market.liquidationThreshold = ltvFactor;
    market.save();
  } else {
    log.warning("Market {} does not exist.", [marketId]);
  }
}

export function handleNewCloseFactor(event: NewCloseFactor): void {
  // The liquidator may not repay more than what is allowed by the closeFactor
  // Nothing we need here
}

export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  // NewLiquidationIncentive applies to all markets
  let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));
  let marketAddrs = factoryContract.getAllMarkets();
  for (let i = 0; i < marketAddrs.length; i++) {
    let marketId = marketAddrs[i].toHexString();
    let market = Market.load(marketId);

    if (market != null) {
      let liquidationPenalty = event.params.newLiquidationIncentiveMantissa
        .toBigDecimal()
        .div(decimalsToBigDecimal(MANTISSA_DECIMALS))
        .minus(BIGDECIMAL_ONE)
        .times(BIGDECIMAL_HUNDRED);
      market.liquidationPenalty = liquidationPenalty;

      market.save();
    } else {
      log.warning("Market {} does not exist.", [marketId]);
    }
  }
}

export function handleDistributedBorrowerComp(event: DistributedBorrowerComp): void {
  let marketId = event.params.cToken.toHexString();
  // market.rewardTokens = [
  //    prefixID(INV_ADDRESS, RewardTokenType.DEPOSIT),
  //    prefixID(INV_ADDRESS, RewardTokenType.BORROW),
  //  ]
  let newEmissionsAmount = [BIGINT_ZERO, event.params.compDelta];
  updateMarketEmission(marketId, newEmissionsAmount, event);
}

export function handleDistributedSupplierComp(event: DistributedSupplierComp): void {
  let marketId = event.params.cToken.toHexString();
  // market.rewardTokens = [
  //    prefixID(INV_ADDRESS, RewardTokenType.DEPOSIT),
  //    prefixID(INV_ADDRESS, RewardTokenType.BORROW),
  //  ]
  let newEmissionsAmount = [event.params.compDelta, BIGINT_ZERO];
  updateMarketEmission(marketId, newEmissionsAmount, event);
}
